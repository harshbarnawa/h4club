#!/usr/bin/env node
/**
 * sync-twitter.js — X (Twitter) → Portfolio blog sync
 *
 * Mirrors your latest X posts into `src/data/posts.json`, keeping only the
 * newest MAX_POSTS entries.
 *
 * Providers (selected automatically):
 *   • Official X API v2  — used when X_BEARER_TOKEN is set. Reliable, but the
 *                          X API needs a paid "Basic" tier to read timelines.
 *   • Free widget source  — used when no token is set. Zero cost; reads X's
 *                          public syndication widget. X currently blocks that
 *                          widget for anonymous requests in many regions, so
 *                          the official API is the dependable option.
 *
 * Behaviour (both providers):
 *   • Ignores the pinned tweet, retweets and replies.
 *   • Skips tweets already in posts.json (dedupe by id).
 *   • Writes the file ONLY when there is at least one NEW post — so when there
 *     is nothing new it exits 0 without touching the file, and the GitHub
 *     Action can detect "no change" and skip committing.
 *   • Writes atomically (temp file + rename) so a crash never corrupts data.
 *   • Fails cleanly on missing config, network or rate-limit errors.
 *
 * Environment (username is the only required variable):
 *   X_USERNAME           — X handle without "@"     (default "harshbarnawa")
 *   X_BEARER_TOKEN       — optional; enables official API provider
 *   X_API_BASE           — official API base        (default https://api.x.com)
 *   X_SYNDICATION_BASE   — free widget base         (default https://cdn.syndication.twimg.com)
 *   POSTS_FILE           — output path               (default src/data/posts.json)
 *   MAX_POSTS            — how many posts to keep    (default 5)
 *   X_EXCLUDE            — official API kinds to skip (default "retweets,replies")
 *
 * Requires Node 18+ (uses the global fetch API). No dependencies.
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, "..")

// --------------------------------------------------------------- config ----
const API_BASE = process.env.X_API_BASE || "https://api.x.com"
const SYNDICATION_BASE = process.env.X_SYNDICATION_BASE || "https://cdn.syndication.twimg.com"
const USERNAME = (process.env.X_USERNAME || "harshbarnawa").replace(/^@/, "").trim()
const BEARER_TOKEN = (process.env.X_BEARER_TOKEN || "").trim()
const POSTS_FILE = path.resolve(
  process.env.POSTS_FILE || path.join(PROJECT_ROOT, "src", "data", "posts.json"),
)
const MAX_POSTS = Number(process.env.MAX_POSTS || 5)
const EXCLUDE = (process.env.X_EXCLUDE || "retweets,replies").trim()
const RETRIES = 3

// ---------------------------------------------------------------- helpers ----
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Prefer process.exitCode over process.exit(): forced exits can race an
 * in-flight fetch socket and crash on Windows (a known libuv assertion).
 * The event loop drains naturally once every connection is closed.
 */
function exit(code) {
  process.exitCode = code
}

function assertConfig() {
  if (!USERNAME) {
    console.error("[sync] missing required env var: X_USERNAME")
    exit(1)
  }
  if (!Number.isInteger(MAX_POSTS) || MAX_POSTS < 1) {
    console.error(`[sync] invalid MAX_POSTS: ${process.env.MAX_POSTS} (expected a positive integer)`)
    exit(1)
  }
}

/** GET a URL with retry + rate-limit handling. Throws on persistent failure. */
async function httpGet(url, headers = {}) {
  let lastError

  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        // Connection: close avoids lingering keep-alive sockets, which keeps
        // process.exit() clean on Windows (a known libuv assertion otherwise).
        headers: { Connection: "close", "User-Agent": "portfolio-blog-sync/1.0", Accept: "*/*", ...headers },
        redirect: "follow",
      })

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("retry-after") || 0)
        const waitMs = Math.min(retryAfter > 0 ? retryAfter * 1000 : 10_000, 15_000)
        console.warn(
          `[sync] rate limited (429) — retrying in ${Math.round(waitMs / 1000)}s (attempt ${attempt}/${RETRIES})`,
        )
        await sleep(waitMs)
        continue
      }

      if (!res.ok) {
        const body = await safeBody(res)
        throw new Error(`HTTP ${res.status}: ${body}`)
      }

      return res
    } catch (err) {
      lastError = err
      console.warn(`[sync] request failed (attempt ${attempt}/${RETRIES}): ${err.message}`)
      if (attempt < RETRIES) await sleep(attempt * 2000)
    }
  }

  throw new Error(`request failed after ${RETRIES} attempts — last error: ${lastError?.message}`, {
    cause: lastError,
  })
}

async function safeBody(res) {
  try {
    return (await res.text()).slice(0, 500)
  } catch {
    return "<unreadable response body>"
  }
}

/** Twitter dates ("Thu Aug 01 12:00:00 +0000 2026") and ISO both → ISO. */
function parseDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/** Drop t.co short links from the body — the real URL is exposed via `links`. */
function cleanText(text) {
  return (text || "").replace(/https?:\/\/t\.co\/[A-Za-z0-9]+/gi, "").replace(/\s+/g, " ").trim()
}

/** Keep only real external links; x.com / twitter.com links are self-references. */
function isExternalLink(url) {
  if (!url) return false
  try {
    const host = new URL(url).hostname.replace(/^www\./, "")
    return host !== "x.com" && host !== "twitter.com"
  } catch {
    return false
  }
}

// ------------------------------------------------ provider: official API ----
async function fetchOfficial() {
  console.log(`[sync] provider: official X API (@${USERNAME})`)

  const userUrl = `${API_BASE}/2/users/by/username/${encodeURIComponent(USERNAME)}?user.fields=pinned_tweet_id`
  const userRes = await httpGet(userUrl, { Authorization: `Bearer ${BEARER_TOKEN}` })
  const userData = await userRes.json()
  if (!userData?.data?.id) {
    throw new Error(`invalid user response for @${USERNAME} — check X_USERNAME and token permissions`)
  }
  const userId = userData.data.id
  const pinnedTweetId = userData.data.pinned_tweet_id ?? null

  const params = new URLSearchParams({
    max_results: "100",
    "tweet.fields": "created_at,entities,attachments",
    "media.fields": "type,url,preview_image_url",
    expansions: "attachments.media_keys",
  })
  if (EXCLUDE) params.set("exclude", EXCLUDE)

  const tweetsUrl = `${API_BASE}/2/users/${userId}/tweets?${params.toString()}`
  const tweetsRes = await httpGet(tweetsUrl, { Authorization: `Bearer ${BEARER_TOKEN}` })
  const data = await tweetsRes.json()

  if (!Array.isArray(data?.data)) {
    throw new Error("invalid timeline response — expected a data array")
  }

  const mediaById = new Map((data.includes?.media || []).map((m) => [m.media_key, m]))
  const profileUrl = `https://x.com/${USERNAME}`

  return data.data
    .filter((tweet) => tweet.id !== pinnedTweetId)
    .map((tweet) => {
      const entities = tweet.entities || {}
      const media = (tweet.attachments?.media_keys || [])
        .map((key) => mediaById.get(key))
        .filter(Boolean)
        .map((m) => ({
          type: m.type, // "photo" | "video" | "animated_gif"
          url: m.type === "photo" ? m.url : m.preview_image_url,
        }))
        .filter((m) => m.url)

      return {
        id: tweet.id,
        text: cleanText(tweet.text),
        createdAt: parseDate(tweet.created_at),
        url: `${profileUrl}/status/${tweet.id}`,
        media,
        hashtags: (entities.hashtags || []).map((h) => h.tag),
        links: (entities.urls || [])
          .map((u) => u.expanded_url || u.url)
          .filter(isExternalLink),
      }
    })
}

// ------------------------------------------------- provider: free widget ----
async function fetchFree() {
  console.log(`[sync] provider: free syndication widget (@${USERNAME})`)

  // The syndication widget needs to think it is a browser, not a bot.
  const url = `${SYNDICATION_BASE}/timeline/profile?screen_name=${encodeURIComponent(USERNAME)}&lang=en`
  const res = await httpGet(url, {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    Referer: "https://platform.twitter.com/",
  })
  const body = await res.text()

  // X returns an empty body to anonymous/blocked widget requests.
  if (!body.trim()) {
    console.warn(
      "[sync] free source returned an empty response — X currently blocks anonymous widget " +
        "access in many regions. Nothing was changed. Add X_BEARER_TOKEN (official API, " +
        "requires the paid Basic tier) for a reliable sync.",
    )
    return []
  }

  let data
  try {
    data = JSON.parse(body)
  } catch (err) {
    throw new Error(`invalid widget response: ${err.message}`, { cause: err })
  }

  const rawTweets = Array.isArray(data?.timeline?.tweet) ? data.timeline.tweet : []
  const pinnedTweetId = data?.pinned_tweet?.id_str || data?.pinned_tweet?.id || null
  const profileUrl = `https://x.com/${USERNAME}`

  return rawTweets
    .filter((tweet) => tweet.id_str !== pinnedTweetId && tweet.id !== pinnedTweetId)
    .filter((tweet) => !tweet.retweeted && !tweet.in_reply_to_status_id) // skip retweets + replies
    .map((tweet) => {
      const entities = tweet.entities || {}
      const media = (tweet.extended_entities?.media || entities.media || [])
        .map((m) => ({ type: m.type, url: m.media_url_https || m.media_url }))
        .filter((m) => m.url)

      return {
        id: tweet.id_str || tweet.id,
        text: cleanText(tweet.full_text || tweet.text),
        createdAt: parseDate(tweet.created_at),
        url: `${profileUrl}/status/${tweet.id_str || tweet.id}`,
        media,
        hashtags: (entities.hashtags || []).map((h) => h.text || h.tag),
        links: (entities.urls || [])
          .map((u) => u.expanded_url || u.url)
          .filter(isExternalLink),
      }
    })
    .filter((post) => post.id)
}

// ------------------------------------------------------------------ store ----
/** Load existing posts, tolerating a missing file. A corrupt file is treated as empty. */
function readExistingPosts() {
  if (!fs.existsSync(POSTS_FILE)) return []

  try {
    const parsed = JSON.parse(fs.readFileSync(POSTS_FILE, "utf8"))
    const posts = Array.isArray(parsed) ? parsed : parsed?.posts
    return Array.isArray(posts) ? posts : []
  } catch (err) {
    console.error(`[sync] warning: could not parse ${POSTS_FILE} (${err.message}) — rebuilding from fresh data`)
    return []
  }
}

const postTime = (post) => (post.createdAt ? new Date(post.createdAt).getTime() : 0)

function mergeAndTrim(existing, newPosts) {
  return [...existing, ...newPosts]
    .sort((a, b) => postTime(b) - postTime(a))
    .slice(0, MAX_POSTS)
}

/** Write the file atomically so a failure mid-write never leaves it corrupt. */
function writePosts(posts, profileUrl) {
  const payload = {
    updatedAt: new Date().toISOString(),
    source: profileUrl,
    posts,
  }

  const tmpFile = `${POSTS_FILE}.tmp`
  fs.mkdirSync(path.dirname(POSTS_FILE), { recursive: true })
  fs.writeFileSync(tmpFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8")
  fs.renameSync(tmpFile, POSTS_FILE)
  console.log(`[sync] wrote ${posts.length} post(s) to ${POSTS_FILE}`)
}

// ------------------------------------------------------------------ main ----
async function main() {
  assertConfig()
  const profileUrl = `https://x.com/${USERNAME}`

  const posts = BEARER_TOKEN ? await fetchOfficial() : await fetchFree()
  const existing = readExistingPosts()
  const existingIds = new Set(existing.map((p) => p.id))

  const newPosts = posts.filter((post) => !existingIds.has(post.id))

  if (newPosts.length === 0) {
    console.log("[sync] no new posts — nothing to do.")
    exit(0)
    return // exit() only sets the code — must not fall through and write
  }

  const merged = mergeAndTrim(existing, newPosts)
  writePosts(merged, profileUrl)
  console.log(`[sync] added ${newPosts.length} new post(s).`)
}

main().catch((err) => {
  console.error(`[sync] failed: ${err.message}`)
  exit(1)
})

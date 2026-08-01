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
 *   • Free source        — used when no token is set. Zero cost, no secrets:
 *                          X's public profile page (server-rendered for SEO)
 *                          lists the latest tweet ids, and publish.twitter.com's
 *                          oEmbed endpoint returns each tweet's text + date.
 *                          (The old syndication widget is now blocked by X for
 *                          anonymous requests, so it was replaced.)
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

// ------------------------------------------------- provider: free (no token) ----
/**
 * Free provider (no token): X's profile page is server-rendered for SEO, so it
 * ships the user's latest tweet ids in the HTML, and the oEmbed endpoint
 * (publish.twitter.com — the same one every site uses to embed a tweet) returns
 * each tweet's text and date. Together they give a zero-cost timeline, with no
 * secrets. X blocks the old syndication widget for anonymous requests, so this
 * replaces it.
 */

/** Minimal HTML entity decoder (oEmbed text arrives HTML-escaped). */
function decodeHtmlEntities(value) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " }
  return (value || "").replace(/&(#[0-9]+|#x[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, entity) => {
    if (entity[0] === "#") {
      const code =
        entity[1].toLowerCase() === "x"
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole
    }
    return named[entity] ?? whole
  })
}

async function fetchProfilePage() {
  const url = `https://x.com/${USERNAME}`
  const res = await httpGet(url, {
    // The profile page serves the full HTML (with tweet ids) to browser UAs.
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    Referer: "https://x.com/",
  })
  return await res.text()
}

/** Every /status/<id> the profile page server-renders — the latest tweets. */
function extractTweetIds(html) {
  const ids = [...html.matchAll(new RegExp(`/${USERNAME}/status/(\\d{15,19})`, "g"))].map((m) => m[1])
  return [...new Set(ids)]
}

/** X marks the pinned tweet in the embedded page state: component:"pinned_tweets". */
function extractPinnedTweetId(html) {
  const match = html.match(/tweet-(\d{15,19}):content:client_event_info[^}]*?"pinned_tweets"/)
  return match ? match[1] : null
}

async function fetchOEmbed(tweetId) {
  const url = `https://publish.twitter.com/oembed?${new URLSearchParams({
    url: `https://x.com/${USERNAME}/status/${tweetId}`,
    omit_script: "true",
    lang: "en", // forces an English month name in the date, so parsing is stable
  }).toString()}`
  const res = await httpGet(url)
  return await res.json()
}

/** Pull text, date and hashtags out of the oEmbed blockquote HTML. */
function parseOEmbed(data) {
  const html = data.html || ""
  const paragraph = html.match(/<p[^>]*>([\s\S]*?)<\/p>/)
  let text = paragraph ? paragraph[1] : ""

  text = text.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ")
  text = cleanText(decodeHtmlEntities(text))
  // oEmbed keeps self-referencing media links (pic.twitter.com/…) in the body.
  text = text.replace(/pic\.twitter\.com\/[A-Za-z0-9]+/gi, "").replace(/\s+/g, " ").trim()

  // The blockquote ends with the date anchor, e.g. ">July 12, 2026</a>".
  // Build the date at UTC noon so the displayed day never shifts with the TZ.
  const dateMatch = html.match(/>([A-Za-z]{3,9} \d{1,2}, \d{4})<\/a>\s*<\/blockquote>/)
  const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }
  let createdAt = null
  if (dateMatch) {
    const [monthName, day, year] = dateMatch[1].split(/[\s,]+/)
    const month = MONTHS[monthName.slice(0, 3)]
    if (month !== undefined && day && year) {
      createdAt = new Date(Date.UTC(Number(year), month, Number(day), 12)).toISOString()
    }
  }

  return {
    text,
    createdAt,
    hashtags: [...text.matchAll(/#([A-Za-z0-9_]+)/g)].map((m) => m[1]),
  }
}

async function fetchFree() {
  console.log(`[sync] provider: free profile page + oEmbed (@${USERNAME})`)

  const html = await fetchProfilePage()

  const tweetIds = extractTweetIds(html)
  if (tweetIds.length === 0) {
    console.warn(
      "[sync] profile page returned no tweet ids — X may have served a login wall. " +
        "Nothing was changed. If this persists, add X_BEARER_TOKEN (official API, " +
        "requires the paid Basic tier) for a reliable sync.",
    )
    return []
  }

  const pinnedTweetId = extractPinnedTweetId(html)
  if (pinnedTweetId) console.log(`[sync] skipping pinned tweet ${pinnedTweetId}`)

  const profileUrl = `https://x.com/${USERNAME}`
  const posts = []

  for (const id of tweetIds) {
    if (id === pinnedTweetId) continue
    try {
      const oEmbed = await fetchOEmbed(id)
      const { text, createdAt, hashtags } = parseOEmbed(oEmbed)
      if (!text) continue // media-only tweets have no text to render
      posts.push({
        id,
        text,
        createdAt,
        url: `${profileUrl}/status/${id}`,
        media: [],
        hashtags,
        links: [],
      })
    } catch (err) {
      console.warn(`[sync] oEmbed failed for tweet ${id}: ${err.message}`)
    }
  }

  return posts
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

# X (Twitter) → Blog Sync

Automatic sync of your X posts into the **Blog** section of this portfolio.
Your X account is the source of truth: every new post you publish appears on the
site within ~15 minutes, with zero manual work. Only the latest **5** posts are
ever stored and displayed.

---

## How it works

```
┌─────────────────────┐  every 15 min  ┌──────────────────────────┐
│ GitHub Actions      │ ─────────────▶ │ scripts/sync-twitter.js   │
│ twitter-sync.yml    │                │ (Node, zero dependencies) │
└─────────────────────┘                └────────────┬─────────────┘
                                                    │ provider auto-selected
                                    ┌───────────────┴────────────────┐
                                    │                                │
                      X_BEARER_TOKEN set?                    no token set
                                    │                                │
                        Official X API v2                   free widget
                        (reliable, paid Basic)              (zero cost)
                                    │                                │
                                    └──────────────┬─────────────────┘
                                                   │ new posts?
                                          ┌────────┴──────────┐
                                          │ no                 │ yes
                                          ▼                    ▼
                                   exit 0, no commit    update src/data/posts.json
                                                        (latest 5 only, atomic write)
                                                                │
                                                                ▼
                                                       commit + push
                                                            │
                                                            ▼
                                                   Vercel auto-deploys
```

Key decisions:

- **Only writes `posts.json` when there is a genuinely new post.** No new post →
  the script exits 0 without touching the file, and the workflow skips the commit.
- **Ignores the pinned tweet**, skips retweets/replies, **dedupes by tweet id**,
  and always trims to the latest 5, newest first.
- **Atomic writes** (temp file + rename) so a crash mid-run can never corrupt
  `posts.json`.
- **Zero runtime dependencies** — the sync script uses Node's built-in `fetch`
  (Node 18+). Nothing is added to the frontend bundle except the tiny JSON file.
- **Runs every 15 minutes** for fast turnaround. To switch to hourly, change the
  cron in `.github/workflows/twitter-sync.yml` to `23 * * * *`.

---

## Two data sources (pick one)

### 1. Free — no API key (default)

The script uses X's public **syndication widget**
(`cdn.syndication.twimg.com/timeline/profile?screen_name=…`) — the same feed
X powers its embed widgets with. **Zero cost, no secrets, no signup.**

⚠️ **Important caveat:** as of 2026 X blocks that widget for anonymous requests
in many regions. The sync script handles this gracefully (logs a clear warning,
leaves `posts.json` untouched). It *may* work from GitHub Actions' US runners —
the first run will tell you. If it comes back empty, switch to option 2.

### 2. Official X API — reliable (needs the paid Basic tier)

The X API **Free tier cannot read timelines** (it is write-only); reading your
own tweets requires the **Basic** plan (paid). Prices change — confirm the exact
amount in the [developer portal](https://developer.x.com/en/portal)
(historically ~$100–$200/month). The workflow only makes 2 API calls per run,
so any paid tier has huge headroom.

1. Developer portal → subscribe to a plan with read access.
2. Create an app → **Keys and tokens** → copy the **Bearer Token**.
3. Add it as the repo secret `X_BEARER_TOKEN`.
4. The script auto-switches to the official API — no code changes.

---

## GitHub Secrets (optional)

For the free path you need **none**. For the reliable official API add one:

| Secret             | Value                                                        |
| ------------------ | ------------------------------------------------------------ |
| `X_BEARER_TOKEN`   | Bearer token from your X app (option 2 above)                |

The username (`harshbarnawa`) is already hardcoded in the workflow — it isn't
sensitive.

---

## Make it live

1. Commit and push everything:

   ```bash
   git add -A
   git commit -m "feat(blog): auto-sync latest X posts"
   git push
   ```

2. Verify the workflow:
   - GitHub → **Actions** → **"Sync X posts to blog"** → **Run workflow**
     (manual trigger, so you don't wait for the 15-min cron).
   - Read the run log: it prints which provider it used and what happened.
   - Vercel picks up any push and redeploys automatically.

3. After that it runs itself. No manual steps.

> Branch protection on `main` will block the bot's push. Either allow the
> `github-actions` actor to push, or use a PAT. Most personal portfolios need no
> change.

---

## Local testing

```bash
# runs against the free widget source (no setup needed)
npm run sync:twitter

# force the official API (set the token in your shell / .env)
X_BEARER_TOKEN=... npm run sync:twitter
```

To preview the blog locally: `npm run dev`, then open `/blog`.

---

## Configuration reference

| Variable            | Default                        | Purpose                                        |
| ------------------- | ------------------------------ | ---------------------------------------------- |
| `X_USERNAME`        | `harshbarnawa`                 | X handle without `@`                          |
| `X_BEARER_TOKEN`    | —                              | Official API bearer token (optional)           |
| `X_API_BASE`        | `https://api.x.com`            | Official API base URL                          |
| `X_SYNDICATION_BASE`| `https://cdn.syndication.twimg.com` | Free widget base URL                      |
| `POSTS_FILE`        | `src/data/posts.json`          | Output file path                               |
| `MAX_POSTS`         | `5`                            | Max posts to keep / display                    |
| `X_EXCLUDE`         | `retweets,replies`             | Official API kinds to skip                     |

---

## Data format (`src/data/posts.json`)

```json
{
  "updatedAt": "2026-08-01T12:23:04.000Z",
  "source": "https://x.com/harshbarnawa",
  "posts": [
    {
      "id": "1958236925476712811",
      "text": "shipping the thing #launch",
      "createdAt": "2026-08-01T12:20:00.000Z",
      "url": "https://x.com/harshbarnawa/status/1958236925476712811",
      "media": [
        { "type": "photo", "url": "https://pbs.twimg.com/media/…jpg" }
      ],
      "hashtags": ["launch"],
      "links": ["https://example.com/post"]
    }
  ]
}
```

Notes:

- Tweet ids are **strings** (they exceed `Number.MAX_SAFE_INTEGER`).
- `media[].type` is `photo`, `video`, or `animated_gif`. Videos/GIFs store their
  thumbnail URL so the site renders them without hosting video files.
- `links` are the expanded URLs; `t.co` short links are stripped from `text`.
- Don't hand-edit this file — the workflow owns it. If it becomes corrupt, the
  script rebuilds it from fresh data on the next new post.

---

## Error handling

| Failure                              | Behaviour                                                              |
| ------------------------------------ | ---------------------------------------------------------------------- |
| Free widget blocked / empty response | Logs a clear warning, exits 0, leaves `posts.json` untouched.           |
| Missing `X_USERNAME`                 | Fails fast (exit 1) with a clear message.                               |
| Network / API / auth errors          | Retried 3× with backoff, then exit 1; `posts.json` untouched.           |
| Rate limit (HTTP 429)                | Waits for `Retry-After` (capped), retries; exit 1 if it persists.       |
| Invalid / empty API response         | Treated as "no new posts" (empty) or exit 1 (malformed); file untouched.|
| Corrupt local `posts.json`           | Rebuilt from fresh X data on the next run that has a new post.          |
| No new posts                         | Exit 0, no commit, no deploy — the normal steady state.                 |

---

## Files added/changed

```
.github/workflows/twitter-sync.yml   ← GitHub Action (15-min cron)
scripts/sync-twitter.js              ← sync logic (two providers, zero deps)
src/data/posts.json                  ← post data (latest 5)
src/components/PostCard.jsx          ← blog post card (matches design system)
src/pages/Blog.jsx                   ← renders the 5 posts + "See More on X"
package.json                         ← added "sync:twitter" script
eslint.config.js                     ← node globals for scripts/
X-BLOG-SYNC.md                       ← this document
```

---

## Troubleshooting

- **Log says "free source returned an empty response"** → X is blocking the free
  widget from that network. Add `X_BEARER_TOKEN` (option 2) and the script
  switches to the official API automatically.
- **Workflow fails with 401 / 403** → `X_BEARER_TOKEN` invalid, or the X plan
  doesn't include read access.
- **Nothing appears on the site** → check Vercel deployed the latest push, and
  that `src/data/posts.json` has posts (run the workflow manually).
- **More than 5 posts show** → shouldn't happen; the script trims to 5 and the
  page also slices to 5 defensively.

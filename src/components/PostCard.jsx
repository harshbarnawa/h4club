import { useTheme } from "../context/ThemeContext"

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
})

function formatDate(value) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return dateFormatter.format(date)
}

function hostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

function PostCard({ post }) {
  const { darkMode } = useTheme()
  const media = post.media?.length ? post.media : []
  const singleMedia = media.length === 1

  return (
    <article
      className={`group border rounded-[24px] p-6 md:p-8 transition-all duration-300 hover:-translate-y-1 ${
        darkMode
          ? "border-[#262626] bg-[#151515]/70"
          : "border-[#d8d8d8] bg-[#efefef]/70"
      }`}
    >
      {/* Post text */}
      <p
        className={`font-serif italic text-[15px] md:text-[17px] leading-[2] tracking-[-0.01em] whitespace-pre-line break-words ${
          darkMode ? "text-[#cfcfcf]" : "text-[#4a4a4a]"
        }`}
      >
        {post.text}
      </p>

      {/* Media */}
      {media.length > 0 && (
        <div className={`mt-5 ${singleMedia ? "" : "grid grid-cols-2 gap-3"}`}>
          {media.map((item, index) => (
            <div
              key={`${item.url}-${index}`}
              className={`relative overflow-hidden rounded-[16px] border ${
                singleMedia ? "" : "aspect-square"
              } ${darkMode ? "border-[#262626]" : "border-[#d8d8d8]"}`}
            >
              <img
                src={item.url}
                alt=""
                loading="lazy"
                className={`w-full ${singleMedia ? "h-auto block" : "h-full object-cover"}`}
              />
              {item.type !== "photo" && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="text-white text-[16px]">▶</span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hashtags */}
      {post.hashtags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-5">
          {post.hashtags.map((tag) => (
            <span
              key={tag}
              className={`border rounded-full px-3.5 py-1.5 text-[12px] transition duration-300 ${
                darkMode
                  ? "border-[#2b2b2b] bg-[#171717]/70 text-[#cfcfcf]"
                  : "border-[#d4d4d4] bg-[#f2f2f2]/70 text-[#4a4a4a]"
              }`}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* External links */}
      {post.links?.length > 0 && (
        <div className="flex flex-wrap gap-4 mt-4">
          {post.links.map((link, index) => (
            <a
              key={`${link}-${index}`}
              href={link}
              target="_blank"
              rel="noreferrer"
              className={`text-[11px] break-all transition ${
                darkMode
                  ? "text-[#7a7a7a] hover:text-white"
                  : "text-[#8a8a8a] hover:text-[#3a3a3a]"
              }`}
            >
              {hostname(link)} ↗
            </a>
          ))}
        </div>
      )}

      {/* Date + view on X */}
      <div
        className={`flex items-center justify-between gap-4 mt-6 pt-5 border-t ${
          darkMode ? "border-[#262626]" : "border-[#d8d8d8]"
        }`}
      >
        <p
          className={`text-[11px] uppercase tracking-[2px] ${
            darkMode ? "text-[#7a7a7a]" : "text-[#8a8a8a]"
          }`}
        >
          {formatDate(post.createdAt)}
        </p>
        <a
          href={post.url}
          target="_blank"
          rel="noreferrer"
          className={`px-4 py-2 rounded-[16px] text-[11px] uppercase tracking-[2px] border transition duration-300 flex items-center gap-1.5 ${
            darkMode
              ? "border-[#333] bg-[#1a1a1a] text-[#cfcfcf] hover:bg-[#252525]"
              : "border-[#ccc] bg-[#e8e8e8] text-[#555] hover:bg-[#ddd]"
          }`}
        >
          View on X ↗
        </a>
      </div>
    </article>
  )
}

export default PostCard

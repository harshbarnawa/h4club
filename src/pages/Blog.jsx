import Layout from "../components/Layout"
import PostCard from "../components/PostCard"
import { useTheme } from "../context/ThemeContext"
import blogData from "../data/posts.json"

const X_PROFILE_URL = blogData.source || "https://x.com/harshbarnawa"

function Blog() {
  const { darkMode } = useTheme()
  const posts = (blogData.posts || []).slice(0, 5)

  return (
    <Layout>
      <section
        className={`relative z-10 border-t min-h-screen ${
          darkMode ? "border-[#262626]" : "border-[#d8d8d8]"
        }`}
      >
        <div className="max-w-3xl mx-auto px-5 md:px-6 pt-40 pb-24">
          <h2
            className={`text-[11px] uppercase tracking-[3px] mb-12 ${
              darkMode ? "text-[#7a7a7a]" : "text-[#8a8a8a]"
            }`}
          >
            Blog
          </h2>

          {posts.length > 0 ? (
            <div className="flex flex-col gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div
              className={`border rounded-[24px] p-8 md:p-10 text-center ${
                darkMode
                  ? "border-[#262626] bg-[#151515]/70"
                  : "border-[#d8d8d8] bg-[#efefef]/70"
              }`}
            >
              <p
                className={`text-[32px] mb-6 ${
                  darkMode ? "text-[#444]" : "text-[#aaa]"
                }`}
              >
                ✎
              </p>
              <p
                className={`font-serif italic text-[17px] leading-[2] ${
                  darkMode ? "text-[#b5b5b5]" : "text-[#6a6a6a]"
                }`}
              >
                Posts from my X feed will appear here automatically.
              </p>
            </div>
          )}

          {/* See More on X */}
          <div className="mt-10 text-center">
            <a
              href={X_PROFILE_URL}
              target="_blank"
              rel="noreferrer"
              className={`inline-block px-6 py-3 rounded-full border text-[11px] uppercase tracking-[2px] transition duration-300 ${
                darkMode
                  ? "border-[#333] bg-[#1a1a1a] text-[#cfcfcf] hover:bg-[#252525]"
                  : "border-[#ccc] bg-[#e8e8e8] text-[#555] hover:bg-[#ddd]"
              }`}
            >
              See More on X ↗
            </a>
          </div>
        </div>
      </section>
    </Layout>
  )
}

export default Blog

import Layout from "../components/Layout"
import { useTheme } from "../context/ThemeContext"

function Renderer() {
  const { darkMode } = useTheme()

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
            Renderer
          </h2>

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
              ◇
            </p>
            <p
              className={`font-serif italic text-[17px] leading-[2] ${
                darkMode ? "text-[#b5b5b5]" : "text-[#6a6a6a]"
              }`}
            >
              Coming soon — something visual is cooking.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  )
}

export default Renderer

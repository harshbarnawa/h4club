import Layout from "../components/Layout"
import VoxelBuilder from "../components/VoxelBuilder"
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
        <div className="max-w-5xl mx-auto px-5 md:px-6 pt-40 pb-24">
          <h2
            className={`text-[11px] uppercase tracking-[3px] mb-8 ${
              darkMode ? "text-[#7a7a7a]" : "text-[#8a8a8a]"
            }`}
          >
            Renderer
          </h2>

          <p
            className={`font-serif italic text-[15px] mb-10 ${
              darkMode ? "text-[#b5b5b5]" : "text-[#6a6a6a]"
            }`}
          >
            Draw on the slate — every pixel becomes a cube in the viewport.
          </p>

          <VoxelBuilder />
        </div>
      </section>
    </Layout>
  )
}

export default Renderer

import Layout from "../components/Layout"
import { useTheme } from "../context/ThemeContext"
import { ProjectsData } from "../constants/projects"

function Projects() {
  const { darkMode } = useTheme()

  return (
    <Layout>
      <section
        className={`relative z-10 border-t min-h-screen ${
          darkMode ? "border-[#262626]" : "border-[#d8d8d8]"
        }`}
      >
        <div className="max-w-5xl mx-auto px-5 md:px-6 pt-40 pb-24">
          <div className="max-w-3xl mb-12">
            <h2
              className={`text-[11px] uppercase tracking-[3px] ${
                darkMode ? "text-[#7a7a7a]" : "text-[#8a8a8a]"
              }`}
            >
              Projects
            </h2>
          </div>

          {/* Grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ProjectsData.map((project) => {
              return (
                <div
                  key={project.title}
                  className={`group border rounded-[20px] overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                    darkMode
                      ? "border-[#262626] bg-[#151515]/70"
                      : "border-[#d8d8d8] bg-[#efefef]/70"
                  }`}
                >
                  {/* Clickable thumbnail */}
                  <a
                    href={project.live}
                    target="_blank"
                    rel="noreferrer"
                    className="block aspect-video relative overflow-hidden cursor-pointer"
                  >
                    {project.image && (
                      <img
                        src={project.image}
                        alt={`${project.title} preview`}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <span className="text-white text-[11px] uppercase tracking-[2px] border border-white/40 px-4 py-2 rounded-full backdrop-blur-sm">
                        View Project →
                      </span>
                    </div>
                  </a>

                  {/* Project info */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3
                        className={`font-medium text-[15px] tracking-[-0.02em] ${
                          darkMode ? "text-white" : "text-[#222]"
                        }`}
                      >
                        {project.title}
                      </h3>
                      <div className="flex items-center gap-3">
                        {project.live && (
                          <a
                            href={project.live}
                            target="_blank"
                            rel="noreferrer"
                            className={`text-[11px] transition ${
                              darkMode
                                ? "text-[#7a7a7a] hover:text-white"
                                : "text-[#8a8a8a] hover:text-[#3a3a3a]"
                            }`}
                          >
                            live ↗
                          </a>
                        )}
                        {project.repo && (
                          <a
                            href={project.repo}
                            target="_blank"
                            rel="noreferrer"
                            className={`text-[11px] transition ${
                              darkMode
                                ? "text-[#7a7a7a] hover:text-white"
                                : "text-[#8a8a8a] hover:text-[#3a3a3a]"
                            }`}
                          >
                            repo ↗
                          </a>
                        )}
                      </div>
                    </div>
                    <p
                      className={`text-[13px] leading-[1.7] ${
                        darkMode ? "text-[#a1a1a1]" : "text-[#5f5f5f]"
                      }`}
                    >
                      {project.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer note */}
          <p
            className={`text-[12px] mt-12 text-center ${
              darkMode ? "text-[#555]" : "text-[#999]"
            }`}
          >
            more projects brewing...
          </p>
        </div>
      </section>
    </Layout>
  )
}

export default Projects

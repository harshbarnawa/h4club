// pages/Projects.jsx

import Layout from "../components/Layout"

function Projects() {

  const projects = [

  {
    title: "OpenGuido",
    live: "https://marketplace.visualstudio.com/items?itemName=harshbarnawa.openguido",
    repo: "https://github.com/harshbarnawa/OpenGuidos",
    desc: "VS Code extension for easy code snippets, custom commands, competitive programming toolkit and faster development workflow."
  },

  {
    title: "h4chat",
    live: "https://h4chat.vercel.app/",
    repo: "https://github.com/h4dotai/h4chat",
    desc: "Random terminal style encrypted chat app...just realtime private communication with Go + WebSockets."
  },

  {
    title: "chessBee",
    live: "https://chessbee.vercel.app/",
    repo: "https://github.com/harshbarnawa/chessbee",
    desc: "Online/Offline chess platform with authentication, realtime gameplay logic and custom UI systems."
  },
  {
    title: "Go-Learn",
    live: "https://github.com/harshbarnawa/Go-learn",
    repo: "https://github.com/harshbarnawa/Go-learn",
    desc: "Backend development journey with Go, APIs, databases, concurrency and modern server-side concepts."
  },


  {
    title: "editostudios",
    live: "https://edito-studios.vercel.app/",
    repo: "https://github.com/harshbarnawa/editoStudios",
    desc: "Minimal creative agency website built with React and modern frontend interactions."
  },

  {
    title: "CodeForces",
    live: "https://codeforces.com/profile/harshbarnawa.info",
    repo: "https://github.com/harshbarnawa/CodeForces",
    desc: "Competitive programming, algorithmic problem solving, contest participation and advanced C++ practice."
  },

  {
    title: "LeetCode",
    live: "https://leetcode.com/u/harshtemp/",
    repo: "https://github.com/harshbarnawa/leetCode",
    desc: "Data Structures & Algorithms, interview preparation and problem solving across multiple topics."
  }

];

  return (

    <Layout>

      {(darkMode) => (

        <section
          className={`relative z-10 border-t min-h-screen ${
            darkMode
              ? "border-[#262626]"
              : "border-[#d8d8d8]"
          }`}
        >

          <div className="max-w-3xl mx-auto px-5 md:px-6 pt-40 pb-24">

            <h2
              className={`text-[11px] uppercase tracking-[3px] mb-12 ${
                darkMode
                  ? "text-[#7a7a7a]"
                  : "text-[#8a8a8a]"
              }`}
            >
              Projects
            </h2>

            <div className="space-y-16">

              {projects.map((project) => (

                <div key={project.title}>

                  <div className="flex flex-col gap-4">

                    <div className="flex items-center flex-wrap gap-4">

                      <h3
                        className={`font-medium text-[17px] tracking-[-0.02em] ${
                          darkMode
                            ? "text-white"
                            : "text-[#222]"
                        }`}
                      >
                        {project.title}
                      </h3>

                      <div className="flex items-center gap-4">

                        <a
                          href={project.live}
                          target="_blank"
                          rel="noreferrer"
                          className={`text-[12px] transition ${
                            darkMode
                              ? "text-[#7a7a7a] hover:text-white"
                              : "text-[#8a8a8a] hover:text-[#3a3a3a]"
                          }`}
                        >
                          live
                        </a>

                        <a
                          href={project.repo}
                          target="_blank"
                          rel="noreferrer"
                          className={`text-[12px] transition ${
                            darkMode
                              ? "text-[#7a7a7a] hover:text-white"
                              : "text-[#8a8a8a] hover:text-[#3a3a3a]"
                          }`}
                        >
                          repo
                        </a>

                      </div>

                    </div>

                    <p
                      className={`leading-[2] text-[15px] max-w-2xl ${
                        darkMode
                          ? "text-[#a1a1a1]"
                          : "text-[#5f5f5f]"
                      }`}
                    >
                      {project.desc}
                    </p>

                  </div>

                </div>

              ))}

            </div>

          </div>

        </section>

      )}

    </Layout>

  )
}

export default Projects
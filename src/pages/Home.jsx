import { useState, useRef, useEffect, useCallback } from "react"

import Layout from "../components/Layout"
import ContributionGraph from "../components/ContributionGraph"
import { useTheme } from "../context/ThemeContext"
import { SkillsData, ExploringData, Quotes } from "../constants/skills"

function Home() {
  const { darkMode } = useTheme()
  const [terminalOpen, setTerminalOpen] = useState(false)
  const [input, setInput] = useState("")
  const [history, setHistory] = useState([])
  const [cmdHistory, setCmdHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const inputRef = useRef(null)
  const bodyRef = useRef(null)

  useEffect(() => {
    if (terminalOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [terminalOpen])

  // Auto-scroll terminal when new output appears
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [history])

  const handleCommand = useCallback(
    (cmd) => {
      const command = cmd.trim()
      if (!command) return

      const lower = command.toLowerCase()
      let output = ""

      if (lower === "clear") {
        setHistory([])
        setInput("")
        return
      } else if (lower === "github") {
        window.open("https://github.com/harshbarnawa", "_blank")
        output = "opening github..."
      } else if (lower === "linkedin") {
        window.open("https://linkedin.com", "_blank")
        output = "opening linkedin..."
      } else if (lower === "blog") {
        window.location.href = "/blog"
        output = "navigating to blog..."
      } else if (lower === "projects") {
        window.location.href = "/projects"
        output = "navigating to projects..."
      } else if (lower === "renderer") {
        window.location.href = "/renderer"
        output = "navigating to renderer..."
      } else if (lower === "contact") {
        window.location.href = "/contact"
        output = "navigating to contact..."
      } else if (lower === "resume") {
        window.open("/assets/Resume.pdf", "_blank")
        output = "opening resume..."
      } else if (lower === "home") {
        window.location.href = "/"
        output = "already on home."
      } else if (lower === "whoami") {
        output = "harsh — a developer who overthings small details."
      } else if (lower === "date") {
        output = new Date().toLocaleString()
      } else if (lower === "quote") {
        output = Quotes[Math.floor(Math.random() * Quotes.length)]
      } else if (lower === "help") {
        output = `
  help       - show this list
  home       - navigate to home
  projects   - view projects
  blog       - go to blog
  renderer   - go to renderer
  contact    - go to contact
  github     - open github profile
  linkedin   - open linkedin
  resume     - download resume
  social     - show social links
  quote      - random quote
  whoami     - who are you?
  date       - current date & time
  clear      - clear terminal`
      } else if (lower === "social") {
        output = `
  github   → https://github.com/harshbarnawa
  linkedin → https://linkedin.com/in/harsh-barnawa
  twitter  → https://x.com/harshbarnawa
  email    → harshbarnawa.info@gmail.com`
      } else {
        const similar = ["help", "projects", "blog", "contact", "github"]
        const match = similar.find((s) => s.startsWith(lower))
        output = match
          ? `Command not found: ${command}. Did you mean "${match}"?`
          : `Command not found: ${command}. Type "help" for available commands.`
      }

      setHistory((prev) => [...prev, { command, output }])
      setCmdHistory((prev) => [command, ...prev.slice(0, 49)])
      setHistoryIndex(-1)
      setInput("")
    },
    [],
  )

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleCommand(input)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (cmdHistory.length === 0) return
      const newIdx =
        historyIndex < cmdHistory.length - 1 ? historyIndex + 1 : historyIndex
      setHistoryIndex(newIdx)
      setInput(cmdHistory[newIdx])
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIdx = historyIndex - 1
        setHistoryIndex(newIdx)
        setInput(cmdHistory[newIdx])
      } else {
        setHistoryIndex(-1)
        setInput("")
      }
    }
  }

  const quickStats = [
    { label: "projects", value: "10+" },
    { label: "CP problems", value: "200+" },
    { label: "Codeforces", value: "Rating 1200+" },
  ]

  return (
    <Layout>
      {/* Terminal modal */}
      {terminalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-5">
          <div
            className={`w-full max-w-4xl rounded-[24px] overflow-hidden border ${
              darkMode
                ? "border-[#2a2a2a] bg-[#111]"
                : "border-[#d8d8d8] bg-[#f5f5f5]"
            }`}
          >
            {/* Top bar */}
            <div
              className={`h-12 px-5 flex items-center justify-between border-b ${
                darkMode
                  ? "border-[#222] bg-[#181818]"
                  : "border-[#dddddd] bg-[#ececec]"
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTerminalOpen(false)}
                  className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 transition-all cursor-pointer"
                  aria-label="Close terminal"
                />
                <div className="w-3 h-3 rounded-full bg-[#febc2e] opacity-80" />
                <div className="w-3 h-3 rounded-full bg-[#28c840] opacity-80" />
              </div>
              <p
                className={`text-[13px] ${
                  darkMode ? "text-[#888]" : "text-[#666]"
                }`}
              >
                terminal — bash
              </p>
              <div className="w-12" />
            </div>

            {/* Terminal body */}
            <div
              ref={bodyRef}
              className={`p-6 font-mono text-[14px] leading-8 min-h-[500px] max-h-[70vh] overflow-y-auto ${
                darkMode ? "text-[#d1d1d1]" : "text-[#222]"
              }`}
            >
              <p className="text-[#28c840] mb-2">
                Welcome to Harsh@portfolio terminal v2.0
              </p>
              <p className="mb-1">
                Type <span className="underline underline-offset-2">"help"</span>{" "}
                to see available commands.
              </p>
              <p className="mb-4 text-[12px] opacity-50">
                ↑↓ to navigate history · TAB not yet supported
              </p>

              {history.map((item, index) => (
                <div key={index} className="mb-4">
                  <p>
                    <span className="text-[#28c840]">harsh</span>
                    <span className="opacity-70">@portfolio:~$</span>{" "}
                    {item.command}
                  </p>
                  <div className="whitespace-pre-line opacity-90">
                    {item.output}
                  </div>
                </div>
              ))}

              <div className="flex items-center">
                <span>
                  <span className="text-[#28c840]">harsh</span>
                  <span className="opacity-70">@portfolio:~$</span>
                </span>
                <span className="mx-2"> </span>
                <div className="relative flex-1 min-h-[1.2em]">
                  {/* Visible text + blinking block cursor */}
                  <span className="whitespace-pre">
                    {input}
                    <span className="inline-block w-[8px] h-[16px] bg-[#28c840] align-text-bottom ml-[1px] terminal-cursor" />
                  </span>
                  {/* Hidden input captures keystrokes */}
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="absolute inset-0 w-full bg-transparent text-transparent caret-transparent outline-none"
                    autoFocus
                    aria-label="Terminal input"
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="relative z-10 max-w-3xl mx-auto px-5 md:px-6 pt-40 md:pt-52 pb-24 md:pb-28">
        {/* Terminal button */}
        <div
          onClick={() => setTerminalOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && setTerminalOpen(true)}
          role="button"
          tabIndex={0}
          aria-label="Open terminal"
          className={`mb-8 flex items-center justify-between rounded-[16px] border px-4 py-3 cursor-pointer transition-all duration-300 ${
            darkMode
              ? "border-[#262626] bg-[#141414] hover:bg-[#181818]"
              : "border-[#d8d8d8] bg-[#f3f3f3] hover:bg-[#ececec]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            </div>
            <p
              className={`text-[13px] ${
                darkMode ? "text-[#a1a1a1]" : "text-[#666]"
              }`}
            >
              open terminal
            </p>
          </div>
          <p
            className={`text-[12px] ${
              darkMode ? "text-[#5f5f5f]" : "text-[#999]"
            }`}
          >
            bash
          </p>
        </div>

        {/* Profile card */}
        <div
          className={`border rounded-[28px] p-8 md:p-10 transition ${
            darkMode
              ? "border-[#262626] bg-[#151515]/70"
              : "border-[#d8d8d8] bg-[#efefef]/70"
          }`}
        >
          <div className="flex items-center justify-between mb-10">
            <p
              className={`text-[11px] uppercase tracking-[3px] ${
                darkMode ? "text-[#727272]" : "text-[#8a8a8a]"
              }`}
            >
              harsh barnawa
            </p>
            <img
              src="/me.jpeg"
              alt="Harsh Barnawa profile photo"
              className="w-[52px] h-[52px] object-cover rounded-2xl"
              loading="lazy"
            />
          </div>

          <p
            className={`font-serif italic text-[15px] md:text-[17px] leading-[2] tracking-[-0.01em] ${
              darkMode ? "text-[#cfcfcf]" : "text-[#4a4a4a]"
            }`}
          >
            I like building clean things and overthinking small details that
            probably don't matter that much. mostly building random projects,
            solving cpp problems and rebuilding things again because "something
            still feels off"
          </p>

          {/* Mini quick stats */}
          <div className="flex items-center justify-start gap-5 mt-6">
            {quickStats.map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-1.5">
                <span
                  className={`text-[15px] font-medium tracking-[-0.03em] ${
                    darkMode ? "text-white" : "text-[#222]"
                  }`}
                >
                  {stat.value}
                </span>
                <span
                  className={`text-[8px] uppercase tracking-[2px] ${
                    darkMode ? "text-[#7a7a7a]" : "text-[#8a8a8a]"
                  }`}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* inline buttons — right side */}
          <div className="flex items-center justify-end gap-2.5 mt-6">
            <a
              href="/assets/Resume.pdf"
              target="_blank"
              rel="noreferrer"
              className={`px-4 py-2 rounded-[16px] text-[11px] uppercase tracking-[2px] border transition duration-300 flex items-center gap-1.5 ${
                darkMode
                  ? "border-[#333] bg-[#1a1a1a] text-[#cfcfcf] hover:bg-[#252525]"
                  : "border-[#ccc] bg-[#e8e8e8] text-[#555] hover:bg-[#ddd]"
              }`}
            >
              <span>↓</span> Resume
            </a>
            <a
              href="/contact"
              className={`px-4 py-2 rounded-[16px] text-[11px] uppercase tracking-[2px] border transition duration-300 flex items-center gap-1.5 ${
                darkMode
                  ? "border-[#333] bg-[#1a1a1a] text-[#cfcfcf] hover:bg-[#252525]"
                  : "border-[#ccc] bg-[#e8e8e8] text-[#555] hover:bg-[#ddd]"
              }`}
            >
              <span>✉</span> Contact
            </a>
          </div>
        </div>

        {/* Links — Codeforces · LeetCode · Google */}
        <div className="mb-10 mt-14">
          <p
            className={`text-[11px] uppercase tracking-[3px] mb-2 ${
              darkMode ? "text-[#7a7a7a]" : "text-[#8a8a8a]"
            }`}
          >
            subtle fun facts about me
          </p>
          <div className="flex flex-wrap gap-3 mb-4">
            <a
              href="https://codeforces.com/profile/harshbarnawa.info"
              target="_blank"
              rel="noreferrer"
              className={`px-4 py-2 rounded-full text-[13px] border transition ${
                darkMode
                  ? "border-[#303030] bg-[#161616] text-[#cfcfcf] hover:bg-[#202020]"
                  : "border-[#d5d5d5] bg-white text-[#444] hover:bg-gray-50"
              }`}
            >
              Codeforces ↗
            </a>
            <a
              href="https://leetcode.com/u/harshtemp/"
              target="_blank"
              rel="noreferrer"
              className={`px-4 py-2 rounded-full text-[13px] border transition ${
                darkMode
                  ? "border-[#303030] bg-[#161616] text-[#cfcfcf] hover:bg-[#202020]"
                  : "border-[#d5d5d5] bg-white text-[#444] hover:bg-gray-50"
              }`}
            >
              LeetCode ↗
            </a>
            <a
              href="https://x.com/harshbarnawa/status/1958236925476712811?s=20"
              target="_blank"
              rel="noreferrer"
              className={`px-4 py-2 rounded-full text-[13px] border transition ${
                darkMode
                  ? "border-[#303030] bg-[#161616] text-[#cfcfcf] hover:bg-[#202020]"
                  : "border-[#d5d5d5] bg-white text-[#444] hover:bg-gray-50"
              }`}
            >
              Google Student Ambassador ↗
            </a>
          </div>
          <p
            className={`text-[14px] leading-[1.8] ${
              darkMode ? "text-[#666]" : "text-[#8a8a8a]"
            }`}
          >
            and grinding my github like this ↓
          </p>
        </div>

        {/* Interactive contribution graph */}
        <div
          className={`border rounded-[20px] p-5 mb-10 ${
            darkMode
              ? "border-[#262626] bg-[#151515]/70"
              : "border-[#d8d8d8] bg-[#efefef]/70"
          }`}
        >
          <ContributionGraph />
        </div>

        {/* Skills — pills */}
        <div className="mb-6">
          <p
            className={`text-[11px] uppercase tracking-[3px] mb-4 ${
              darkMode ? "text-[#7a7a7a]" : "text-[#8a8a8a]"
            }`}
          >
            skills
          </p>
          <div className="flex flex-wrap gap-2.5">
            {SkillsData.map(({ name, level }) => (
              <div key={name} className="group relative">
                <span
                  className={`border rounded-full px-3.5 py-1.5 text-[12px] transition duration-300 ${
                    darkMode
                      ? "border-[#2b2b2b] bg-[#171717]/70 text-[#cfcfcf]"
                      : "border-[#d4d4d4] bg-[#f2f2f2]/70 text-[#4a4a4a]"
                  }`}
                >
                  {name}
                </span>
                <span
                  className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border-2 ${
                    darkMode ? "border-[#111]" : "border-[#ededeb]"
                  } ${
                    level === "advanced"
                      ? "bg-[#28c840]"
                      : level === "intermediate"
                        ? "bg-[#febc2e]"
                        : "bg-[#ff5f57]"
                  }`}
                  title={level}
                />
              </div>
            ))}
          </div>

          {/* Tools */}
          <div className="mt-5">
            <div className="flex flex-wrap gap-2.5">
              {ExploringData.map((item) => (
                <span
                  key={item}
                  className={`border rounded-full px-3.5 py-1.5 text-[12px] italic ${
                    darkMode
                      ? "border-[#262626] text-[#8f8f8f]"
                      : "border-[#d6d6d6] text-[#666]"
                  }`}
                >
                  {item} ✦
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Click here to see more work */}
        <a
          href="/projects"
          className={`block w-full text-center border rounded-[16px] px-5 py-4 text-[13px] transition duration-300 ${
            darkMode
              ? "border-[#2b2b2b] bg-[#171717]/70 text-[#a1a1a1] hover:bg-[#202020] hover:text-white"
              : "border-[#d4d4d4] bg-[#f2f2f2]/70 text-[#666] hover:bg-[#e8e8e8] hover:text-[#333]"
          }`}
        >
          click here to see more work →
        </a>
      </section>
    </Layout>
  )
}

export default Home

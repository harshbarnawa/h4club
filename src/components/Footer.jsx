import { useTheme } from "../context/ThemeContext"

function Footer() {
  const { darkMode } = useTheme()

  return (
    <footer
      className={`relative z-10 border-t transition-colors duration-300 ${
        darkMode
          ? "border-[#262626] bg-[#161616]/80"
          : "border-[#d8d8d8] bg-[#e7e7e5]/80"
      }`}
    >
      <div
        className={`max-w-3xl mx-auto px-5 md:px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] ${
          darkMode ? "text-[#7a7a7a]" : "text-[#8a8a8a]"
        }`}
      >
        <p>© 2026 Harsh Barnawa</p>
        <p>Built by Harsh Barnawa</p>
      </div>
    </footer>
  )
}

export default Footer

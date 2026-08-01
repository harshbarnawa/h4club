import { Link } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"

function NotFound() {
  const { darkMode } = useTheme()

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-5 transition-colors duration-300 ${
        darkMode ? "bg-[#111111] text-[#e5e5e5]" : "bg-[#ededeb] text-[#2f2f2f]"
      }`}
    >
      <div className="text-center max-w-md">
        <p
          className={`text-[11px] uppercase tracking-[3px] mb-6 ${
            darkMode ? "text-[#7a7a7a]" : "text-[#8a8a8a]"
          }`}
        >
          Error 404
        </p>

        <h1 className="font-serif italic text-[32px] md:text-[40px] leading-[1.3] mb-6">
          This page doesn't exist.
        </h1>

        <p
          className={`text-[14px] leading-[1.8] mb-10 ${
            darkMode ? "text-[#777]" : "text-[#888]"
          }`}
        >
          looks like you wandered off somewhere. maybe the link was wrong, or
          the page got lost in the void.
        </p>

        <Link
          to="/"
          className={`inline-block px-6 py-3 rounded-[12px] text-[12px] uppercase tracking-[2px] border transition duration-300 ${
            darkMode
              ? "border-[#333] text-[#cfcfcf] hover:bg-[#1a1a1a]"
              : "border-[#ccc] text-[#555] hover:bg-[#e0e0e0]"
          }`}
        >
          back to home
        </Link>
      </div>
    </div>
  )
}

export default NotFound

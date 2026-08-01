import { useState } from "react"
import { NavLink, Link, useLocation } from "react-router-dom"

import { useTheme } from "../context/ThemeContext"
import { NavLinks } from "../constants/navigation"

function Navbar() {
  const { darkMode, setDarkMode } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  return (
    <nav
      className={`border-b fixed top-0 left-0 w-full z-50 backdrop-blur-sm transition-colors duration-300 ${
        darkMode ? "border-[#262626]" : "border-[#d8d8d8]"
      }`}
    >
      <div className="relative z-20 max-w-3xl mx-auto px-5 md:px-6 py-5 flex items-center justify-between">
        {/* Logo */}
        <div className="relative">
          <Link to="/" aria-label="Go to home page">
            <img
              src="/assets/logo.png"
              alt="Harsh Barnawa"
              className={`w-[100px] md:w-[140px] object-contain transition duration-300 ${
                darkMode ? "" : "invert brightness-75 opacity-80"
              }`}
            />
          </Link>

          {location.pathname === "/" && (
            <div className="flex justify-center mt-1">
              <span
                className={`w-1 h-1 rounded-full ${
                  darkMode ? "bg-white" : "bg-[#2f2f2f]"
                }`}
              />
            </div>
          )}
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6 text-[11px] uppercase tracking-[2px]">
            {NavLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative pb-3 transition-colors ${
                    isActive
                      ? darkMode
                        ? "text-white"
                        : "text-[#4a4a4a]"
                      : darkMode
                        ? "text-[#8a8a8a] hover:text-white"
                        : "text-[#8a8a8a] hover:text-[#4a4a4a]"
                  }`
                }
              >
                {({ isActive }) => (
                  <span className="relative">
                    {label}
                    {isActive && (
                      <span
                        className={`absolute left-1/2 -translate-x-1/2 -bottom-3 w-1 h-1 rounded-full transition-all duration-300 ${
                          darkMode ? "bg-white" : "bg-[#2f2f2f]"
                        }`}
                      />
                    )}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            className={`w-14 h-7 rounded-full flex items-center px-1 transition duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${
              darkMode
                ? "bg-[#2a2a2a] justify-end"
                : "bg-[#d0d0d0] justify-start"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center transition duration-300 ${
                darkMode ? "bg-white" : "bg-[#2f2f2f]"
              }`}
            >
              <img
                src={darkMode ? "/assets/moon.png" : "/assets/sun.png"}
                alt=""
                className={`w-3 h-3 object-contain ${darkMode ? "" : "invert"}`}
              />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden flex items-center gap-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            className={`w-12 h-6 rounded-full flex items-center px-1 transition duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 ${
              darkMode
                ? "bg-[#2a2a2a] justify-end"
                : "bg-[#d0d0d0] justify-start"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center transition duration-300 ${
                darkMode ? "bg-white" : "bg-[#2f2f2f]"
              }`}
            >
              <img
                src={darkMode ? "/assets/moon.png" : "/assets/sun.png"}
                alt=""
                className={`w-2 h-2 object-contain ${darkMode ? "" : "invert"}`}
              />
            </div>
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="flex flex-col gap-[4px] p-1"
          >
            <span
              className={`w-5 h-[1.5px] transition ${
                darkMode ? "bg-white" : "bg-black"
              }`}
            />
            <span
              className={`w-5 h-[1.5px] transition ${
                darkMode ? "bg-white" : "bg-black"
              }`}
            />
            <span
              className={`w-5 h-[1.5px] transition ${
                darkMode ? "bg-white" : "bg-black"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div
          className={`md:hidden border-t px-5 py-5 flex flex-col gap-5 text-[11px] uppercase tracking-[2px] relative z-20 ${
            darkMode
              ? "border-[#262626] bg-[#161616]/95 text-[#8a8a8a]"
              : "border-[#d8d8d8] bg-[#e7e7e5]/95 text-[#8a8a8a]"
          }`}
        >
          {NavLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`transition ${
                location.pathname === to
                  ? darkMode
                    ? "text-white"
                    : "text-[#4a4a4a]"
                  : darkMode
                    ? "text-[#8a8a8a] hover:text-white"
                    : "text-[#8a8a8a] hover:text-[#4a4a4a]"
              }`}
            >
              {label}
              {location.pathname === to && " •"}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}

export default Navbar

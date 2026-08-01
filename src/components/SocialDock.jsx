import { useTheme } from "../context/ThemeContext"
import { DockLinks } from "../constants/social"

function SocialDock() {
  const { darkMode } = useTheme()

  return (
    <div className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-50 flex-col gap-4">
      {DockLinks.map(({ icon, link, alt }) => (
        <a
          key={alt}
          href={link}
          target={link.startsWith("mailto") ? undefined : "_blank"}
          rel={link.startsWith("mailto") ? undefined : "noreferrer"}
          aria-label={alt}
          className={`group w-12 h-12 rounded-full border flex items-center justify-center backdrop-blur-md transition duration-300 ${
            darkMode
              ? "border-[#2b2b2b] bg-[#161616]/80 hover:bg-[#1f1f1f]"
              : "border-[#d8d8d8] bg-[#f3f3f3]/80 hover:bg-white"
          }`}
        >
          <img
            src={icon}
            alt={alt}
            className={`w-5 h-5 object-contain opacity-60 group-hover:opacity-100 transition duration-300 ${
              darkMode ? "invert group-hover:invert-0" : ""
            }`}
          />
        </a>
      ))}
    </div>
  )
}

export default SocialDock

import { useTheme } from "../context/ThemeContext"
import Navbar from "./Navbar"
import Footer from "./Footer"
import SocialDock from "./SocialDock"

function Layout({ children }) {
  const { darkMode } = useTheme()

  return (
    <div
      className={`min-h-screen text-sm transition-colors duration-300 relative overflow-x-hidden ${
        darkMode
          ? "bg-[#111111] text-[#e5e5e5]"
          : "bg-[#ededeb] text-[#2f2f2f]"
      }`}
    >
      <Navbar />
      <SocialDock />
      <main className="page-enter">{children}</main>
      <Footer />
    </div>
  )
}

export default Layout

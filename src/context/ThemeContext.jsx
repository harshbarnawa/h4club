/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react"

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode")
    return saved !== null ? JSON.parse(saved) : true
  })

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode))
  }, [darkMode])

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

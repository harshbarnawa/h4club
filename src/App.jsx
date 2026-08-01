import { useEffect } from "react"
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"

import Home from "./pages/Home"
import Blog from "./pages/Blog"
import Projects from "./pages/Projects"
import Contact from "./pages/Contact"
import Renderer from "./pages/Renderer"
import NotFound from "./pages/NotFound"

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [pathname])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/renderer" element={<Renderer />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

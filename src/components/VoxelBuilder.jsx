import { useEffect, useRef, useState } from "react"
import { useTheme } from "../context/ThemeContext"
import VoxelViewport from "./VoxelViewport"

const DEFAULT_SIZE = 10
const SIZE_OPTIONS = [10, 20, 30, 40, 50]
const MAX_HISTORY = 40
const STORAGE_KEY = "voxelBuilderState"

const PALETTE = [
  "#4f8cff",
  "#22c55e",
  "#f43f5e",
  "#facc15",
  "#a855f7",
  "#fb923c",
  "#06b6d4",
  "#ec4899",
  "#a8a29e",
  "#f8fafc",
]

// Sample designs — X marks a filled pixel
const PRESETS = [
  {
    name: "H",
    emoji: "🅗",
    color: "#4f8cff",
    rows: [
      "..........",
      "..X....X..",
      "..X....X..",
      "..X....X..",
      "..XXXXXX..",
      "..X....X..",
      "..X....X..",
      "..X....X..",
      "..........",
      "..........",
    ],
  },
  {
    name: "Smiley",
    emoji: "😄",
    color: "#facc15",
    rows: [
      "...XXXX...",
      "..x....x..",
      ".X......X.",
      "X.XX..XX.X",
      "X........X",
      "X........X",
      "X..XXXX..X",
      ".X......X.",
      "..XX..XX..",
      "...XXXX...",
    ],
  },
  {
    name: "Heart",
    emoji: "❤️",
    color: "#f43f5e",
    rows: [
      ".XX....XX.",
      "XXXX..XXXX",
      "XXXXXXXXXX",
      "XXXXXXXXXX",
      ".XXXXXXXX.",
      "..XXXXXX..",
      "...XXXX...",
      "....XX....",
      "..........",
      "..........",
    ],
  },
  {
    name: "Diamond",
    emoji: "💠",
    color: "#a855f7",
    rows: [
      "....XX....",
      "...XXXX...",
      "..XXXXXX..",
      ".XXXXXXXX.",
      "XXXXXXXXXX",
      ".XXXXXXXX.",
      "..XXXXXX..",
      "...XXXX...",
      "....XX....",
      "..........",
    ],
  },
]

function emptyGrid(size) {
  return Array.from({ length: size }, () => Array(size).fill(null))
}

function cloneGrid(grid) {
  return grid.map((row) => [...row])
}

function loadSavedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    const { grid: g, gridSize: s, extrude: e } = JSON.parse(saved)
    if (Array.isArray(g) && g.length === s && s >= 5) {
      return { grid: g, size: s, extrude: typeof e === "number" ? e : 2 }
    }
  } catch {
    // ignore corrupted state
  }
  return null
}

// Small line icons for the tool buttons (stroke inherits currentColor → theme-aware)
function ToolIcon({ name, className = "w-4 h-4" }) {
  const paths = {
    draw: <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />,
    erase: (
      <>
        <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
        <path d="M22 21H7" />
        <path d="m5 11 9 9" />
      </>
    ),
    fill: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />,
    undo: (
      <>
        <path d="M3 7v6h6" />
        <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
      </>
    ),
    redo: (
      <>
        <path d="M21 7v6h-6" />
        <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
      </>
    ),
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

function VoxelBuilder() {
  const { darkMode } = useTheme()

  // Load persisted state once via lazy init (avoids setState-in-effect)
  const [savedState] = useState(loadSavedState)
  const [gridSize, setGridSize] = useState(savedState?.size ?? DEFAULT_SIZE)
  const [grid, setGrid] = useState(() => savedState?.grid ?? emptyGrid(DEFAULT_SIZE))
  const [tool, setTool] = useState("draw")
  const [activeColor, setActiveColor] = useState(PALETTE[0])
  const [extrude, setExtrude] = useState(savedState?.extrude ?? 2)
  const [autoRotate, setAutoRotate] = useState(false)
  const [showEdges, setShowEdges] = useState(false)
  const [viewportBg, setViewportBg] = useState("auto") // auto | white | black
  const [symMode, setSymMode] = useState("off") // off | h | v | both
  const [isDrawing, setIsDrawing] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // Mirror of the committed state, so history snapshots read the latest grid
  const stateRef = useRef({ grid, size: gridSize })
  useEffect(() => {
    stateRef.current = { grid, size: gridSize }
  }, [grid, gridSize])

  const pastRef = useRef([])
  const futureRef = useRef([])
  const strokePushedRef = useRef(false)
  const apiRef = useRef(null)

  // ----- history -----
  const snap = () => ({ grid: cloneGrid(stateRef.current.grid), size: stateRef.current.size })

  const pushPast = (snapshot) => {
    pastRef.current.push(snapshot)
    if (pastRef.current.length > MAX_HISTORY) pastRef.current.shift()
    futureRef.current = []
    setCanUndo(true)
    setCanRedo(false)
  }

  const undo = () => {
    if (pastRef.current.length === 0) return
    const prev = pastRef.current.pop()
    futureRef.current.push(snap())
    setGridSize(prev.size)
    setGrid(prev.grid)
    setCanUndo(pastRef.current.length > 0)
    setCanRedo(true)
  }

  const redo = () => {
    if (futureRef.current.length === 0) return
    const next = futureRef.current.pop()
    pastRef.current.push(snap())
    setGridSize(next.size)
    setGrid(next.grid)
    setCanRedo(futureRef.current.length > 0)
    setCanUndo(true)
  }

  // ----- drawing -----
  const getSymCells = (r, c) => {
    if (symMode === "off") return [[r, c]]
    const s = gridSize - 1
    const cells = [[r, c]]
    if (symMode === "h" || symMode === "both") cells.push([r, s - c])
    if (symMode === "v" || symMode === "both") cells.push([s - r, c])
    if (symMode === "both") cells.push([s - r, s - c])
    return cells
  }

  const paint = (r, c) => {
    setGrid((prev) => {
      const cells = getSymCells(r, c)
      const value = tool === "erase" ? null : activeColor
      const next = prev.map((row) => [...row])
      let changed = false
      for (const [cr, cc] of cells) {
        if (next[cr][cc] !== value) {
          next[cr][cc] = value
          changed = true
        }
      }
      return changed ? next : prev
    })
  }

  const bucketFill = (r, c) => {
    const size = grid.length
    const target = grid[r][c]
    if (target === activeColor) return
    const next = grid.map((row) => [...row])
    const stack = [[r, c]]
    while (stack.length) {
      const [cr, cc] = stack.pop()
      if (cr < 0 || cc < 0 || cr >= size || cc >= size) continue
      if (next[cr][cc] !== target) continue
      next[cr][cc] = activeColor
      stack.push([cr + 1, cc], [cr - 1, cc], [cr, cc + 1], [cr, cc - 1])
    }
    pushPast(snap())
    setGrid(next)
  }

  const beginStroke = () => {
    if (strokePushedRef.current) return
    pushPast(snap())
    strokePushedRef.current = true
  }

  const endStroke = () => {
    setIsDrawing(false)
    strokePushedRef.current = false
  }

  const onCellPointerDown = (r, c, e) => {
    e.preventDefault()
    if (tool === "fill") {
      bucketFill(r, c)
      return
    }
    beginStroke()
    paint(r, c)
  }

  const onCellPointerEnter = (r, c) => {
    if (!isDrawing || tool === "fill") return
    beginStroke()
    paint(r, c)
  }

  // ----- actions -----
  const clear = () => {
    pushPast(snap())
    setGrid(emptyGrid(gridSize))
  }

  const changeSize = (s) => {
    if (s === gridSize) return
    pushPast(snap())
    setGridSize(s)
    setGrid(emptyGrid(s))
  }

  const loadPreset = (preset) => {
    pushPast(snap())
    const size = preset.rows.length
    setGridSize(size)
    setGrid(preset.rows.map((row) => row.split("").map((ch) => (ch.toLowerCase() === "x" ? preset.color : null))))
    setActiveColor(preset.color)
    setTool("draw")
  }

  const cycleBg = () =>
    setViewportBg((b) => (b === "auto" ? "white" : b === "white" ? "black" : "auto"))

  // ----- keyboard shortcuts (Ctrl/Cmd+Z / +Shift+Z / +Y) -----
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      if (k === "z" && e.shiftKey) {
        e.preventDefault()
        redo()
      } else if (k === "z") {
        e.preventDefault()
        undo()
      } else if (k === "y") {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  // ----- auto-save -----
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ grid, gridSize, extrude }))
      } catch {
        // storage may be unavailable
      }
    }, 300)
    return () => clearTimeout(t)
  }, [grid, gridSize, extrude])

  const filled = grid.flat().filter(Boolean).length

  const card = darkMode
    ? "border-[#262626] bg-[#151515]/70"
    : "border-[#d8d8d8] bg-[#efefef]/70"
  const micro = darkMode ? "text-[#7a7a7a]" : "text-[#8a8a8a]"
  const btnInactive = darkMode
    ? "border-[#2b2b2b] bg-[#1c1c1c] text-[#a1a1a1] hover:bg-[#242424]"
    : "border-[#d4d4d4] bg-white text-[#5f5f5f] hover:bg-[#f4f4f4]"
  // Active/selected state inverts the button — white in dark mode, black in light
  const btnActive = darkMode
    ? "bg-white text-black border-transparent"
    : "bg-black text-white border-transparent"
  const btnDisabled = `${btnInactive} opacity-40 cursor-not-allowed`
  const iconBtn = "w-8 h-8 rounded-full border flex items-center justify-center transition shrink-0"
  const cellEmpty = darkMode
    ? "bg-[#1c1c1c] hover:bg-[#262626]"
    : "bg-[#e4e4e7] hover:bg-[#d6d6da]"

  return (
    <>
      <div className="grid gap-8 md:grid-cols-2 items-start">
        {/* 2D slate */}
        <div className={`border rounded-[24px] p-6 ${card}`}>
          <div className="mb-5 flex items-center justify-between">
            <h3 className={`text-[10px] uppercase tracking-[2px] ${micro}`}>Slate · {gridSize}×{gridSize}</h3>
            <span className={`text-[11px] ${micro}`}>
              {filled} block{filled === 1 ? "" : "s"}
            </span>
          </div>

          {/* tools */}
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            {["draw", "erase", "fill"].map((t) => (
              <button
                key={t}
                onClick={() => setTool(t)}
                title={t}
                aria-label={t}
                className={`${iconBtn} ${tool === t ? btnActive : btnInactive}`}
              >
                <ToolIcon name={t} />
              </button>
            ))}
            <button
              onClick={undo}
              disabled={!canUndo}
              title="Undo"
              aria-label="Undo"
              className={`${iconBtn} ${canUndo ? btnInactive : btnDisabled}`}
            >
              <ToolIcon name="undo" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              title="Redo"
              aria-label="Redo"
              className={`${iconBtn} ${canRedo ? btnInactive : btnDisabled}`}
            >
              <ToolIcon name="redo" />
            </button>
            <button
              onClick={clear}
              title="Clear"
              className={`px-3 py-1.5 rounded-full border text-[11px] uppercase tracking-[1px] transition ${btnInactive}`}
            >
              Clear
            </button>
          </div>

          {/* symmetry */}
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] uppercase tracking-[2px] mr-1 ${micro}`}>Mirror</span>
            {["off", "h", "v", "both"].map((m) => (
              <button
                key={m}
                onClick={() => setSymMode(m)}
                className={`px-2.5 py-1.5 rounded-full border text-[11px] uppercase transition ${
                  symMode === m ? btnActive : btnInactive
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* palette */}
          <div className="mb-5 flex items-center gap-2.5 flex-wrap">
            {PALETTE.map((col) => (
              <button
                key={col}
                onClick={() => setActiveColor(col)}
                title={col}
                aria-label={`Pick color ${col}`}
                className={`w-6 h-6 rounded-full border transition ${
                  activeColor === col
                    ? `ring-2 ${darkMode ? "ring-white" : "ring-black"} scale-110 border-black/20`
                    : "border-black/20 hover:scale-110"
                }`}
                style={{ backgroundColor: col }}
              />
            ))}
            <input
              type="color"
              value={activeColor}
              onChange={(e) => setActiveColor(e.target.value)}
              title="Custom color"
              aria-label="Custom color picker"
              className="w-6 h-6 rounded-full border border-black/20 cursor-pointer overflow-hidden p-0"
              style={{ backgroundColor: activeColor }}
            />
          </div>

          {/* presets */}
          <div className="mb-5 flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] uppercase tracking-[2px] mr-1 ${micro}`}>Presets</span>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => loadPreset(p)}
                title={p.name}
                aria-label={`Load ${p.name} preset`}
                className={`w-8 h-8 rounded-full border flex items-center justify-center text-[15px] leading-none transition ${btnInactive}`}
              >
                {p.emoji}
              </button>
            ))}
          </div>

          {/* grid */}
          <div
            className="select-none touch-none grid gap-[2px] w-full max-w-[420px] mx-auto"
            style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
            onPointerDown={() => setIsDrawing(true)}
            onPointerUp={() => endStroke()}
            onPointerLeave={() => endStroke()}
          >
            {Array.from({ length: gridSize * gridSize }, (_, i) => {
              const r = Math.floor(i / gridSize)
              const c = i % gridSize
              const cell = grid[r][c]
              return (
                <div
                  key={i}
                  onPointerDown={(e) => onCellPointerDown(r, c, e)}
                  onPointerEnter={() => onCellPointerEnter(r, c)}
                  className={`aspect-square rounded-[2px] cursor-pointer transition-colors duration-75 ${
                    cell ? "" : cellEmpty
                  }`}
                  style={cell ? { backgroundColor: cell } : undefined}
                />
              )
            })}
          </div>

          {/* grid size */}
          <div className="mt-5 flex items-center gap-2 flex-wrap justify-center">
            <span className={`text-[10px] uppercase tracking-[2px] mr-1 ${micro}`}>Grid</span>
            {SIZE_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => changeSize(s)}
                className={`px-2.5 py-1.5 rounded-full border text-[11px] transition ${
                  gridSize === s ? btnActive : btnInactive
                }`}
              >
                {s}×{s}
              </button>
            ))}
          </div>
        </div>

        {/* 3D viewport */}
        <div className={`border rounded-[24px] overflow-hidden ${card}`}>
          <div className="p-6 pb-0">
            <div className="mb-5 flex items-center justify-between">
              <h3 className={`text-[10px] uppercase tracking-[2px] ${micro}`}>Viewport</h3>
              <span className={`text-[11px] ${micro}`}>drag rotate · scroll zoom</span>
            </div>

            <div className="mb-3">
              <div className={`mb-1 flex items-center justify-between text-[10px] uppercase tracking-[2px] ${micro}`}>
                <span>Height</span>
                <span>{extrude}</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={extrude}
                onChange={(e) => setExtrude(Number(e.target.value))}
                className={`w-full ${darkMode ? "accent-white" : "accent-black"}`}
              />
            </div>

            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setAutoRotate((v) => !v)}
                className={`px-3 py-1.5 rounded-full border text-[11px] uppercase tracking-[1px] transition ${
                  autoRotate ? btnActive : btnInactive
                }`}
              >
                Rotate
              </button>
              <button
                onClick={() => setShowEdges((v) => !v)}
                className={`px-3 py-1.5 rounded-full border text-[11px] uppercase tracking-[1px] transition ${
                  showEdges ? btnActive : btnInactive
                }`}
              >
                Edges
              </button>
              <button
                onClick={cycleBg}
                title="Cycle viewport background"
                className={`px-3 py-1.5 rounded-full border text-[11px] uppercase tracking-[1px] transition ${
                  viewportBg !== "auto" ? btnActive : btnInactive
                }`}
              >
                BG · {viewportBg}
              </button>
              <button
                onClick={() => apiRef.current?.capture()}
                title="Download 3D view as PNG"
                className={`px-3 py-1.5 rounded-full border text-[11px] uppercase tracking-[1px] transition ${btnInactive}`}
              >
                PNG
              </button>
              <button
                onClick={() => apiRef.current?.reset()}
                title="Reset camera view"
                className={`px-3 py-1.5 rounded-full border text-[11px] uppercase tracking-[1px] transition ${btnInactive}`}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="h-[320px] md:h-[420px]">
            <VoxelViewport
              grid={grid}
              size={gridSize}
              extrude={extrude}
              showEdges={showEdges}
              autoRotate={autoRotate}
              viewportBg={viewportBg}
              apiRef={apiRef}
            />
          </div>
        </div>
      </div>

      {/* full version CTA */}
      <div className="mt-12 text-center">
        <a
          href="https://pixeldraw3d.vercel.app"
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-full border text-[12px] uppercase tracking-[2px] transition hover:-translate-y-0.5 ${
            darkMode
              ? "bg-white text-black border-white hover:bg-[#e5e5e5]"
              : "bg-black text-white border-black hover:bg-[#2f2f2f]"
          }`}
        >
          Use the full version — click here
          <span aria-hidden="true">↗</span>
        </a>
        <p className={`mt-3 text-[11px] ${micro}`}>pixeldraw3d.vercel.app</p>
      </div>
    </>
  )
}

export default VoxelBuilder

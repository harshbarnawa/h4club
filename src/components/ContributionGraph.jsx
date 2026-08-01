import { useState, useEffect } from "react"
import { useTheme } from "../context/ThemeContext"

const API_URL =
  "https://github-contributions-api.jogruber.de/v4/harshbarnawa?y=2026"

function pad(n) {
  return String(n).padStart(2, "0")
}

function fmtDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function ContributionGraph() {
  const { darkMode } = useTheme()
  const [weeks, setWeeks] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tooltip, setTooltip] = useState(null)

  useEffect(() => {
    let cancelled = false

    fetch(API_URL)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return

        const totalContributions = data.total?.["2026"] || 0
        setTotal(totalContributions)

        // Build lookup: date string → { count, level }
        const map = {}
        for (const c of data.contributions || []) {
          if (c.level === 0 || c.count === 0) continue // skip only when count is 0 AND level is 0
          // level comes as number 0–4
          const level = typeof c.level === "number" ? c.level : Number(c.level) || 0
          map[c.date] = { count: c.count, level }
        }

        // Find the first Sunday on or before the first data date
        const firstDate = new Date(data.contributions[0]?.date + "T00:00:00")
        if (!firstDate || isNaN(firstDate)) {
          setError(true)
          setLoading(false)
          return
        }
        const start = new Date(firstDate)
        start.setDate(firstDate.getDate() - firstDate.getDay()) // go to Sunday

        // Build 53 weeks (full year grid)
        const allWeeks = []
        const current = new Date(start)

        for (let w = 0; w < 53; w++) {
          const week = []
          for (let d = 0; d < 7; d++) {
            const ds = fmtDate(current)
            const entry = map[ds]
            week.push({
              date: ds,
              count: entry ? entry.count : 0,
              level: entry ? entry.level : 0,
            })
            current.setDate(current.getDate() + 1)
          }
          allWeeks.push(week)
        }

        setWeeks(allWeeks)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Level → opacity for monochrome look
  const getOpacity = (level) => {
    const mapping = [0.04, 0.15, 0.35, 0.55, 0.85]
    return mapping[level] ?? 0.04
  }

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""]

  // Calculate month labels for each column
  const monthLabels = []
  for (let wi = 0; wi < weeks.length; wi++) {
    const week = weeks[wi]
    for (let di = 0; di < week.length; di++) {
      const d = week[di]
      if (d.count > 0 || d.level > 0) {
        const date = new Date(d.date + "T00:00:00")
        if (date.getDate() <= 7) {
          const label = date.toLocaleDateString("en-US", { month: "short" })
          if (!monthLabels.length || monthLabels[monthLabels.length - 1].label !== label) {
            monthLabels.push({ week: wi, label })
          }
        }
        break
      }
    }
  }

  if (loading) {
    return (
      <div
        className={`w-full rounded-[16px] border flex items-center justify-center h-[140px] ${
          darkMode
            ? "border-[#262626] bg-[#151515]/70"
            : "border-[#d8d8d8] bg-[#efefef]/70"
        }`}
      >
        <p className={`text-[12px] ${darkMode ? "text-[#555]" : "text-[#999]"}`}>
          loading contributions...
        </p>
      </div>
    )
  }

  if (error || weeks.length === 0) {
    return (
      <div
        className={`w-full rounded-[16px] border overflow-hidden ${
          darkMode
            ? "border-[#262626] bg-[#151515]/70"
            : "border-[#d8d8d8] bg-[#efefef]/70"
        }`}
      >
        <img
          src={`https://ghchart.rshah.org/${
            darkMode ? "4a4a4a" : "2f2f2f"
          }/harshbarnawa`}
          alt="GitHub contribution graph"
          className="w-full opacity-80"
          loading="lazy"
        />
      </div>
    )
  }

  const allCells = weeks.flat()
  const numWeeks = weeks.length
  const cellColor = darkMode ? "#e5e5e5" : "#2f2f2f"

  return (
    <div className="relative select-none">
      {/* Month labels */}
      <div
        className={`flex text-[10px] mb-[3px] ${
          darkMode ? "text-[#555]" : "text-[#999]"
        }`}
        style={{ paddingLeft: "32px" }}
      >
        {Array.from({ length: numWeeks }).map((_, wi) => {
          const ml = monthLabels.find((m) => m.week === wi)
          return (
            <div key={wi} className="flex-1 text-left">
              {ml ? ml.label : ""}
            </div>
          )
        })}
      </div>

      {/* Graph area: day labels + grid */}
      <div className="flex gap-[3px]">
        {/* Day labels column */}
        <div className="flex flex-col gap-[2px] pt-0">
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className={`text-[10px] leading-none flex items-center justify-end pr-1.5 h-[11px] ${
                darkMode ? "text-[#555]" : "text-[#999]"
              }`}
              style={{ marginBottom: "2px" }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid container — overflow-hidden, no scroll */}
        <div className="flex-1 overflow-hidden">
          <div
            className="grid"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${numWeeks}, 1fr)`,
              gridTemplateRows: "repeat(7, 1fr)",
              gridAutoFlow: "column",
              gap: "2px",
            }}
          >
            {allCells.map((day, i) => (
              <div
                key={i}
                className="relative"
                style={{ aspectRatio: "1" }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setTooltip({
                    x: rect.left + rect.width / 2,
                    y: rect.top - 8,
                    date: day.date,
                    count: day.count,
                  })
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                <div
                  className="absolute inset-0 rounded-[2px] transition-opacity duration-100"
                  style={{
                    opacity: getOpacity(day.level),
                    backgroundColor: cellColor,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Total */}
      <div
        className={`mt-3 text-[10px] ${
          darkMode ? "text-[#555]" : "text-[#999]"
        }`}
      >
        <strong className={darkMode ? "text-[#aaa]" : "text-[#666]"}>
          {total.toLocaleString()}
        </strong>{" "}
        contributions in the last year
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-[999] pointer-events-none px-2.5 py-1.5 rounded-[8px] text-[11px] whitespace-nowrap -translate-x-1/2"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            backgroundColor: darkMode ? "#222" : "#e8e8e8",
            color: darkMode ? "#ccc" : "#444",
            border: `1px solid ${darkMode ? "#333" : "#ccc"}`,
          }}
        >
          <strong>{tooltip.count}</strong> contribution
          {tooltip.count !== 1 ? "s" : ""} on{" "}
          {new Date(tooltip.date + "T00:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      )}
    </div>
  )
}

export default ContributionGraph

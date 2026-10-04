// The marks drawn on a pattern, as one plain object. Every coordinate is a
// fraction of the page (0 = left/top, 1 = right/bottom), so marks stay in the
// right place whatever the screen size.
export const EMPTY_MARKS = {
  highlights: [], strokes: [], stickers: [], bookmarks: [], bar: null, chart: null,
}

export function normalizeMarks(marks) {
  return { ...EMPTY_MARKS, ...(marks ?? {}) }
}

export const HIGHLIGHT_COLORS = ['#FBE38E', '#F8C7D2', '#BFE6E8', '#F4B3A8']
export const PEN_COLORS = ['#E88FA4', '#2F7C84', '#4A4445', '#E5A300']
export const PEN_WIDTHS = [2, 4, 8]
export const STICKERS = { star: '⭐', warning: '⚠️', heart: '💗', check: '✅', note: '📝' }

// Move the highlighter bar down by its own height for each finished row, and
// on to the next page when it runs off the bottom.
export function moveBar(bar, rows, pageCount) {
  if (!bar || rows === 0) return bar
  let { page, y } = bar
  y += bar.h * rows
  while (y > 1 - bar.h && page < pageCount - 1) { y -= 1; page += 1; y = Math.max(0, y) }
  while (y < 0 && page > 0) { y += 1; page -= 1 }
  return { ...bar, page, y: Math.min(1 - bar.h, Math.max(0, y)) }
}

// Charts are read from the bottom up, so a finished row moves the crosshair
// UP one cell.
export function moveChart(chart, rows) {
  if (!chart || rows === 0) return chart
  return { ...chart, y: Math.min(1, Math.max(0, chart.y - chart.cellH * rows)) }
}

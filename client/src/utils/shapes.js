// The maths behind the pattern-shaped progress picture. Pure functions: no
// React, no DOM, so every number here can be tested on its own.
//
// Everything is drawn in a 200 x 200 box. A shape is divided into "segments"
// (rings for a granny square, horizontal bands for a hat or a ball). A pattern
// with 72 rows would give hairline segments, so rows are grouped: segment i
// covers rows  i*total/n  to  (i+1)*total/n.

export const SHAPES = [
  { id: 'dots', label: 'Dots' },
  { id: 'granny', label: 'Granny square' },
  { id: 'hat', label: 'Bucket hat' },
  { id: 'ball', label: 'Ball' },
]

// Pick a sensible picture from the project's name, until the person chooses one.
export function guessShape({ title = '', pattern_ref = '' } = {}) {
  const text = `${title} ${pattern_ref}`.toLowerCase()
  if (/granny|square|motif|blanket|afghan/.test(text)) return 'granny'
  if (/\bhat\b|beanie|bucket|\bcap\b/.test(text)) return 'hat'
  if (/amigurumi|plush|\bball\b|\btoy\b|frog|bear|bunny|doll|ami\b/.test(text)) return 'ball'
  return 'dots'
}

const clamp01 = (n) => Math.min(1, Math.max(0, n))

export const segmentCount = (totalRows, max) => Math.max(1, Math.min(totalRows, max))

// How finished segment i is, from 0 (untouched) to 1 (done). The segment you
// are working on comes out between the two, which is what lets a ring or band
// fill up gradually instead of jumping a whole step at a time.
export function segmentProgress(i, segments, currentRow, totalRows) {
  const size = totalRows / segments
  return clamp01((currentRow - i * size) / size)
}

// ---- Granny square: concentric square rings, centre first -------------------
// The middle ring is a solid square; every ring after it is a square outline
// whose stroke width is the ring's thickness (less a small gap).
export function grannyRings(totalRows, { half = 92, core = 12, max = 12 } = {}) {
  const n = segmentCount(totalRows, max)
  const step = n > 1 ? (half - core) / (n - 1) : 0
  return Array.from({ length: n }, (_, i) => {
    const h = core + i * step                 // distance from the centre to the middle of this ring
    return { i, x: 100 - h, y: 100 - h, size: h * 2, stroke: i === 0 ? 0 : step * 0.78, solid: i === 0 }
  })
}

// ---- Bucket hat and ball: silhouettes cut into horizontal bands --------------
// Both are crocheted from the top down, so band 0 is the top.
export const HAT = {
  // crown and sides, then the brim; drawn together as one clip region
  paths: [
    'M54 46 Q100 28 146 46 L158 124 Q100 138 42 124 Z',
    'M42 124 Q100 138 158 124 Q197 132 197 150 Q100 178 3 150 Q3 132 42 124 Z',
  ],
  top: 30, bottom: 172, bands: 28,
}
export const BALL = { cx: 100, cy: 100, r: 78, top: 22, bottom: 178, bands: 24 }

export function bands({ top, bottom }, total, count) {
  const n = segmentCount(total, count)
  const h = (bottom - top) / n
  return Array.from({ length: n }, (_, i) => ({ i, y: top + i * h, h }))
}

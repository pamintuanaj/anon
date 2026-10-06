import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

// Makes a position:fixed element draggable with the mouse, a finger, or the
// arrow keys, and remembers where it was left.
//
// The position is stored as a FRACTION (0 to 1) of the space the element can
// move in, not as pixels. That way a counter parked in the bottom-right corner
// on a big monitor is still in the bottom-right corner after the window is
// shrunk, rotated, or opened on a phone. Until the first drag, no position is
// stored and the CSS default corner applies.

const KEY = 'crocheta:counter-pos'
const MARGIN = 12      // never closer than this to a screen edge
const STEP = 16        // arrow key nudge; Shift makes it 64

const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

function loadFraction() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      return { x: clamp(saved.x, 0, 1), y: clamp(saved.y, 0, 1) }
    }
  } catch { /* private mode or bad data: use the default corner */ }
  return null
}

function saveFraction(fraction) {
  try {
    if (fraction) localStorage.setItem(KEY, JSON.stringify(fraction))
    else localStorage.removeItem(KEY)
  } catch { /* storage unavailable: the position just will not survive a reload */ }
}

// The rectangle the element's top-left corner is allowed to move in. On phones
// the bottom navigation bar is off limits so the counter can't be hidden by it.
function getBounds(el) {
  let reserve = 0
  if (window.matchMedia('(max-width: 768px)').matches) {
    const root = getComputedStyle(document.documentElement)
    const raw = root.getPropertyValue('--bottom-bar').trim()
    const value = parseFloat(raw)
    reserve = Number.isFinite(value) ? (raw.endsWith('rem') ? value * parseFloat(root.fontSize) : value) : 72
  }
  const minX = MARGIN
  const minY = MARGIN
  return {
    minX, minY,
    maxX: Math.max(minX, window.innerWidth - el.offsetWidth - MARGIN),
    maxY: Math.max(minY, window.innerHeight - el.offsetHeight - MARGIN - reserve),
  }
}

const toPixels = (f, b) => ({ x: b.minX + f.x * (b.maxX - b.minX), y: b.minY + f.y * (b.maxY - b.minY) })
const toFraction = (p, b) => ({
  x: b.maxX > b.minX ? clamp((p.x - b.minX) / (b.maxX - b.minX), 0, 1) : 1,
  y: b.maxY > b.minY ? clamp((p.y - b.minY) / (b.maxY - b.minY), 0, 1) : 1,
})

export function useDraggablePill() {
  const ref = useRef(null)
  const [fraction, setFraction] = useState(loadFraction)   // the remembered position
  const [pixels, setPixels] = useState(null)               // where it is drawn right now
  const [dragging, setDragging] = useState(false)
  const drag = useRef(null)
  const pixelsRef = useRef(null)
  pixelsRef.current = pixels

  // Turn the remembered fraction into pixels before the first paint, and again
  // whenever the window changes size.
  useLayoutEffect(() => {
    if (!fraction || !ref.current) return setPixels(null)
    setPixels(toPixels(fraction, getBounds(ref.current)))
  }, [fraction])

  useEffect(() => {
    if (!fraction) return
    const onResize = () => ref.current && setPixels(toPixels(fraction, getBounds(ref.current)))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [fraction])

  const remember = useCallback((p) => {
    const next = toFraction(p, getBounds(ref.current))
    setFraction(next)
    saveFraction(next)
  }, [])

  function onPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    // + and - must stay ordinary taps. Only the grip button and the empty
    // parts of the pill start a drag.
    if (event.target.closest('button') && !event.target.closest('[data-drag-handle]')) return
    const rect = ref.current.getBoundingClientRect()
    drag.current = { id: event.pointerId, dx: event.clientX - rect.left, dy: event.clientY - rect.top }
    ref.current.setPointerCapture(event.pointerId)   // keep getting moves even if the finger slips off
    setDragging(true)
  }

  function onPointerMove(event) {
    const d = drag.current
    if (!d || d.id !== event.pointerId) return
    const b = getBounds(ref.current)
    setPixels({ x: clamp(event.clientX - d.dx, b.minX, b.maxX), y: clamp(event.clientY - d.dy, b.minY, b.maxY) })
  }

  function endDrag(event) {
    const d = drag.current
    if (!d || d.id !== event.pointerId) return
    drag.current = null
    setDragging(false)
    if (pixelsRef.current) remember(pixelsRef.current)   // a plain tap that never moved stores nothing new
  }

  const reset = useCallback(() => {
    setFraction(null)
    setPixels(null)
    saveFraction(null)
  }, [])

  // Keyboard users: arrow keys nudge it, Home sends it back to the corner.
  function onGripKeyDown(event) {
    if (event.key === 'Home') { event.preventDefault(); return reset() }
    const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key]
    if (!dir) return
    event.preventDefault()
    const el = ref.current
    const b = getBounds(el)
    const rect = el.getBoundingClientRect()
    const from = pixelsRef.current ?? { x: rect.left, y: rect.top }
    const step = event.shiftKey ? STEP * 4 : STEP
    const next = { x: clamp(from.x + dir[0] * step, b.minX, b.maxX), y: clamp(from.y + dir[1] * step, b.minY, b.maxY) }
    setPixels(next)
    remember(next)
  }

  return {
    ref,
    dragging,
    moved: pixels !== null,
    style: pixels ? { left: pixels.x, top: pixels.y, right: 'auto', bottom: 'auto' } : undefined,
    pillProps: { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag },
    gripProps: { onKeyDown: onGripKeyDown, onDoubleClick: reset },
  }
}

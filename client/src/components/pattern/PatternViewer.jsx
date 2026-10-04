import { useEffect, useRef, useState } from 'react'
import { loadPages } from './loadPages.js'
import {
  normalizeMarks, moveBar, moveChart, HIGHLIGHT_COLORS, PEN_COLORS, PEN_WIDTHS, STICKERS,
} from './marks.js'
import { Hand, RectangleHorizontal, Highlighter, Pencil, Sticker, Crosshair, Bookmark, Eraser, Undo2, Eye, EyeOff } from 'lucide-react'
import styles from './PatternViewer.module.css'

const TOOLS = [
  { id: 'none', Icon: Hand, label: 'Scroll' },
  { id: 'bar', Icon: RectangleHorizontal, label: 'Row bar' },
  { id: 'highlight', Icon: Highlighter, label: 'Highlight' },
  { id: 'draw', Icon: Pencil, label: 'Draw' },
  { id: 'sticker', Icon: Sticker, label: 'Sticker' },
  { id: 'chart', Icon: Crosshair, label: 'Chart' },
  { id: 'bookmark', Icon: Bookmark, label: 'Bookmark' },
  { id: 'erase', Icon: Eraser, label: 'Erase' },
]

// Where on the page (as fractions 0 to 1) a pointer event happened.
function pointOn(element, event) {
  const box = element.getBoundingClientRect()
  return [
    Math.min(1, Math.max(0, (event.clientX - box.left) / box.width)),
    Math.min(1, Math.max(0, (event.clientY - box.top) / box.height)),
  ]
}

// Crop a bookmark's area out of its page image, for the pinned strip.
function Snippet({ bookmark, image }) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    const img = image
    if (!img) return
    const draw = () => {
      const sx = bookmark.x * img.naturalWidth, sy = bookmark.y * img.naturalHeight
      const sw = Math.max(1, bookmark.w * img.naturalWidth), sh = Math.max(1, bookmark.h * img.naturalHeight)
      const canvas = document.createElement('canvas')
      canvas.width = Math.min(900, sw)
      canvas.height = canvas.width * (sh / sw)
      canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
      try { setSrc(canvas.toDataURL('image/png')) } catch { setSrc(null) }
    }
    if (img.complete) draw(); else img.addEventListener('load', draw, { once: true })
  }, [bookmark, image])
  return src ? <img src={src} alt="" className={styles.snippetImg} /> : null
}

export default function PatternViewer({ pattern, fileUrl, rowSignal, onSaveMarks }) {
  const [pages, setPages] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [marks, setMarks] = useState(() => normalizeMarks(pattern.marks))
  const [tool, setTool] = useState('none')
  const [hlColor, setHlColor] = useState(HIGHLIGHT_COLORS[0])
  const [penColor, setPenColor] = useState(PEN_COLORS[0])
  const [penWidth, setPenWidth] = useState(PEN_WIDTHS[1])
  const [sticker, setSticker] = useState('star')
  const [hidden, setHidden] = useState(false)
  const [draft, setDraft] = useState(null)          // the rectangle or stroke being drawn right now
  const [saveState, setSaveState] = useState('saved')
  const [history, setHistory] = useState([])        // which list each new mark went into, for Undo
  const pageRefs = useRef([])
  const imageRefs = useRef([])
  const firstMarks = useRef(true)
  const lastRow = useRef(rowSignal)

  // Load (or reload) the file whenever a different pattern is shown.
  useEffect(() => {
    let cancelled = false
    setPages(null)
    setLoadError(null)
    loadPages(pattern, fileUrl)
      .then((result) => { if (!cancelled) setPages(result) })
      .catch((error) => { if (!cancelled) setLoadError(error.message || 'Could not open this pattern') })
    return () => { cancelled = true }
  }, [pattern.id, fileUrl])

  // Save marks a moment after the last change, not on every pen movement.
  useEffect(() => {
    if (firstMarks.current) { firstMarks.current = false; return }
    setSaveState('saving')
    const timer = setTimeout(async () => {
      try { await onSaveMarks(marks); setSaveState('saved') } catch { setSaveState('failed') }
    }, 700)
    return () => clearTimeout(timer)
  }, [marks])  // eslint-disable-line react-hooks/exhaustive-deps

  // When the row counter moves, a "follow" bar and the chart crosshair move too.
  useEffect(() => {
    const delta = rowSignal - lastRow.current
    lastRow.current = rowSignal
    if (!delta || !pages) return
    setMarks((m) => ({
      ...m,
      bar: m.bar?.follow ? moveBar(m.bar, delta, pages.length) : m.bar,
      chart: m.chart?.follow ? moveChart(m.chart, delta) : m.chart,
    }))
  }, [rowSignal, pages])

  const add = (list, item) => {
    setMarks((m) => ({ ...m, [list]: [...m[list], item] }))
    setHistory((h) => [...h, list])
  }

  function undo() {
    const list = history[history.length - 1]
    if (!list) return
    setMarks((m) => ({ ...m, [list]: m[list].slice(0, -1) }))
    setHistory((h) => h.slice(0, -1))
  }

  function removeMark(list, index) {
    setMarks((m) => ({ ...m, [list]: m[list].filter((_, i) => i !== index) }))
  }

  // ---- Pointer handling on a page ------------------------------------------
  function onPointerDown(event, pageIndex) {
    if (tool === 'none' || tool === 'erase') return
    const surface = pageRefs.current[pageIndex]
    const [x, y] = pointOn(surface, event)
    surface.setPointerCapture?.(event.pointerId)

    if (tool === 'bar') {
      setMarks((m) => {
        const h = m.bar?.h ?? 0.035
        return { ...m, bar: { page: pageIndex, y: Math.max(0, Math.min(1 - h, y - h / 2)), h, color: m.bar?.color ?? '#FBE38E', follow: m.bar?.follow ?? true } }
      })
      setDraft({ kind: 'bar', page: pageIndex })
    } else if (tool === 'chart') {
      setMarks((m) => ({ ...m, chart: { cellW: 0.03, cellH: 0.03, color: '#8ED0D6', follow: true, ...m.chart, page: pageIndex, x, y } }))
    } else if (tool === 'sticker') {
      const note = sticker === 'note' ? (window.prompt('Note for this sticker:') ?? '').slice(0, 120) : ''
      add('stickers', { page: pageIndex, x, y, icon: sticker, note })
    } else if (tool === 'draw') {
      setDraft({ kind: 'stroke', page: pageIndex, points: [[x, y]] })
    } else {
      setDraft({ kind: tool, page: pageIndex, x0: x, y0: y, x, y })   // highlight or bookmark rectangle
    }
  }

  function onPointerMove(event, pageIndex) {
    if (!draft || draft.page !== pageIndex) return
    const [x, y] = pointOn(pageRefs.current[pageIndex], event)
    if (draft.kind === 'bar') {
      setMarks((m) => ({ ...m, bar: { ...m.bar, page: pageIndex, y: Math.max(0, Math.min(1 - m.bar.h, y - m.bar.h / 2)) } }))
    } else if (draft.kind === 'stroke') {
      setDraft((d) => ({ ...d, points: [...d.points, [x, y]] }))
    } else {
      setDraft((d) => ({ ...d, x, y }))
    }
  }

  function onPointerUp() {
    if (!draft) return
    if (draft.kind === 'stroke' && draft.points.length > 1) {
      add('strokes', { page: draft.page, color: penColor, width: penWidth, points: draft.points })
    } else if (draft.kind === 'highlight' || draft.kind === 'bookmark') {
      const rect = {
        page: draft.page, x: Math.min(draft.x0, draft.x), y: Math.min(draft.y0, draft.y),
        w: Math.abs(draft.x - draft.x0), h: Math.abs(draft.y - draft.y0),
      }
      if (rect.w > 0.01 && rect.h > 0.005) {
        if (draft.kind === 'highlight') add('highlights', { ...rect, color: hlColor })
        else add('bookmarks', { ...rect, label: (window.prompt('Name this bookmark:', 'Sizes') ?? 'Bookmark').slice(0, 40) || 'Bookmark' })
      }
    }
    setDraft(null)
  }

  // ---- Small controls ------------------------------------------------------
  const setBar = (change) => setMarks((m) => (m.bar ? { ...m, bar: { ...m.bar, ...change } } : m))
  const nudgeChart = (dx, dy) => setMarks((m) => (m.chart
    ? { ...m, chart: { ...m.chart, x: Math.min(1, Math.max(0, m.chart.x + dx * m.chart.cellW)), y: Math.min(1, Math.max(0, m.chart.y + dy * m.chart.cellH)) } }
    : m))
  const sizeChart = (factor) => setMarks((m) => (m.chart
    ? { ...m, chart: { ...m.chart, cellW: Math.min(0.2, Math.max(0.005, m.chart.cellW * factor)), cellH: Math.min(0.2, Math.max(0.005, m.chart.cellH * factor)) } }
    : m))

  const [openBookmark, setOpenBookmark] = useState(null)

  if (loadError) return <p className={styles.message} role="alert">{loadError}</p>
  if (!pages) return <p className={styles.message}>Opening the pattern...</p>

  const interactive = tool !== 'none'
  const pageMarks = (list, index) => marks[list].map((m, i) => ({ ...m, i })).filter((m) => m.page === index)

  return (
    <div className={styles.viewer}>
      <div className={styles.toolbar} role="toolbar" aria-label="Pattern tools">
        <div className={styles.tools}>
          {TOOLS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTool(t.id)} aria-pressed={tool === t.id}
              className={`${styles.tool} ${tool === t.id ? styles.active : ''}`} title={t.label}>
              <t.Icon size={20} aria-hidden="true" /><span className={styles.toolLabel}>{t.label}</span>
            </button>
          ))}
        </div>
        <div className={styles.options}>
          {tool === 'highlight' && HIGHLIGHT_COLORS.map((c) => (
            <button key={c} type="button" className={`${styles.dot} ${hlColor === c ? styles.dotOn : ''}`}
              style={{ background: c }} onClick={() => setHlColor(c)} aria-label={`Highlight colour ${c}`} />
          ))}
          {tool === 'draw' && (
            <>
              {PEN_COLORS.map((c) => (
                <button key={c} type="button" className={`${styles.dot} ${penColor === c ? styles.dotOn : ''}`}
                  style={{ background: c }} onClick={() => setPenColor(c)} aria-label={`Pen colour ${c}`} />
              ))}
              {PEN_WIDTHS.map((w) => (
                <button key={w} type="button" className={`${styles.width} ${penWidth === w ? styles.dotOn : ''}`}
                  onClick={() => setPenWidth(w)} aria-label={`Pen width ${w}`}><span style={{ height: w }} /></button>
              ))}
            </>
          )}
          {tool === 'sticker' && Object.entries(STICKERS).map(([id, icon]) => (
            <button key={id} type="button" className={`${styles.stickerPick} ${sticker === id ? styles.dotOn : ''}`}
              onClick={() => setSticker(id)} aria-label={`Sticker ${id}`}>{icon}</button>
          ))}
          {tool === 'bar' && (
            marks.bar ? (
              <>
                <button type="button" className={styles.mini} onClick={() => setBar({ h: Math.max(0.01, marks.bar.h - 0.005) })}>Thinner</button>
                <button type="button" className={styles.mini} onClick={() => setBar({ h: Math.min(0.2, marks.bar.h + 0.005) })}>Thicker</button>
                {HIGHLIGHT_COLORS.map((c) => (
                  <button key={c} type="button" className={`${styles.dot} ${marks.bar.color === c ? styles.dotOn : ''}`}
                    style={{ background: c }} onClick={() => setBar({ color: c })} aria-label={`Bar colour ${c}`} />
                ))}
                <label className={styles.follow}><input type="checkbox" checked={marks.bar.follow}
                  onChange={(e) => setBar({ follow: e.target.checked })} /> Moves down with each row</label>
                <button type="button" className={styles.mini} onClick={() => setMarks((m) => ({ ...m, bar: null }))}>Remove</button>
              </>
            ) : <span className={styles.hintText}>Tap the line you are on.</span>
          )}
          {tool === 'chart' && (
            marks.chart ? (
              <>
                <button type="button" className={styles.mini} onClick={() => nudgeChart(-1, 0)} aria-label="Stitch left">←</button>
                <button type="button" className={styles.mini} onClick={() => nudgeChart(1, 0)} aria-label="Stitch right">→</button>
                <button type="button" className={styles.mini} onClick={() => nudgeChart(0, -1)} aria-label="Row up">↑</button>
                <button type="button" className={styles.mini} onClick={() => nudgeChart(0, 1)} aria-label="Row down">↓</button>
                <button type="button" className={styles.mini} onClick={() => sizeChart(0.9)}>Smaller cell</button>
                <button type="button" className={styles.mini} onClick={() => sizeChart(1.1)}>Bigger cell</button>
                <label className={styles.follow}><input type="checkbox" checked={marks.chart.follow ?? true}
                  onChange={(e) => setMarks((m) => ({ ...m, chart: { ...m.chart, follow: e.target.checked } }))} /> Moves up with each row</label>
                <button type="button" className={styles.mini} onClick={() => setMarks((m) => ({ ...m, chart: null }))}>Remove</button>
              </>
            ) : <span className={styles.hintText}>Tap the stitch you are on in the chart.</span>
          )}
          {tool === 'bookmark' && <span className={styles.hintText}>Drag a box around something to keep on screen (sizes, abbreviations...).</span>}
          {tool === 'erase' && <span className={styles.hintText}>Tap a highlight, drawing, sticker or bookmark to remove it.</span>}
        </div>
        <div className={styles.meta}>
          <button type="button" className={styles.mini} onClick={undo} disabled={!history.length}><Undo2 size={14} aria-hidden="true" /> Undo</button>
          <button type="button" className={styles.mini} onClick={() => setHidden((h) => !h)} aria-pressed={hidden}>
            {hidden ? <><Eye size={14} aria-hidden="true" /> Show marks</> : <><EyeOff size={14} aria-hidden="true" /> Hide marks</>}
          </button>
          <span className={styles.save} aria-live="polite">
            {saveState === 'saving' ? 'Saving...' : saveState === 'failed' ? 'Not saved' : 'Saved'}
          </span>
        </div>
      </div>

      {marks.bookmarks.length > 0 && (
        <div className={styles.bookmarks}>
          {marks.bookmarks.map((b, i) => (
            <button key={i} type="button" className={`${styles.chip} ${openBookmark === i ? styles.chipOn : ''}`}
              onClick={() => setOpenBookmark(openBookmark === i ? null : i)}><Bookmark size={14} aria-hidden="true" /> {b.label}</button>
          ))}
          {openBookmark != null && marks.bookmarks[openBookmark] && (
            <div className={styles.snippet}>
              <Snippet bookmark={marks.bookmarks[openBookmark]} image={imageRefs.current[marks.bookmarks[openBookmark].page]} />
              <button type="button" className={styles.mini}
                onClick={() => pageRefs.current[marks.bookmarks[openBookmark].page]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                Go to page
              </button>
            </div>
          )}
        </div>
      )}

      {pages.truncated && <p className={styles.message}>Showing the first 60 of {pages.truncated} pages.</p>}

      <div className={styles.pages}>
        {pages.map((pg, index) => (
          <div key={index} className={styles.page}
            ref={(el) => { pageRefs.current[index] = el }}
            style={{ touchAction: interactive ? 'none' : 'auto', cursor: interactive && tool !== 'erase' ? 'crosshair' : 'auto' }}
            onPointerDown={(e) => onPointerDown(e, index)}
            onPointerMove={(e) => onPointerMove(e, index)}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}>
            {pg.kind === 'image'
              ? <img ref={(el) => { imageRefs.current[index] = el }} src={pg.src} alt={`${pattern.name}, page ${index + 1}`} className={styles.pageImg} draggable="false" />
              : <div className={styles.textPage}>{pg.text}</div>}

            {!hidden && (
              <>
                <svg className={styles.overlay} viewBox="0 0 1000 1000" preserveAspectRatio="none"
                  style={{ pointerEvents: tool === 'erase' ? 'auto' : 'none' }}>
                  {marks.bar?.page === index && (
                    <rect x="0" y={marks.bar.y * 1000} width="1000" height={marks.bar.h * 1000}
                      fill={marks.bar.color} opacity="0.45" />
                  )}
                  {marks.chart?.page === index && (
                    <g opacity="0.45" fill={marks.chart.color}>
                      <rect x={(marks.chart.x - marks.chart.cellW / 2) * 1000} y="0" width={marks.chart.cellW * 1000} height="1000" />
                      <rect x="0" y={(marks.chart.y - marks.chart.cellH / 2) * 1000} width="1000" height={marks.chart.cellH * 1000} />
                    </g>
                  )}
                  {pageMarks('highlights', index).map((m) => (
                    <rect key={`h${m.i}`} x={m.x * 1000} y={m.y * 1000} width={m.w * 1000} height={m.h * 1000}
                      fill={m.color} opacity="0.5" onClick={() => tool === 'erase' && removeMark('highlights', m.i)} />
                  ))}
                  {pageMarks('bookmarks', index).map((m) => (
                    <rect key={`b${m.i}`} x={m.x * 1000} y={m.y * 1000} width={m.w * 1000} height={m.h * 1000}
                      fill="none" stroke="#8ED0D6" strokeWidth="2" strokeDasharray="6 4" vectorEffect="non-scaling-stroke"
                      onClick={() => tool === 'erase' && removeMark('bookmarks', m.i)} style={{ pointerEvents: tool === 'erase' ? 'all' : 'none' }} />
                  ))}
                  {pageMarks('strokes', index).map((m) => (
                    <polyline key={`s${m.i}`} points={m.points.map(([x, y]) => `${x * 1000},${y * 1000}`).join(' ')}
                      fill="none" stroke={m.color} strokeWidth={m.width} strokeLinecap="round" strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke" onClick={() => tool === 'erase' && removeMark('strokes', m.i)} />
                  ))}
                  {draft?.page === index && draft.kind === 'stroke' && (
                    <polyline points={draft.points.map(([x, y]) => `${x * 1000},${y * 1000}`).join(' ')}
                      fill="none" stroke={penColor} strokeWidth={penWidth} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  )}
                  {draft?.page === index && (draft.kind === 'highlight' || draft.kind === 'bookmark') && (
                    <rect x={Math.min(draft.x0, draft.x) * 1000} y={Math.min(draft.y0, draft.y) * 1000}
                      width={Math.abs(draft.x - draft.x0) * 1000} height={Math.abs(draft.y - draft.y0) * 1000}
                      fill={draft.kind === 'highlight' ? hlColor : 'none'} opacity={draft.kind === 'highlight' ? 0.5 : 1}
                      stroke="#8ED0D6" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
                  )}
                </svg>
                {pageMarks('stickers', index).map((m) => (
                  <button key={`k${m.i}`} type="button" className={styles.sticker}
                    style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%`, pointerEvents: tool === 'none' || tool === 'erase' ? 'auto' : 'none' }}
                    title={m.note || m.icon} aria-label={m.note ? `Note: ${m.note}` : `${m.icon} sticker`}
                    onClick={() => (tool === 'erase' ? removeMark('stickers', m.i) : m.note && window.alert(m.note))}>
                    {STICKERS[m.icon]}
                  </button>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

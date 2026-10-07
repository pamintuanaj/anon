import { useEffect, useRef, useState } from 'react'
import { Undo2, PaintBucket, Paintbrush, FlipHorizontal, ImageDown } from 'lucide-react'
import { listCharts, createChart, updateChart, deleteChart, listProjects, uploadPattern } from '../../api'
import { useResource } from '../../hooks/useResource.js'
import Button from '../../components/atoms/Button.jsx'
import page from '../Page.module.css'
import styles from './ChartMaker.module.css'

const DEFAULT_PALETTE = ['#FFFFFF', '#E88FA4', '#8ED0D6', '#F4B3A8', '#4A4445', '#FBE3B8']
const blank = (cols, rows) => Array(cols * rows).fill(0)

function resize(cells, oldCols, oldRows, cols, rows) {
  const next = blank(cols, rows)
  for (let r = 0; r < Math.min(rows, oldRows); r++) {
    for (let c = 0; c < Math.min(cols, oldCols); c++) next[r * cols + c] = cells[r * oldCols + c]
  }
  return next
}

export function hexToRgb(hex) {
  const num = parseInt(hex.replace('#', ''), 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

// The palette colour closest to (r, g, b): the smallest straight-line distance
// through red/green/blue space.
export function nearestPaletteIndex(r, g, b, palette) {
  let closest = 0
  let min = Infinity
  palette.forEach((hex, i) => {
    const p = hexToRgb(hex)
    const distance = Math.hypot(r - p.r, g - p.g, b - p.b)
    if (distance < min) { min = distance; closest = i }
  })
  return closest
}

const makeCanvas = (w, h) => {
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  return canvas
}

// Shrinks a photo to cols x rows pixels, one per stitch.
//  - It crops from the centre to the grid's shape, so a photo is never squashed.
//  - Every step is drawn on white, so transparent areas become white, not black.
//  - It halves the size repeatedly instead of jumping straight down. One huge
//    jump skips most of the pixels and makes a speckled result; halving averages
//    them, so each stitch gets the true average colour of its patch of photo.
export function sampleGrid(bitmap, cols, rows) {
  const gridShape = cols / rows
  const photoShape = bitmap.width / bitmap.height
  let sx = 0, sy = 0, sw = bitmap.width, sh = bitmap.height
  if (photoShape > gridShape) { sw = bitmap.height * gridShape; sx = (bitmap.width - sw) / 2 }
  else { sh = bitmap.width / gridShape; sy = (bitmap.height - sh) / 2 }

  let source = bitmap
  let rect = [sx, sy, sw, sh]
  let w = Math.round(sw), h = Math.round(sh)
  while (w / 2 >= cols * 2 && h / 2 >= rows * 2) {
    w = Math.round(w / 2); h = Math.round(h / 2)
    const step = makeCanvas(w, h)
    const c = step.getContext('2d')
    c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, w, h)
    c.imageSmoothingQuality = 'high'
    c.drawImage(source, ...rect, 0, 0, w, h)
    source = step; rect = [0, 0, w, h]
  }
  const last = makeCanvas(cols, rows)
  const ctx = last.getContext('2d', { willReadFrequently: true })
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, cols, rows)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, ...rect, 0, 0, cols, rows)
  return ctx.getImageData(0, 0, cols, rows).data
}

function drawChart(chart, cell = 28) {
  const margin = 30
  const canvas = makeCanvas(chart.cols * cell + margin * 2, chart.rows * cell + margin * 2)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height)
  chart.cells.forEach((colour, i) => {
    const r = Math.floor(i / chart.cols), c = i % chart.cols
    ctx.fillStyle = chart.palette[colour]
    ctx.fillRect(margin + c * cell, margin + r * cell, cell, cell)
  })
  ctx.strokeStyle = '#B8AEB1'; ctx.lineWidth = 1
  for (let c = 0; c <= chart.cols; c++) {
    ctx.beginPath(); ctx.moveTo(margin + c * cell + 0.5, margin); ctx.lineTo(margin + c * cell + 0.5, margin + chart.rows * cell); ctx.stroke()
  }
  for (let r = 0; r <= chart.rows; r++) {
    ctx.beginPath(); ctx.moveTo(margin, margin + r * cell + 0.5); ctx.lineTo(margin + chart.cols * cell, margin + r * cell + 0.5); ctx.stroke()
  }
  ctx.fillStyle = '#4A4445'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left'
  for (let r = 0; r < chart.rows; r++) ctx.fillText(String(chart.rows - r), margin + chart.cols * cell + 6, margin + r * cell + cell * 0.65)
  ctx.textAlign = 'center'
  for (let c = 0; c < chart.cols; c++) ctx.fillText(String(chart.cols - c), margin + c * cell + cell / 2, margin + chart.rows * cell + 18)
  return canvas
}

export default function ChartMaker({ compact = false }) {
  const { data: charts, setData: setCharts, status } = useResource(() => listCharts(), [])
  const { data: projects } = useResource(() => listProjects(), [])
  const [chart, setChart] = useState({ id: null, name: 'My chart', cols: 16, rows: 12, palette: DEFAULT_PALETTE, cells: blank(16, 12) })
  const [colour, setColour] = useState(1)
  const [message, setMessage] = useState(null)
  const [target, setTarget] = useState('')
  const painting = useRef(false)
  const fileInputRef = useRef(null)

  const [tool, setTool] = useState('paint')
  const [mirror, setMirror] = useState(false)
  const [history, setHistory] = useState([])

  const snapshot = () => setHistory((h) => [...h.slice(-49), { cols: chart.cols, rows: chart.rows, cells: chart.cells }])

  // Works out the step from the current history, then sets each piece of state
  // once. (Calling setChart inside setHistory's updater would run it twice in
  // React's StrictMode.)
  function undo() {
    const last = history[history.length - 1]
    if (!last) return
    setChart((c) => ({ ...c, cols: last.cols, rows: last.rows, cells: last.cells }))
    setHistory((h) => h.slice(0, -1))
  }

  // Opening a saved chart starts a fresh history. Otherwise Undo would bring
  // back the cells and size of whatever chart you had open before.
  function openChart(c) {
    setChart(c)
    setHistory([])
  }

  useEffect(() => {
    const stop = () => { painting.current = false }
    window.addEventListener('pointerup', stop)
    return () => window.removeEventListener('pointerup', stop)
  }, [])

  function paint(index) {
    setChart((c) => {
      const targets = [index]
      if (mirror) {
        const r = Math.floor(index / c.cols), col = index % c.cols
        targets.push(r * c.cols + (c.cols - 1 - col))
      }
      if (targets.every((t) => c.cells[t] === colour)) return c
      return { ...c, cells: c.cells.map((v, i) => (targets.includes(i) ? colour : v)) }
    })
  }

  function fill(index) {
    setChart((c) => {
      const from = c.cells[index]
      if (from === colour) return c
      const cells = [...c.cells]
      const stack = [index]
      while (stack.length) {
        const i = stack.pop()
        if (cells[i] !== from) continue
        cells[i] = colour
        const r = Math.floor(i / c.cols), col = i % c.cols
        if (col > 0) stack.push(i - 1)
        if (col < c.cols - 1) stack.push(i + 1)
        if (r > 0) stack.push(i - c.cols)
        if (r < c.rows - 1) stack.push(i + c.cols)
      }
      return { ...c, cells }
    })
  }

  const act = (i) => (tool === 'fill' ? fill(i) : paint(i))

  function setSize(key, value) {
    snapshot()
    const n = Math.min(60, Math.max(2, Number(value) || 2))
    setChart((c) => {
      const cols = key === 'cols' ? n : c.cols, rows = key === 'rows' ? n : c.rows
      return { ...c, cols, rows, cells: resize(c.cells, c.cols, c.rows, cols, rows) }
    })
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setMessage('Choose a picture file.'); return }
    try {
      const bitmap = await createImageBitmap(file)
      snapshot()
      const data = sampleGrid(bitmap, chart.cols, chart.rows)
      bitmap.close?.()
      const newCells = []
      for (let i = 0; i < data.length; i += 4) {
        newCells.push(nearestPaletteIndex(data[i], data[i + 1], data[i + 2], chart.palette))
      }
      setChart((c) => ({ ...c, cells: newCells }))
      setMessage('Photo turned into a chart using your palette. Simple, bold pictures work best; change the palette colours first for a closer match.')
    } catch {
      setMessage('Could not convert that picture. Try another photo.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function save() {
    setMessage(null)
    try {
      const input = { name: chart.name, cols: chart.cols, rows: chart.rows, palette: chart.palette, cells: chart.cells }
      const saved = chart.id ? await updateChart(chart.id, input) : await createChart(input)
      setChart(saved)
      setCharts((all) => [saved, ...(all ?? []).filter((c) => c.id !== saved.id)])
      setMessage('Saved.')
    } catch (e) { setMessage(e.message) }
  }

  function exportPng() {
    drawChart(chart).toBlob((blob) => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
      a.download = `${chart.name || 'chart'}.png`; a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    }, 'image/png')
  }

  async function addToProject() {
    if (!target) return setMessage('Pick a project first.')
    const blob = await new Promise((resolve) => drawChart(chart).toBlob(resolve, 'image/png'))
    try {
      await uploadPattern(target, new File([blob], `${chart.name || 'chart'}.png`, { type: 'image/png' }))
      setMessage('Added to project. Open it in Tracker to follow row-by-row.')
    } catch (e) { setMessage(e.message) }
  }

  async function remove(c) {
    if (!window.confirm(`Delete the chart "${c.name}"?`)) return
    await deleteChart(c.id)
    setCharts((all) => all.filter((x) => x.id !== c.id))
    if (chart.id === c.id) setChart({ ...chart, id: null })
  }

  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
      <section className={styles.editor}>
        <div className={page.fields}>
          <div><label htmlFor="ch-name">Name</label><input id="ch-name" maxLength={80} value={chart.name} onChange={(e) => setChart({ ...chart, name: e.target.value })} /></div>
          <div><label htmlFor="ch-cols">Stitches wide</label><input id="ch-cols" type="number" min="2" max="60" value={chart.cols} onChange={(e) => setSize('cols', e.target.value)} /></div>
          <div><label htmlFor="ch-rows">Rows high</label><input id="ch-rows" type="number" min="2" max="60" value={chart.rows} onChange={(e) => setSize('rows', e.target.value)} /></div>
        </div>

        <div className={styles.palette} role="radiogroup" aria-label="Paint colour">
          {chart.palette.map((c, i) => (
            <div key={i} className={styles.paint}>
              <button type="button" role="radio" aria-checked={colour === i} aria-label={`Colour ${i + 1}`}
                className={`${styles.swatch} ${colour === i ? styles.picked : ''}`}
                style={{ background: c }} onClick={() => setColour(i)} />
              <input type="color" aria-label={`Change colour ${i + 1}`} value={c}
                onChange={(e) => setChart({ ...chart, palette: chart.palette.map((p, j) => (j === i ? e.target.value.toUpperCase() : p)) })} />
            </div>
          ))}
        </div>

        <div className={styles.tools} role="group" aria-label="Drawing tools">
          <button type="button" aria-pressed={tool === 'paint'} className={`${styles.tool} ${tool === 'paint' ? styles.picked2 : ''}`} onClick={() => setTool('paint')}>
            <Paintbrush size={16} aria-hidden="true" /> Paint
          </button>
          <button type="button" aria-pressed={tool === 'fill'} className={`${styles.tool} ${tool === 'fill' ? styles.picked2 : ''}`} onClick={() => setTool('fill')}>
            <PaintBucket size={16} aria-hidden="true" /> Fill
          </button>
          <button type="button" aria-pressed={mirror} className={`${styles.tool} ${mirror ? styles.picked2 : ''}`} onClick={() => setMirror((m) => !m)}>
            <FlipHorizontal size={16} aria-hidden="true" /> Mirror
          </button>
          <button type="button" className={styles.tool} onClick={undo} disabled={!history.length}>
            <Undo2 size={16} aria-hidden="true" /> Undo
          </button>
          <button type="button" className={styles.tool} onClick={() => fileInputRef.current?.click()}>
            <ImageDown size={16} aria-hidden="true" /> Convert photo
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="visually-hidden" onChange={handleImageUpload} />
        </div>

        <div className={styles.gridWrap}>
          <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${chart.cols}, 1fr)` }} onPointerLeave={() => { painting.current = false }}>
            {chart.cells.map((v, i) => (
              <button key={i} type="button" className={styles.cell} style={{ background: chart.palette[v] ?? '#fff' }}
                aria-label={`Row ${chart.rows - Math.floor(i / chart.cols)}, stitch ${chart.cols - (i % chart.cols)}`}
                onPointerDown={(e) => {
                  e.preventDefault()
                  // A finger "captures" the first cell it touches, so no other cell would
                  // hear the drag. Letting go of the capture makes drag-painting work on touch.
                  e.currentTarget.releasePointerCapture?.(e.pointerId)
                  snapshot()
                  if (tool === 'paint') painting.current = true
                  act(i)
                }}
                onClick={(e) => { if (e.detail === 0) { snapshot(); act(i) } }}
                onPointerEnter={() => painting.current && tool === 'paint' && paint(i)} />
            ))}
          </div>
        </div>

        <div className={page.formActions}>
          <Button onClick={save}>{chart.id ? 'Save changes' : 'Save chart'}</Button>
          <Button variant="secondary" onClick={exportPng}>Download PNG</Button>
          <Button variant="ghost" onClick={() => { snapshot(); setChart({ ...chart, cells: blank(chart.cols, chart.rows) }) }}>Clear</Button>
        </div>

        <div className={styles.toProject}>
          <label htmlFor="ch-target">Add this chart to a project as a pattern</label>
          <div className={page.formActions}>
            <select id="ch-target" value={target} onChange={(e) => setTarget(e.target.value)} style={{ maxWidth: '18rem' }}>
              <option value="">Choose a project</option>
              {(projects ?? []).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <Button variant="secondary" onClick={addToProject}>Add</Button>
          </div>
        </div>
        {message && <p className={styles.message} role="status">{message}</p>}
      </section>

      <aside className={styles.saved}>
        <h2 className={styles.savedTitle}>Saved charts</h2>
        {status === 'loading' && <p className={styles.message}>Loading...</p>}
        {charts?.length === 0 && <p className={styles.message}>None yet.</p>}
        <ul>
          {(charts ?? []).map((c) => (
            <li key={c.id}>
              <button type="button" className={styles.open} onClick={() => openChart(c)}>{c.name} <span>{c.cols}×{c.rows}</span></button>
              <button type="button" className={styles.del} onClick={() => remove(c)} aria-label={`Delete ${c.name}`}>✕</button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}

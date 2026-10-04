import { useEffect, useRef, useState } from 'react'
import { listCharts, createChart, updateChart, deleteChart, listProjects, uploadPattern } from '../../api'
import { useResource } from '../../hooks/useResource.js'
import Button from '../../components/atoms/Button.jsx'
import page from '../Page.module.css'
import styles from './ChartMaker.module.css'

const DEFAULT_PALETTE = ['#FFFFFF', '#E88FA4', '#8ED0D6', '#F4B3A8', '#4A4445', '#FBE3B8']
const blank = (cols, rows) => Array(cols * rows).fill(0)

// Resize a grid, keeping what was already painted in the top-left.
function resize(cells, oldCols, oldRows, cols, rows) {
  const next = blank(cols, rows)
  for (let r = 0; r < Math.min(rows, oldRows); r++) {
    for (let c = 0; c < Math.min(cols, oldCols); c++) next[r * cols + c] = cells[r * oldCols + c]
  }
  return next
}

// Draw a chart onto a canvas, with row numbers on the right like printed charts.
function drawChart(chart, cell = 28) {
  const margin = 30
  const canvas = document.createElement('canvas')
  canvas.width = chart.cols * cell + margin * 2
  canvas.height = chart.rows * cell + margin * 2
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  chart.cells.forEach((colour, i) => {
    const r = Math.floor(i / chart.cols), c = i % chart.cols
    ctx.fillStyle = chart.palette[colour]
    ctx.fillRect(margin + c * cell, margin + r * cell, cell, cell)
  })
  ctx.strokeStyle = '#B8AEB1'
  ctx.lineWidth = 1
  for (let c = 0; c <= chart.cols; c++) { ctx.beginPath(); ctx.moveTo(margin + c * cell + 0.5, margin); ctx.lineTo(margin + c * cell + 0.5, margin + chart.rows * cell); ctx.stroke() }
  for (let r = 0; r <= chart.rows; r++) { ctx.beginPath(); ctx.moveTo(margin, margin + r * cell + 0.5); ctx.lineTo(margin + chart.cols * cell, margin + r * cell + 0.5); ctx.stroke() }
  ctx.fillStyle = '#4A4445'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'left'
  for (let r = 0; r < chart.rows; r++) ctx.fillText(String(chart.rows - r), margin + chart.cols * cell + 6, margin + r * cell + cell * 0.65)
  ctx.textAlign = 'center'
  for (let c = 0; c < chart.cols; c++) ctx.fillText(String(chart.cols - c), margin + c * cell + cell / 2, margin + chart.rows * cell + 18)
  return canvas
}

export default function ChartMaker() {
  const { data: charts, setData: setCharts, status } = useResource(() => listCharts(), [])
  const { data: projects } = useResource(() => listProjects(), [])
  const [chart, setChart] = useState({ id: null, name: 'My chart', cols: 16, rows: 12, palette: DEFAULT_PALETTE, cells: blank(16, 12) })
  const [colour, setColour] = useState(1)
  const [message, setMessage] = useState(null)
  const [target, setTarget] = useState('')
  const painting = useRef(false)

  useEffect(() => {
    const stop = () => { painting.current = false }
    window.addEventListener('pointerup', stop)
    return () => window.removeEventListener('pointerup', stop)
  }, [])

  function paint(index) {
    setChart((c) => (c.cells[index] === colour ? c : { ...c, cells: c.cells.map((v, i) => (i === index ? colour : v)) }))
  }

  function setSize(key, value) {
    const n = Math.min(60, Math.max(2, Number(value) || 2))
    setChart((c) => {
      const cols = key === 'cols' ? n : c.cols, rows = key === 'rows' ? n : c.rows
      return { ...c, cols, rows, cells: resize(c.cells, c.cols, c.rows, cols, rows) }
    })
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
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${chart.name || 'chart'}.png`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    }, 'image/png')
  }

  async function addToProject() {
    if (!target) return setMessage('Pick a project first.')
    const blob = await new Promise((resolve) => drawChart(chart).toBlob(resolve, 'image/png'))
    try {
      await uploadPattern(target, new File([blob], `${chart.name || 'chart'}.png`, { type: 'image/png' }))
      setMessage('Added to the project. Open it in the tracker and use the Chart tool to follow it stitch by stitch.')
    } catch (e) { setMessage(e.message) }
  }

  async function remove(c) {
    if (!window.confirm(`Delete the chart "${c.name}"?`)) return
    await deleteChart(c.id)
    setCharts((all) => all.filter((x) => x.id !== c.id))
    if (chart.id === c.id) setChart({ ...chart, id: null })
  }

  return (
    <div className={styles.wrap}>
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
                className={`${styles.swatch} ${colour === i ? styles.picked : ''}`} style={{ background: c }} onClick={() => setColour(i)} />
              <input type="color" aria-label={`Change colour ${i + 1}`} value={c}
                onChange={(e) => setChart({ ...chart, palette: chart.palette.map((p, j) => (j === i ? e.target.value.toUpperCase() : p)) })} />
            </div>
          ))}
        </div>
        <div className={styles.gridWrap}>
          <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${chart.cols}, 1fr)` }}
            onPointerLeave={() => { painting.current = false }}>
            {chart.cells.map((v, i) => (
              <button key={i} type="button" className={styles.cell} style={{ background: chart.palette[v] ?? '#fff' }}
                aria-label={`Row ${chart.rows - Math.floor(i / chart.cols)}, stitch ${chart.cols - (i % chart.cols)}`}
                onPointerDown={(e) => { e.preventDefault(); painting.current = true; paint(i) }}
                onPointerEnter={() => painting.current && paint(i)} />
            ))}
          </div>
        </div>
        <div className={page.formActions}>
          <Button onClick={save}>{chart.id ? 'Save changes' : 'Save chart'}</Button>
          <Button variant="secondary" onClick={exportPng}>Download PNG</Button>
          <Button variant="ghost" onClick={() => setChart({ ...chart, cells: blank(chart.cols, chart.rows) })}>Clear</Button>
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
              <button type="button" className={styles.open} onClick={() => setChart(c)}>{c.name} <span>{c.cols}×{c.rows}</span></button>
              <button type="button" className={styles.del} onClick={() => remove(c)} aria-label={`Delete ${c.name}`}>✕</button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}

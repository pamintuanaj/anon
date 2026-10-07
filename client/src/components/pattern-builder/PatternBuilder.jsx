import { useState } from 'react'
import { ArrowUp, ArrowDown, Copy, Trash2, Plus, Repeat, Download, Play, Save } from 'lucide-react'
import Button from '../atoms/Button.jsx'
import { DIFFICULTIES, cleanDesign, countRows, designToText } from '../../utils/pattern.js'
import styles from './PatternBuilder.module.css'

const move = (list, from, to) => {
  if (to < 0 || to >= list.length) return list
  const next = list.slice()
  next.splice(to, 0, next.splice(from, 1)[0])
  return next
}

// The editor: a pattern is a title, some details, and sections that each hold
// rows. Every change returns a new object to onChange (React state is never
// edited in place). The number beside each row is its number in the tracker.
export default function PatternBuilder({ design, onChange, onSave, onStart, saving, error }) {
  const [repeat, setRepeat] = useState({})   // per-section "repeat last row N times"
  const set = (patch) => onChange({ ...design, ...patch })
  const setSection = (si, patch) => set({ sections: design.sections.map((s, i) => (i === si ? { ...s, ...patch } : s)) })
  const setRows = (si, rows) => setSection(si, { rows })
  const setRow = (si, ri, patch) => setRows(si, design.sections[si].rows.map((r, i) => (i === ri ? { ...r, ...patch } : r)))

  const total = countRows(design)
  const checked = cleanDesign(design)
  // Number each non-empty row across the whole pattern: same as the tracker's count.
  let counter = 0
  const numbered = design.sections.map((s) => s.rows.map((r) => (r.text.trim() ? ++counter : null)))

  function download() {
    const blob = new Blob([designToText(checked.value)], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${checked.value.title || 'pattern'}.txt`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  return (
    <div className={styles.builder}>
      <section className={styles.panel}>
        <h2 className={styles.h2}>Details</h2>
        <div className={styles.grid2}>
          <div><label htmlFor="pb-title">Pattern name</label><input id="pb-title" maxLength={80} value={design.title} onChange={(e) => set({ title: e.target.value })} /></div>
          <div>
            <label htmlFor="pb-diff">Difficulty</label>
            <select id="pb-diff" value={design.difficulty} onChange={(e) => set({ difficulty: e.target.value })}>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div><label htmlFor="pb-hook">Hook size (mm)</label><input id="pb-hook" inputMode="decimal" maxLength={12} value={design.hook_mm} onChange={(e) => set({ hook_mm: e.target.value })} /></div>
          <div><label htmlFor="pb-yarn">Yarn</label><input id="pb-yarn" maxLength={80} value={design.yarn} placeholder="e.g. DK cotton, about 60 g" onChange={(e) => set({ yarn: e.target.value })} /></div>
        </div>
        <label htmlFor="pb-desc">Description</label>
        <textarea id="pb-desc" rows={2} maxLength={400} value={design.description} onChange={(e) => set({ description: e.target.value })} />
        <div className={styles.grid2}>
          <div><label htmlFor="pb-mat">Materials (one per line)</label><textarea id="pb-mat" rows={4} value={design.materials.join('\n')} onChange={(e) => set({ materials: e.target.value.split('\n') })} /></div>
          <div><label htmlFor="pb-notes">Notes and tips (one per line)</label><textarea id="pb-notes" rows={4} value={design.notes.join('\n')} onChange={(e) => set({ notes: e.target.value.split('\n') })} /></div>
        </div>
      </section>

      {design.sections.map((section, si) => (
        <section key={si} className={styles.panel} aria-label={`Section ${section.name}`}>
          <div className={styles.sectionHead}>
            <div className={styles.grow}>
              <label htmlFor={`pb-sec-${si}`}>Section name</label>
              <input id={`pb-sec-${si}`} maxLength={60} value={section.name} onChange={(e) => setSection(si, { name: e.target.value })} />
            </div>
            <div className={styles.icons}>
              <IconBtn label="Move section up" disabled={si === 0} onClick={() => set({ sections: move(design.sections, si, si - 1) })}><ArrowUp size={16} /></IconBtn>
              <IconBtn label="Move section down" disabled={si === design.sections.length - 1} onClick={() => set({ sections: move(design.sections, si, si + 1) })}><ArrowDown size={16} /></IconBtn>
              <IconBtn label="Delete section" disabled={design.sections.length === 1}
                onClick={() => { if (window.confirm(`Delete the section "${section.name}" and its rows?`)) set({ sections: design.sections.filter((_, i) => i !== si) }) }}><Trash2 size={16} /></IconBtn>
            </div>
          </div>

          <ol className={styles.rows}>
            {section.rows.map((row, ri) => (
              <li key={ri} className={styles.row}>
                <span className={styles.num} title="Row number in the tracker">{numbered[si][ri] ?? '–'}</span>
                <div className={styles.rowFields}>
                  <input className={styles.label} aria-label={`Row ${ri + 1} label`} placeholder="Rnd 1" maxLength={24} value={row.label} onChange={(e) => setRow(si, ri, { label: e.target.value })} />
                  <textarea className={styles.text} aria-label={`Row ${ri + 1} instructions`} rows={2} maxLength={300} placeholder="e.g. [2 sc, inc] × 6"
                    value={row.text} onChange={(e) => setRow(si, ri, { text: e.target.value })} />
                  <input className={styles.count} type="number" min="0" max="9999" aria-label={`Row ${ri + 1} stitch count`} placeholder="sts"
                    value={row.stitches ?? ''} onChange={(e) => setRow(si, ri, { stitches: e.target.value === '' ? null : Math.max(0, Math.min(9999, Math.round(Number(e.target.value)))) })} />
                </div>
                <div className={styles.icons}>
                  <IconBtn label="Move row up" disabled={ri === 0} onClick={() => setRows(si, move(section.rows, ri, ri - 1))}><ArrowUp size={16} /></IconBtn>
                  <IconBtn label="Move row down" disabled={ri === section.rows.length - 1} onClick={() => setRows(si, move(section.rows, ri, ri + 1))}><ArrowDown size={16} /></IconBtn>
                  <IconBtn label="Duplicate row" onClick={() => setRows(si, [...section.rows.slice(0, ri + 1), { ...row }, ...section.rows.slice(ri + 1)])}><Copy size={16} /></IconBtn>
                  <IconBtn label="Delete row" disabled={section.rows.length === 1} onClick={() => setRows(si, section.rows.filter((_, i) => i !== ri))}><Trash2 size={16} /></IconBtn>
                </div>
              </li>
            ))}
          </ol>

          <div className={styles.actions}>
            <Button size="sm" variant="secondary" onClick={() => setRows(si, [...section.rows, { label: '', text: '', stitches: null }])}><Plus size={15} aria-hidden="true" /> Add row</Button>
            <span className={styles.repeat}>
              <label htmlFor={`pb-rep-${si}`} className="visually-hidden">Number of copies of the last row</label>
              <input id={`pb-rep-${si}`} type="number" min="1" max="100" value={repeat[si] ?? 3} onChange={(e) => setRepeat({ ...repeat, [si]: e.target.value })} />
              <Button size="sm" variant="ghost" onClick={() => {
                const n = Math.max(1, Math.min(100, Math.round(Number(repeat[si] ?? 3)) || 1))
                const last = section.rows[section.rows.length - 1]
                setRows(si, [...section.rows, ...Array.from({ length: n }, () => ({ ...last }))])
              }}><Repeat size={15} aria-hidden="true" /> Repeat last row</Button>
            </span>
          </div>
        </section>
      ))}

      <div className={styles.actions}>
        <Button variant="secondary" disabled={design.sections.length >= 12}
          onClick={() => set({ sections: [...design.sections, { name: `Section ${design.sections.length + 1}`, rows: [{ label: '', text: '', stitches: null }] }] })}>
          <Plus size={16} aria-hidden="true" /> Add section
        </Button>
      </div>

      <footer className={styles.footer}>
        <p className={total > 1000 ? styles.error : styles.help} role="status">{total} {total === 1 ? 'row' : 'rows'} (the tracker allows up to 1000)</p>
        {(error || (checked.errors.length > 0 && design.title)) && <p className={styles.error} role="alert">{error ?? checked.errors.join(' ')}</p>}
        <div className={styles.actions}>
          <Button onClick={onSave} disabled={saving || checked.errors.length > 0}><Save size={16} aria-hidden="true" /> {saving ? 'Saving…' : design.id ? 'Save changes' : 'Save pattern'}</Button>
          <Button variant="secondary" onClick={onStart} disabled={checked.errors.length > 0}><Play size={16} aria-hidden="true" /> Start tracking this</Button>
          <Button variant="ghost" onClick={download} disabled={checked.errors.length > 0}><Download size={16} aria-hidden="true" /> Download .txt</Button>
        </div>
      </footer>
    </div>
  )
}

function IconBtn({ label, children, ...props }) {
  return <button type="button" className={styles.icon} aria-label={label} title={label} {...props}>{children}</button>
}

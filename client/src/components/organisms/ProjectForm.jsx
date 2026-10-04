import { useState } from 'react'
import Button from '../atoms/Button.jsx'
import page from '../../pages/Page.module.css'

const COLORS = ['#F8C7D2', '#8ED0D6', '#F4B3A8', '#FBE3B8', '#BFE6E8', '#E88FA4']

export default function ProjectForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ title: '', pattern_ref: '', total_rows: 40, color_hex: COLORS[0] })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  async function submit(event) {
    event.preventDefault()
    const rows = Number(form.total_rows)
    if (!form.title.trim()) return setError('Give the project a name.')
    if (!Number.isInteger(rows) || rows < 1 || rows > 1000) return setError('Rows must be a whole number from 1 to 1000.')
    setSaving(true)
    setError(null)
    try {
      await onSave({ ...form, total_rows: rows, status: 'ongoing' })
    } catch (caught) {
      setError(caught.message)
      setSaving(false)
    }
  }

  return (
    <form className={page.panel} onSubmit={submit}>
      <h2>New project</h2>
      <div className={page.fields}>
        <div>
          <label htmlFor="p-title">Name</label>
          <input id="p-title" maxLength={80} value={form.title} onChange={set('title')} placeholder="Froggy bucket hat" />
        </div>
        <div>
          <label htmlFor="p-rows">Rows in the pattern</label>
          <input id="p-rows" type="number" min="1" max="1000" value={form.total_rows} onChange={set('total_rows')} />
        </div>
      </div>
      <div>
        <label htmlFor="p-pattern">Pattern (optional)</label>
        <input id="p-pattern" maxLength={200} value={form.pattern_ref} onChange={set('pattern_ref')} placeholder="Where the pattern is from, hook size" />
      </div>
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 800, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-xs)' }}>Yarn colour</legend>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          {COLORS.map((color) => (
            <label key={color} style={{ margin: 0, cursor: 'pointer' }}>
              <input type="radio" name="p-color" value={color} checked={form.color_hex === color}
                onChange={set('color_hex')} className="visually-hidden" />
              <span aria-label={color} style={{
                display: 'block', width: '2.2rem', height: '2.2rem', borderRadius: '50%', background: color,
                border: form.color_hex === color ? '3px solid var(--color-text)' : '2px solid var(--color-line)',
              }} />
            </label>
          ))}
        </div>
      </fieldset>
      {error && <p className={page.formError} role="alert">{error}</p>}
      <div className={page.formActions}>
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create project'}</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

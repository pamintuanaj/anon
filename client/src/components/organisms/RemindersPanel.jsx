import { useState } from 'react'
import Button from '../atoms/Button.jsx'
import page from '../../pages/Page.module.css'
import styles from './RemindersPanel.module.css'

// Notes that pop up while you work a certain row, once or every N rows.
export default function RemindersPanel({ reminders, workingRow, onCreate, onDelete }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ at_row: '', repeat_every: '', text: '' })
  const [error, setError] = useState(null)

  async function submit(event) {
    event.preventDefault()
    const at = Number(form.at_row)
    const repeat = form.repeat_every === '' ? null : Number(form.repeat_every)
    if (!Number.isInteger(at) || at < 1) return setError('Pick the row, 1 or more.')
    if (repeat !== null && !(Number.isInteger(repeat) && repeat >= 1)) return setError('Repeat must be empty or 1 or more.')
    if (!form.text.trim()) return setError('Write the reminder.')
    setError(null)
    try {
      await onCreate({ at_row: at, repeat_every: repeat, text: form.text })
      setForm({ at_row: '', repeat_every: '', text: '' })
      setOpen(false)
    } catch (caught) {
      setError(caught.message)
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="reminders-title">
      <header className={styles.head}>
        <h2 id="reminders-title" className={styles.title}>Reminders</h2>
        {!open && <Button size="sm" variant="secondary"
          onClick={() => { setForm({ at_row: String(workingRow), repeat_every: '', text: '' }); setOpen(true) }}>+ Reminder</Button>}
      </header>
      {open && (
        <form className={styles.form} onSubmit={submit}>
          <div className={page.fields}>
            <div>
              <label htmlFor="rem-row">At row</label>
              <input id="rem-row" type="number" min="1" value={form.at_row} onChange={(e) => setForm({ ...form, at_row: e.target.value })} />
            </div>
            <div>
              <label htmlFor="rem-repeat">Then every ... rows (optional)</label>
              <input id="rem-repeat" type="number" min="1" value={form.repeat_every} placeholder="e.g. 4"
                onChange={(e) => setForm({ ...form, repeat_every: e.target.value })} />
            </div>
          </div>
          <div>
            <label htmlFor="rem-text">Reminder</label>
            <input id="rem-text" maxLength={200} value={form.text} placeholder="Change colour, place a marker..."
              onChange={(e) => setForm({ ...form, text: e.target.value })} />
          </div>
          {error && <p className={page.formError} role="alert">{error}</p>}
          <div className={page.formActions}>
            <Button type="submit" size="sm">Add reminder</Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      )}
      {reminders.length === 0 && !open && <p className={styles.empty}>No reminders yet.</p>}
      <ul className={styles.list}>
        {reminders.map((r) => (
          <li key={r.id} className={styles.item}>
            <span className={styles.row}>Row {r.at_row}{r.repeat_every ? `, then every ${r.repeat_every}` : ''}</span>
            <span className={styles.text}>{r.text}</span>
            <button type="button" className={styles.remove} onClick={() => onDelete(r.id)} aria-label={`Delete reminder: ${r.text}`}>✕</button>
          </li>
        ))}
      </ul>
    </section>
  )
}

// The banner at the top of the tracker when a reminder is due on this row.
export function ReminderBanner({ due }) {
  if (!due.length) return null
  return (
    <div className={styles.banner} role="status">
      <span className={styles.bell} aria-hidden="true">🔔</span>
      <div>
        <p className={styles.bannerTitle}>This row</p>
        {due.map((r) => <p key={r.id}>{r.text}</p>)}
      </div>
    </div>
  )
}

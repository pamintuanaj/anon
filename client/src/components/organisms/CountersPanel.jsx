import { useState } from 'react'
import CounterCard from '../molecules/CounterCard.jsx'
import Button from '../atoms/Button.jsx'
import page from '../../pages/Page.module.css'
import styles from './CountersPanel.module.css'

const COLORS = ['#8ED0D6', '#F4B3A8', '#E88FA4', '#FBE3B8', '#BFE6E8', '#F8C7D2']
const EMPTY = { name: '', repeat_every: '', linked: false, color: COLORS[0], value: 0 }

// Any number of counters for one project. The parent (TrackerPage) owns the
// list, because linked counters must move when the row counter moves.
export default function CountersPanel({ counters, onChange, onCreate, onUpdate, onDelete }) {
  const [form, setForm] = useState(null)          // null = closed; otherwise the counter being added/edited
  const [error, setError] = useState(null)
  const editing = form?.id != null

  async function submit(event) {
    event.preventDefault()
    if (!form.name.trim()) return setError('Give the counter a name.')
    const repeat = form.repeat_every === '' || form.repeat_every == null ? null : Number(form.repeat_every)
    if (repeat !== null && !(Number.isInteger(repeat) && repeat >= 1 && repeat <= 999)) {
      return setError('Repeat must be empty or a whole number from 1 to 999.')
    }
    setError(null)
    try {
      const input = { name: form.name, value: Number(form.value) || 0, repeat_every: repeat, linked: form.linked, color: form.color }
      if (editing) await onUpdate(form.id, input)
      else await onCreate(input)
      setForm(null)
    } catch (caught) {
      setError(caught.message)
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="counters-title">
      <header className={styles.head}>
        <h2 id="counters-title" className={styles.title}>Counters</h2>
        {!form && <Button size="sm" variant="secondary" onClick={() => setForm(EMPTY)}>+ Counter</Button>}
      </header>

      {form && (
        <form className={styles.form} onSubmit={submit}>
          <div className={page.fields}>
            <div>
              <label htmlFor="counter-name">Name</label>
              <input id="counter-name" maxLength={40} value={form.name} placeholder="Increase right, pattern repeat..."
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label htmlFor="counter-repeat">Repeat every (optional)</label>
              <input id="counter-repeat" type="number" min="1" max="999" value={form.repeat_every ?? ''}
                placeholder="e.g. 6" onChange={(e) => setForm({ ...form, repeat_every: e.target.value })} />
            </div>
          </div>
          <label className={styles.check}>
            <input type="checkbox" checked={form.linked} onChange={(e) => setForm({ ...form, linked: e.target.checked })} />
            Link to the row counter (moves by one every time you finish a row)
          </label>
          <div className={styles.colors} role="radiogroup" aria-label="Colour">
            {COLORS.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={form.color === c} aria-label={c}
                className={`${styles.swatch} ${form.color === c ? styles.picked : ''}`} style={{ background: c }}
                onClick={() => setForm({ ...form, color: c })} />
            ))}
          </div>
          {error && <p className={page.formError} role="alert">{error}</p>}
          <div className={page.formActions}>
            <Button type="submit" size="sm">{editing ? 'Save' : 'Add counter'}</Button>
            <Button size="sm" variant="ghost" onClick={() => { setForm(null); setError(null) }}>Cancel</Button>
            {editing && (
              <Button size="sm" variant="danger" onClick={async () => { await onDelete(form.id); setForm(null) }}>Delete</Button>
            )}
          </div>
        </form>
      )}

      {counters.length === 0 && !form && (
        <p className={styles.empty}>Add counters for increases, pattern repeats, colour changes... as many as you need.</p>
      )}
      <div className={styles.grid}>
        {counters.map((c) => (
          <CounterCard key={c.id} counter={c} onChange={onChange}
            onEdit={(counter) => setForm({ ...counter, repeat_every: counter.repeat_every ?? '' })} />
        ))}
      </div>
    </section>
  )
}

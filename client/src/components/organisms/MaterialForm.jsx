import { useState } from 'react'
import Button from '../atoms/Button.jsx'
import page from '../../pages/Page.module.css'

const EMPTY = { name: '', color_hex: '#F7C6D0', color_number: '', batch_number: '', fiber_weight: '', qty: 1 }

export default function MaterialForm({ type, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY, low_at: type === 'yarn' ? 1 : 0 })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value })
  const isYarn = type === 'yarn'

  async function submit(event) {
    event.preventDefault()
    const qty = Number(form.qty)
    const lowAt = Number(form.low_at)
    if (!form.name.trim()) return setError('Give the item a name.')
    if (!Number.isInteger(qty) || qty < 0 || qty > 999) return setError('Quantity must be a whole number from 0 to 999.')
    if (!Number.isInteger(lowAt) || lowAt < 0 || lowAt > 999) return setError('The warning level must be a whole number from 0 to 999.')
    setSaving(true)
    setError(null)
    try {
      await onSave({
        ...form, type, qty, low_at: lowAt,
        // Hooks and notions have no colour or batch, so do not send yarn fields.
        ...(isYarn ? {} : { color_hex: null, color_number: '', batch_number: '', fiber_weight: '' }),
      })
      setForm({ ...EMPTY, low_at: type === 'yarn' ? 1 : 0 })
    } catch (caught) {
      setError(caught.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className={page.panel} onSubmit={submit}>
      <h2>Add {isYarn ? 'yarn' : type === 'hook' ? 'a hook' : 'an item'}</h2>
      <div className={page.fields}>
        <div>
          <label htmlFor="m-name">Name</label>
          <input id="m-name" maxLength={80} value={form.name} onChange={set('name')}
            placeholder={isYarn ? 'Milk cotton, mint' : type === 'hook' ? 'Ergonomic hook 5.0mm' : 'Stitch markers'} />
        </div>
        <div>
          <label htmlFor="m-qty">{isYarn ? 'Skeins' : 'Quantity'}</label>
          <input id="m-qty" type="number" min="0" max="999" value={form.qty} onChange={set('qty')} />
        </div>
        <div>
          <label htmlFor="m-low">Warn me when down to</label>
          <input id="m-low" type="number" min="0" max="999" value={form.low_at} onChange={set('low_at')}
            aria-describedby="m-low-hint" />
          <p id="m-low-hint" style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.2rem' }}>0 means never warn</p>
        </div>
        {isYarn && (
          <>
            <div>
              <label htmlFor="m-color">Colour</label>
              <input id="m-color" type="color" value={form.color_hex} onChange={set('color_hex')} style={{ height: '2.8rem', padding: '0.2rem' }} />
            </div>
            <div>
              <label htmlFor="m-weight">Weight</label>
              <input id="m-weight" maxLength={40} value={form.fiber_weight} onChange={set('fiber_weight')} placeholder="DK, worsted..." />
            </div>
            <div>
              <label htmlFor="m-colornum">Colour number</label>
              <input id="m-colornum" maxLength={40} value={form.color_number} onChange={set('color_number')} />
            </div>
            <div>
              <label htmlFor="m-batch">Batch / dye lot</label>
              <input id="m-batch" maxLength={40} value={form.batch_number} onChange={set('batch_number')} />
            </div>
          </>
        )}
      </div>
      {error && <p className={page.formError} role="alert">{error}</p>}
      <div className={page.formActions}>
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add to stash'}</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

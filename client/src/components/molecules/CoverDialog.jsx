import { useEffect, useRef, useState } from 'react'
import Button from '../atoms/Button.jsx'
import CoverPicker from './CoverPicker.jsx'
import styles from './CoverDialog.module.css'

// "Change cover" for a project that already exists. A native <dialog> gives a
// focus trap, Escape-to-close and a backdrop with no extra code.
export default function CoverDialog({ project, current, onSave, onClose }) {
  const ref = useRef(null)
  const [cover, setCover] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  async function save() {
    if (!cover) return onClose()
    setSaving(true)
    setError(null)
    try {
      await onSave(cover)
      onClose()
    } catch (caught) {
      setError(caught.message)
      setSaving(false)
    }
  }

  return (
    <dialog ref={ref} className={styles.dialog} onClose={onClose} aria-labelledby="cover-title"
      onClick={(event) => { if (event.target === ref.current) onClose() }}>
      <h2 id="cover-title" className={styles.title}>Cover for {project.title}</h2>
      <CoverPicker value={cover} onChange={setCover} current={current} color={project.color_hex} allowRemove />
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.footer}>
        <Button onClick={save} disabled={saving || !cover}>{saving ? 'Saving…' : 'Save cover'}</Button>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </dialog>
  )
}

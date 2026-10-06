import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Link2, Trash2 } from 'lucide-react'
import Button from '../atoms/Button.jsx'
import { shrinkImage, checkCoverUrl } from '../../utils/image.js'
import styles from './CoverPicker.module.css'

// Lets someone choose a project photo by uploading, dragging one in, or pasting
// a link. It never talks to the server: it reports the choice upward through
// onChange, and the parent decides when to save it.
//
// value: null (nothing chosen yet)
//      | { kind: 'file', blob, preview }   a shrunken upload, preview is an object URL
//      | { kind: 'url', url }              a link
//      | { kind: 'remove' }                clear the existing cover
// current: the cover the project already has (a src string) or null
export default function CoverPicker({ value, onChange, current = null, color = '#F8C7D2', allowRemove = false }) {
  const fileInput = useRef(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [link, setLink] = useState('')
  const [over, setOver] = useState(false)
  const [broken, setBroken] = useState(false)

  // Object URLs hold memory until released. Free the old one whenever the
  // chosen file changes and when the picker closes.
  const lastPreview = useRef(null)
  useEffect(() => {
    const preview = value?.kind === 'file' ? value.preview : null
    if (lastPreview.current && lastPreview.current !== preview) URL.revokeObjectURL(lastPreview.current)
    lastPreview.current = preview
  }, [value])
  useEffect(() => () => { if (lastPreview.current) URL.revokeObjectURL(lastPreview.current) }, [])

  const shown = value?.kind === 'file' ? value.preview
    : value?.kind === 'url' ? value.url
    : value?.kind === 'remove' ? null
    : current

  async function takeFile(file) {
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      const blob = await shrinkImage(file)
      setBroken(false)
      onChange({ kind: 'file', blob, preview: URL.createObjectURL(blob) })
      setLinkOpen(false)
    } catch (caught) {
      setError(caught.message)
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ''   // lets the same file be picked again
    }
  }

  function useLink() {
    const result = checkCoverUrl(link)
    if (!result.ok) return setError(result.error)
    setError(null)
    setBroken(false)
    onChange({ kind: 'url', url: result.url })
  }

  return (
    <div className={styles.picker}>
      <div
        className={`${styles.preview} ${over ? styles.over : ''}`}
        style={{ '--swatch': color }}
        onDragOver={(event) => { event.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => { event.preventDefault(); setOver(false); takeFile(event.dataTransfer.files?.[0]) }}
      >
        {shown && !broken ? (
          <img key={shown} src={shown} alt="Cover preview" className={styles.img}
            referrerPolicy="no-referrer" onError={() => setBroken(true)} />
        ) : (
          <span className={styles.empty}>
            <span aria-hidden="true" className={styles.emoji}>🧶</span>
            {broken ? 'That link did not load a picture' : 'Drop a photo here'}
          </span>
        )}
        {busy && <span className={styles.busy} role="status">Getting your photo ready…</span>}
      </div>

      <div className={styles.actions}>
        <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif"
          className="visually-hidden" id="cover-file" onChange={(event) => takeFile(event.target.files?.[0])} />
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => fileInput.current?.click()}>
          <ImagePlus size={16} aria-hidden="true" /> {shown ? 'Change photo' : 'Upload photo'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setLinkOpen((open) => !open)} aria-expanded={linkOpen}>
          <Link2 size={16} aria-hidden="true" /> Use a link
        </Button>
        {allowRemove && (current || value) && value?.kind !== 'remove' && (
          <Button size="sm" variant="ghost" onClick={() => { setError(null); setBroken(false); onChange({ kind: 'remove' }) }}>
            <Trash2 size={16} aria-hidden="true" /> Remove
          </Button>
        )}
        {value && (
          <Button size="sm" variant="ghost" onClick={() => { setError(null); setBroken(false); onChange(null) }}>Undo</Button>
        )}
      </div>

      {linkOpen && (
        <div className={styles.linkRow}>
          <label className="visually-hidden" htmlFor="cover-link">Picture link</label>
          <input id="cover-link" inputMode="url" placeholder="https://example.com/my-project.jpg" value={link}
            onChange={(event) => setLink(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); useLink() } }} />
          <Button size="sm" onClick={useLink}>Use</Button>
        </div>
      )}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  )
}

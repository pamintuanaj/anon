import { useRef, useState } from 'react'
import { ImagePlus, Smile, X } from 'lucide-react'
import Sticker, { STICKERS } from '../atoms/Sticker.jsx'
import { shrinkImage } from '../../utils/image.js'
import styles from './AttachBar.module.css'

// "Add a photo" and "add a sticker" for a post or comment. It only collects the
// choice; the parent sends it. image: { blob, preview } | null, sticker: id | null.
export default function AttachBar({ image, sticker, onImage, onSticker, compact = false, idPrefix = 'att' }) {
  const file = useRef(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function pick(chosen) {
    if (!chosen) return
    setError(null)
    setBusy(true)
    try {
      // 400 KB keeps well under the server's 450 KB limit for decoded bytes.
      const blob = await shrinkImage(chosen, { maxSide: compact ? 800 : 1000, quality: 0.8, maxBytes: 400 * 1024 })
      if (image?.preview) URL.revokeObjectURL(image.preview)
      onImage({ blob, preview: URL.createObjectURL(blob) })
    } catch (caught) {
      setError(caught.message)
    } finally {
      setBusy(false)
      if (file.current) file.current.value = ''
    }
  }

  function dropImage() {
    if (image?.preview) URL.revokeObjectURL(image.preview)
    onImage(null)
  }

  return (
    <div className={styles.bar}>
      <div className={styles.buttons}>
        <input ref={file} id={`${idPrefix}-file`} type="file" accept="image/png,image/jpeg,image/webp,image/gif"
          className="visually-hidden" onChange={(e) => pick(e.target.files?.[0])} />
        <button type="button" className={styles.btn} disabled={busy} onClick={() => file.current?.click()}>
          <ImagePlus size={16} aria-hidden="true" /> {busy ? 'Preparing…' : 'Photo'}
        </button>
        <button type="button" className={`${styles.btn} ${open ? styles.on : ''}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <Smile size={16} aria-hidden="true" /> Sticker
        </button>
      </div>

      {open && (
        <div className={styles.tray} role="radiogroup" aria-label="Choose a sticker">
          {STICKERS.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={sticker === s.id} aria-label={s.label}
              className={`${styles.sticker} ${sticker === s.id ? styles.picked : ''}`}
              onClick={() => { onSticker(sticker === s.id ? null : s.id); setOpen(false) }}>
              <Sticker id={s.id} size={compact ? 34 : 44} title={false} />
            </button>
          ))}
        </div>
      )}

      {(image || sticker) && (
        <div className={styles.chosen}>
          {image && (
            <span className={styles.thumb}>
              <img src={image.preview} alt="Photo you are about to post" />
              <button type="button" onClick={dropImage} aria-label="Remove photo"><X size={14} aria-hidden="true" /></button>
            </span>
          )}
          {sticker && (
            <span className={styles.thumb}>
              <Sticker id={sticker} size={44} />
              <button type="button" onClick={() => onSticker(null)} aria-label="Remove sticker"><X size={14} aria-hidden="true" /></button>
            </span>
          )}
        </div>
      )}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  )
}

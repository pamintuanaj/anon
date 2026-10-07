import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import ToolsPanel from './ToolsPanel.jsx'
import styles from './ToolsDrawer.module.css'

// Every tool, one tap away while you look at your pattern.
//   Wide screens (1100px and up): a panel on the right. The page makes room for
//     it (TrackerPage adds its `split` class), so the counter and pattern stay
//     in view next to it: a split pane.
//   Narrower screens: a bottom sheet that slides up over the page. The dimmed
//     area behind it closes it.
// It is mounted on document.body with a portal so no parent can clip it.
// Escape closes it, and focus goes back to the Tools button afterwards.
export default function ToolsDrawer({ open, onClose, projectTitle, row, total }) {
  const [tool, setTool] = useState('spread')   // the tool most used mid-pattern
  const closeRef = useRef(null)
  const asideRef = useRef(null)

  // `inert` makes a closed drawer unfocusable and unclickable. It is set through
  // the DOM, not as a JSX prop, because React 18 and 19 treat that prop differently.
  useEffect(() => { asideRef.current?.toggleAttribute('inert', !open) }, [open])

  useEffect(() => {
    if (!open) return
    const before = document.activeElement
    closeRef.current?.focus()
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); before?.focus?.() }
  }, [open, onClose])

  return createPortal(
    <>
      <div className={`${styles.scrim} ${open ? styles.scrimOn : ''}`} onClick={onClose} aria-hidden="true" />
      <aside ref={asideRef} className={`${styles.drawer} ${open ? styles.open : ''}`} aria-label="Tools" aria-hidden={!open}>
        <span className={styles.grab} aria-hidden="true" />
        <header className={styles.head}>
          <div className={styles.titles}>
            <h2 className={styles.title}>Tools</h2>
            <p className={styles.sub}>{projectTitle} · row {row} of {total}</p>
          </div>
          <Link className={styles.round} to="/tools" title="Open the full Tools page">
            <ExternalLink size={16} aria-hidden="true" /><span className="visually-hidden">Open the full Tools page</span>
          </Link>
          <button ref={closeRef} type="button" className={styles.round} onClick={onClose} aria-label="Close tools">
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className={styles.body}>
          {/* Only built while open, so the chart maker is not loading its data in the background. */}
          {open && <ToolsPanel tool={tool} onTool={setTool} compact />}
        </div>
      </aside>
    </>,
    document.body
  )
}

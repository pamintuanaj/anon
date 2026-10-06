import { GripVertical } from 'lucide-react'
import { useDraggablePill } from '../../hooks/useDraggablePill.js'
import styles from './FloatingCounter.module.css'

// A pill that floats over the page while you scroll down to the pattern, so the
// row counter is always one tap away. TrackerPage shows it only when the big
// counter is off screen.
//
// It can be dragged anywhere (grab the grip, the number, or the pill's edge),
// so it never has to cover the footer or the part of the pattern you are
// reading. Where you leave it is remembered. Keyboard: focus the grip, then
// arrow keys to move, Home to send it back to the corner. Double-click the grip
// does the same.
export default function FloatingCounter({ visible, row, total, onAdd, onUndo }) {
  const { ref, style, dragging, pillProps, gripProps } = useDraggablePill()
  return (
    <div ref={ref} style={style} {...pillProps} aria-hidden={!visible}
      className={`${styles.pill} ${visible ? styles.shown : ''} ${dragging ? styles.dragging : ''}`}>
      <button type="button" className={styles.grip} data-drag-handle {...gripProps}
        disabled={!visible} tabIndex={visible ? 0 : -1}
        aria-label="Move the counter. Drag it, or use the arrow keys. Press Home to put it back."
        title="Drag to move. Double-click to put it back.">
        <GripVertical size={18} aria-hidden="true" />
      </button>
      <button type="button" className={`${styles.btn} ${styles.minus}`} onClick={onUndo}
        disabled={!visible || row === 0} tabIndex={visible ? 0 : -1} aria-label="Undo last row">−</button>
      <div className={styles.count} aria-live="polite">
        <span className={styles.label}>row</span>
        <strong>{row}</strong>
        <span className={styles.label}>of {total}</span>
      </div>
      <button type="button" className={`${styles.btn} ${styles.plus}`} onClick={onAdd}
        disabled={!visible || row >= total} tabIndex={visible ? 0 : -1} aria-label={`Finish row ${row + 1}`}>+</button>
    </div>
  )
}

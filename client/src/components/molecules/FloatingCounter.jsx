import styles from './FloatingCounter.module.css'

// A pill that floats in the bottom-right corner while you scroll down to the
// pattern, so the row counter is always one tap away. TrackerPage shows it
// only when the big counter is off screen.
export default function FloatingCounter({ visible, row, total, onAdd, onUndo }) {
  return (
    <div className={`${styles.pill} ${visible ? styles.shown : ''}`} aria-hidden={!visible}>
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

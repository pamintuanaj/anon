import styles from './StitchCounter.module.css'

// A second, smaller counter for stitches inside the current row. The row
// counter resets it to 0 whenever a row is finished (see TrackerPage).
export default function StitchCounter({ value, onChange }) {
  return (
    <section className={styles.card} aria-labelledby="stitch-title">
      <div>
        <h2 id="stitch-title" className={styles.title}>Stitches in this row</h2>
        <p className={styles.hint}>Resets when you finish the row</p>
      </div>
      <div className={styles.controls}>
        <button type="button" className={styles.round} onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0} aria-label="One stitch less">−</button>
        <output key={value} className={styles.value} aria-live="polite" aria-label={`${value} stitches`}>{value}</output>
        <button type="button" className={`${styles.round} ${styles.plus}`} onClick={() => onChange(Math.min(9999, value + 1))}
          aria-label="One more stitch">+</button>
      </div>
      <button type="button" className={styles.reset} onClick={() => onChange(0)} disabled={value === 0}>Reset</button>
    </section>
  )
}

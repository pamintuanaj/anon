import styles from './ProgressGrid.module.css'

// One dot per row of the pattern. Worked rows are green, the row you are on
// is pink, rows still to come are an outline.
export default function ProgressGrid({ totalRows, currentRow, plain = false }) {
  const dots = Array.from({ length: totalRows }, (_, index) => {
    const row = index + 1
    const state = row <= currentRow ? styles.done : row === currentRow + 1 ? styles.current : ''
    return <span key={row} className={`${styles.dot} ${state}`} title={`Row ${row}`} />
  })

  return (
    <section className={plain ? styles.plain : styles.panel} aria-label={`Progress: ${currentRow} of ${totalRows} rows done`}>
      <div className={styles.grid} aria-hidden="true">{dots}</div>
    </section>
  )
}

import styles from './Skeleton.module.css'

// Grey placeholder shapes with a moving shine, shown while data loads, so the
// page keeps its layout instead of jumping when the content arrives.
export function SkeletonCards({ count = 4, height = '14rem', min = '15rem' }) {
  return (
    <div className={styles.grid} style={{ '--min': min }} role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.card} style={{ height, '--i': i }} />
      ))}
    </div>
  )
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className={styles.list} role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => <div key={i} className={styles.row} style={{ '--i': i }} />)}
    </div>
  )
}

import styles from './StreakChip.module.css'

// "3-day streak" pill. Nothing is shown until there is a streak to celebrate.
export default function StreakChip({ count, best }) {
  if (!count) return null
  return (
    <span className={styles.chip} title={`Longest streak: ${best} ${best === 1 ? 'day' : 'days'}`}>
      <span aria-hidden="true" className={styles.scoop}>🍦</span>
      {count}-day streak
    </span>
  )
}

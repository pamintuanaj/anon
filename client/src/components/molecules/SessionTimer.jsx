import Button from '../atoms/Button.jsx'
import styles from './SessionTimer.module.css'

export function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n) => String(n).padStart(2, '0')
  return `${h}:${pad(m)}:${pad(s)}`
}

// Display only. The ticking lives in TrackerPage, which owns the time.
export default function SessionTimer({ seconds, running, onToggle, onReset }) {
  return (
    <section className={styles.card} aria-labelledby="timer-title">
      <h2 id="timer-title" className={styles.title}>Time on this project</h2>
      <p className={styles.time} aria-live="off">{formatDuration(seconds)}</p>
      <div className={styles.buttons}>
        <Button onClick={onToggle} variant={running ? 'secondary' : 'primary'}>
          {running ? 'Pause' : 'Start timer'}
        </Button>
        <Button variant="ghost" onClick={onReset} disabled={running || seconds === 0}>Reset</Button>
      </div>
    </section>
  )
}

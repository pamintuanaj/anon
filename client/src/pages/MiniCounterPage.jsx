import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProject, saveProgress, listCounters, setCounterValue, listReminders } from '../api'
import { advanceLinked, rewindLinked, reminderIsDue } from '../utils/counters.js'
import { isTenRowMilestone } from '../utils/milestones.js'
import styles from './MiniCounterPage.module.css'

// A tiny counter for a small window beside the pattern, or a phone propped
// next to your yarn. It saves straight away on every tap, so it and the full
// tracker stay in step as long as you use one at a time.
export default function MiniCounterPage() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [counters, setCounters] = useState([])
  const [reminders, setReminders] = useState([])
  const [error, setError] = useState(null)
  const [pop, setPop] = useState(0)

  useEffect(() => {
    Promise.all([getProject(id), listCounters(id), listReminders(id)])
      .then(([p, c, r]) => { setProject(p); setCounters(c); setReminders(r) })
      .catch((e) => setError(e.message))
  }, [id])

  async function move(direction) {
    const row = project.current_row + direction
    if (row < 0 || row > project.total_rows) return
    const updated = { ...project, current_row: row }
    setProject(updated)
    if (direction > 0 && isTenRowMilestone(row)) setPop(Date.now())
    const nextCounters = counters.map((c) => (c.linked ? { ...c, value: direction > 0 ? advanceLinked(c) : rewindLinked(c) } : c))
    setCounters(nextCounters)
    try {
      await saveProgress(id, { current_row: row, current_stitch: 0, notes: project.notes, elapsed_seconds: project.elapsed_seconds })
      await Promise.all(nextCounters.filter((c, i) => c.value !== counters[i].value).map((c) => setCounterValue(c.id, c.value)))
    } catch (e) {
      setError(e.message)
    }
  }

  if (error) return <main className={styles.mini}><p role="alert">{error}</p></main>
  if (!project) return <main className={styles.mini}><p>Loading...</p></main>

  const working = Math.min(project.current_row + 1, project.total_rows)
  const due = reminders.filter((r) => reminderIsDue(r, working))

  return (
    <main className={styles.mini}>
      <h1 className={styles.title}>{project.title}</h1>
      <p className={styles.sub}>row {project.current_row} of {project.total_rows}</p>
      <div className={styles.count} key={pop}>{project.current_row}</div>
      <div className={styles.buttons}>
        <button type="button" onClick={() => move(-1)} aria-label="Undo a row" disabled={project.current_row === 0}>−</button>
        <button type="button" className={styles.plus} onClick={() => move(1)} aria-label="Finish a row"
          disabled={project.current_row >= project.total_rows}>+</button>
      </div>
      {due.map((r) => <p key={r.id} className={styles.reminder}>🔔 {r.text}</p>)}
      {counters.length > 0 && (
        <ul className={styles.counters}>
          {counters.map((c) => (
            <li key={c.id} style={{ '--c': c.color }}>
              <span>{c.name}</span><strong>{c.value}{c.repeat_every ? `/${c.repeat_every}` : ''}</strong>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

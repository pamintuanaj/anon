import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import styles from './ProjectCard.module.css'

// A drawn ball of yarn in the project's colour, with a progress ring around
// it. Instead of an empty photo placeholder, the card shows the two things you
// want to know at a glance: which project, and how far along it is.
function YarnProgress({ color, percent }) {
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 128 128" className={styles.art} aria-hidden="true">
      <circle cx="64" cy="64" r={r} className={styles.track} />
      <circle cx="64" cy="64" r={r} className={styles.ring}
        strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} />
      <circle cx="64" cy="64" r="36" fill={color} />
      <g fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round">
        <path d="M34 54 C 50 44, 78 44, 94 56" />
        <path d="M32 72 C 50 62, 80 62, 96 74" />
        <path d="M48 32 C 38 50, 40 80, 54 98" />
      </g>
      <path d="M92 90 C 104 100, 112 92, 108 84" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

export default function ProjectCard({ project, index = 0, onStatus, onDelete }) {
  const percent = Math.round((project.current_row / project.total_rows) * 100)
  return (
    <article className={`${styles.card} enter lift`} style={{ '--i': index, '--swatch': project.color_hex }}>
      <Link to={`/workspace/${project.id}`} className={styles.cover}>
        <YarnProgress color={project.color_hex} percent={percent} />
        <span className={styles.percent}>{percent}%</span>
        <span className="visually-hidden">Open {project.title} in the tracker</span>
      </Link>
      <div className={styles.body}>
        <h3 className={styles.title}><Link to={`/workspace/${project.id}`}>{project.title}</Link></h3>
        <p className={styles.meta}>Row {project.current_row} of {project.total_rows}</p>
        <p className={styles.pattern}>{project.pattern_ref || 'No pattern notes'}</p>
      </div>
      <div className={styles.actions}>
        <label className="visually-hidden" htmlFor={`status-${project.id}`}>Move {project.title} to</label>
        <select id={`status-${project.id}`} value={project.status} className={styles.select}
          onChange={(event) => onStatus(project, event.target.value)}>
          <option value="ongoing">Ongoing</option>
          <option value="done">Done</option>
          <option value="archived">Archived</option>
        </select>
        <button type="button" className={styles.delete} onClick={() => onDelete(project)} aria-label={`Delete ${project.title}`}>
          <Trash2 size={18} />
        </button>
      </div>
    </article>
  )
}

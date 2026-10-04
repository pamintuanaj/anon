import styles from './CounterCard.module.css'

// One extra counter. With a repeat, the ring shows how far through the repeat
// you are; without one, it is a plain count.
export default function CounterCard({ counter, onChange, onEdit }) {
  const { name, value, repeat_every: repeat, linked, color } = counter
  const fraction = repeat ? Math.min(1, value / repeat) : 0
  const circumference = 2 * Math.PI * 26
  return (
    <article className={`${styles.card} lift`} style={{ '--c': color }}>
      <header className={styles.head}>
        <h3 className={styles.name}>{name}</h3>
        <div className={styles.badges}>
          {linked && <span className={styles.badge} title="Moves with the row counter">🔗 linked</span>}
          <button type="button" className={styles.edit} onClick={() => onEdit(counter)} aria-label={`Edit ${name}`}>⋯</button>
        </div>
      </header>
      <div className={styles.body}>
        <button type="button" className={styles.round} onClick={() => onChange(counter, -1)}
          disabled={value === 0} aria-label={`${name}: minus one`}>−</button>
        <div className={styles.ring}>
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="26" className={styles.track} />
            {repeat && (
              <circle cx="32" cy="32" r="26" className={styles.fill}
                strokeDasharray={circumference} strokeDashoffset={circumference * (1 - fraction)} />
            )}
          </svg>
          <output key={value} className={styles.value} aria-live="polite">{value}</output>
        </div>
        <button type="button" className={`${styles.round} ${styles.plus}`} onClick={() => onChange(counter, 1)}
          aria-label={`${name}: plus one`}>+</button>
      </div>
      {repeat && <p className={styles.hint}>{value} of {repeat} in the repeat</p>}
    </article>
  )
}

import styles from './ZenToggle.module.css'

// A switch, not a button: role="switch" with aria-checked tells screen readers
// it is on/off. The knob slide and track colour are pure CSS, driven by the
// .on class, so React only has to flip one boolean.
export default function ZenToggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`${styles.toggle} ${checked ? styles.on : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.track} aria-hidden="true">
        <span className={styles.knob}>{checked ? '🌙' : '☀️'}</span>
      </span>
      <span className={styles.label}>Zen focus</span>
    </button>
  )
}

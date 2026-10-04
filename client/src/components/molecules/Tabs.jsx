import styles from './Tabs.module.css'

// A row of pill tabs. options: [{ value, label, count? }]
export default function Tabs({ label, options, value, onChange }) {
  return (
    <div className={styles.tabs} role="tablist" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          className={`${styles.tab} ${value === option.value ? styles.active : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count != null && <span className={styles.count}>{option.count}</span>}
        </button>
      ))}
    </div>
  )
}

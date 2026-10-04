import { Search } from 'lucide-react'
import styles from './SearchBar.module.css'

export default function SearchBar({ id, label, value, onChange, placeholder }) {
  return (
    <div className={styles.wrap}>
      <label htmlFor={id} className="visually-hidden">{label}</label>
      <span className={styles.icon} aria-hidden="true"><Search size={16} strokeWidth={2.5} /></span>
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={styles.input}
        maxLength={80}
      />
    </div>
  )
}

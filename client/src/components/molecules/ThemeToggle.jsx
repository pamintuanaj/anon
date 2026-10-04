import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme.js'
import styles from './ThemeToggle.module.css'

export default function ThemeToggle({ compact = false, block = false }) {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button type="button" className={`${styles.toggle} ${block ? styles.block : ''} ${compact ? styles.compactBtn : ''}`} onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Light mode' : 'Dark mode'}>
      <span className={`${styles.icon} ${dark ? styles.dark : ''}`} aria-hidden="true">{dark ? <Moon size={18} /> : <Sun size={18} />}</span>
      {!compact && <span>{dark ? 'Dark mode' : 'Light mode'}</span>}
    </button>
  )
}

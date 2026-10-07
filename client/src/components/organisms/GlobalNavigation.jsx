import { NavLink, useNavigate } from 'react-router-dom'
import { MessageCircleHeart, CircleDot, LayoutGrid, Archive, Wrench, Plus, Sparkles } from 'lucide-react'
import Logo from '../atoms/Logo.jsx'
import ThemeToggle from '../molecules/ThemeToggle.jsx'
import styles from './GlobalNavigation.module.css'

export const LINKS = [
  { to: '/', label: 'Community', Icon: MessageCircleHeart, end: true },
  { to: '/workspace', label: 'Tracker', Icon: CircleDot },
  { to: '/gallery', label: 'Projects', Icon: LayoutGrid },
  { to: '/patterns', label: 'Patterns', Icon: Sparkles },
  { to: '/inventory', label: 'Stash', Icon: Archive },
  { to: '/tools', label: 'Tools', Icon: Wrench },
]

// Desktop: a sidebar with the logo, the main sections, one call to action and
// the theme switch. Phones: the same sections as a bar along the bottom.
export default function GlobalNavigation() {
  const navigate = useNavigate()
  return (
    <nav className={styles.nav} aria-label="Main">
      <NavLink to="/" className={styles.brand} aria-label="CrocheTa home">
        <Logo size={40} title="" />
        <span className={styles.brandText}>
          <span className={styles.wordmark}>CrocheTa</span>
          <span className={styles.tagline}>Mag-crochet tamu!</span>
        </span>
      </NavLink>

      <button type="button" className={styles.cta} onClick={() => navigate('/gallery?new=1')}>
        <Plus size={18} aria-hidden="true" /> New project
      </button>

      <ul className={styles.list}>
        {LINKS.map(({ to, label, Icon, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
              <Icon size={20} strokeWidth={2.2} aria-hidden="true" className={styles.icon} />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className={styles.bottom}>
        <ThemeToggle block />
      </div>
    </nav>
  )
}

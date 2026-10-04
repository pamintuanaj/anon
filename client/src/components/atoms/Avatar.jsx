import styles from './Avatar.module.css'

const COLORS = ['#F8C7D2', '#8ED0D6', '#F4B3A8', '#FBE3B8', '#BFE6E8']

// No uploaded photos: a coloured circle with the first letter, picked the same
// way every time for the same name.
export default function Avatar({ name, size = 'md' }) {
  const index = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % COLORS.length
  return (
    <span className={`${styles.avatar} ${size === 'sm' ? styles.sm : ''}`} style={{ background: COLORS[index] }} aria-hidden="true">
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

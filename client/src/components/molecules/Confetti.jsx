import { useEffect, useMemo, useState } from 'react'
import styles from './Confetti.module.css'

const COLORS = ['#E88FA4', '#8ED0D6', '#F4B3A8', '#FBE3B8', '#BFE6E8', '#F8C7D2']

// Shown when a milestone is reached. `burst` is a changing key: every new value
// plays the animation again. The message stays readable for screen readers
// even when reduced motion hides the falling pieces.
export default function Confetti({ burst, message }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!burst) return
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), 3200)
    return () => clearTimeout(timer)
  }, [burst])

  const pieces = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.8 + Math.random() * 1.2,
    color: COLORS[i % COLORS.length],
    rotate: Math.random() * 360,
    round: i % 3 === 0,
  })), [burst])

  if (!visible) return null
  return (
    <div className={styles.layer}>
      <div className={styles.pieces} aria-hidden="true">
        {pieces.map((p, i) => (
          <span key={i} className={styles.piece} style={{
            left: `${p.left}%`, background: p.color,
            animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`,
            borderRadius: p.round ? '50%' : '2px', '--r': `${p.rotate}deg`,
          }} />
        ))}
      </div>
      <p className={styles.toast} role="status">{message}</p>
    </div>
  )
}

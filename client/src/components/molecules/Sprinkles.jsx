import { useEffect, useState } from 'react'
import styles from './Sprinkles.module.css'

const COLORS = ['#E88FA4', '#8ED0D6', '#F4B3A8', '#FBE3B8', '#BFE6E8', '#F8C7D2']

// 16 sprinkles in a ring: 360 / 16 = 22.5 degrees apart, nudged so it looks
// scattered and not like a clock face.
const PIECES = Array.from({ length: 16 }, (_, i) => ({
  angle: i * 22.5 + (i % 2) * 7,
  distance: 70 + (i % 4) * 16,
  spin: (i * 53) % 180,
  color: COLORS[i % COLORS.length],
  delay: (i % 4) * 20,
}))

// A quick burst of sprinkles over the row counter. `burst` is a number that
// changes on every tap; as the React key it restarts the animation. The pieces
// remove themselves after the animation so taps never pile up in the DOM, and
// reduced-motion users see nothing at all (the number itself still rolls).
export default function Sprinkles({ burst }) {
  const [shown, setShown] = useState(null)
  useEffect(() => {
    if (!burst) return
    setShown(burst)
    const timer = setTimeout(() => setShown(null), 900)
    return () => clearTimeout(timer)
  }, [burst])

  if (!shown) return null
  return (
    <div key={shown} className={styles.layer} aria-hidden="true">
      {PIECES.map((p, i) => (
        <span key={i} className={styles.sprinkle}
          style={{ '--a': `${p.angle}deg`, '--d': `${p.distance}px`, '--s': `${p.spin}deg`, '--delay': `${p.delay}ms`, background: p.color }} />
      ))}
    </div>
  )
}

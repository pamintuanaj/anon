import { useEffect, useState } from 'react'
import Logo from '../atoms/Logo.jsx'
import styles from './Splash.module.css'

const SEEN_KEY = 'crocheta:splash-seen'
const NAME = 'CrocheTa'

// The opening animation. Plays once per browser session (sessionStorage), so
// it greets you on arrival but does not replay on every page change. A click
// or any key skips it. With reduced motion the logo simply shows and fades.
export default function Splash() {
  const [phase, setPhase] = useState(() => {
    try { return sessionStorage.getItem(SEEN_KEY) ? 'done' : 'playing' } catch { return 'playing' }
  })

  useEffect(() => {
    if (phase !== 'playing') return
    try { sessionStorage.setItem(SEEN_KEY, '1') } catch { /* private mode: just play */ }
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const leave = setTimeout(() => setPhase('leaving'), reduced ? 700 : 2400)
    const skip = () => setPhase('leaving')
    window.addEventListener('keydown', skip)
    return () => { clearTimeout(leave); window.removeEventListener('keydown', skip) }
  }, [phase])

  useEffect(() => {
    if (phase !== 'leaving') return
    const gone = setTimeout(() => setPhase('done'), 450)
    return () => clearTimeout(gone)
  }, [phase])

  if (phase === 'done') return null

  return (
    <div
      className={`${styles.splash} ${phase === 'leaving' ? styles.leaving : ''}`}
      onClick={() => setPhase('leaving')}
      role="presentation"
    >
      <div className={styles.bubbles} aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => <span key={i} style={{ '--i': i }} />)}
      </div>
      <div className={styles.center}>
        <div className={styles.logo}><Logo size={132} animated title="" /></div>
        <h1 className={styles.word} aria-label={NAME}>
          {[...NAME].map((ch, i) => (
            <span key={i} style={{ '--d': `${0.55 + i * 0.06}s` }} aria-hidden="true">{ch}</span>
          ))}
        </h1>
        {/* "Crochet tamu" is Kapampangan for "let's crochet" */}
        <p className={styles.tagline}>Mag-crochet tamu! Every stitch made cozy.</p>
        <div className={styles.thread} aria-hidden="true"><span /></div>
      </div>
      <p className={styles.skip}>Tap anywhere to skip</p>
    </div>
  )
}

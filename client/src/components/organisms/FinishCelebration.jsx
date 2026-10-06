import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import Frog from '../atoms/Frog.jsx'
import Button from '../atoms/Button.jsx'
import styles from './FinishCelebration.module.css'

const COLORS = ['#E88FA4', '#8ED0D6', '#F4B3A8', '#FBE3B8', '#BFE6E8', '#F8C7D2']
const EMOJI = ['🐸', '🎉', '🧶', '🍦', '💖', '✨', '🍓']
const rand = (min, max) => min + Math.random() * (max - min)

// The big moment: the last row is done. It covers the whole screen, so it is
// mounted on document.body with a portal; that way no parent's overflow, z-index
// or transform can clip or trap it. Three layers:
//   burst  pieces that shoot outward from the middle, then fall
//   rain   confetti and emoji that keep drifting down while it is open
//   card   the message and the buttons
export default function FinishCelebration({ open, onClose, onShare, title, totalRows, seconds = 0 }) {
  const card = useRef(null)

  // New random pieces every time it opens, not on every re-render.
  const pieces = useMemo(() => {
    if (!open) return null
    const burst = Array.from({ length: 90 }, (_, i) => {
      const angle = rand(0, Math.PI * 2)
      const reach = rand(18, 52)   // vmin: relative to the smaller screen side, so phones and monitors both fill up
      return { dx: `${Math.cos(angle) * reach}vmin`, dy: `${Math.sin(angle) * reach - 8}vmin`, color: COLORS[i % COLORS.length],
        w: rand(7, 14), h: rand(10, 20), spin: `${rand(240, 900)}deg`, delay: rand(0, 0.25), round: i % 3 === 0 }
    })
    const rain = Array.from({ length: 70 }, (_, i) => ({ left: rand(0, 100), color: COLORS[i % COLORS.length], delay: rand(0, 4),
      duration: rand(3.2, 6), w: rand(7, 12), h: rand(10, 16), round: i % 4 === 0 }))
    const emoji = Array.from({ length: 16 }, (_, i) => ({ left: rand(2, 96), symbol: EMOJI[i % EMOJI.length], size: rand(1.6, 2.8),
      delay: rand(0.2, 5), duration: rand(5, 9) }))
    return { burst, rain, emoji }
  }, [open])

  // While open: lock page scroll, close on Escape, keep Tab inside the card,
  // and hand focus back to where it was when it closes.
  useEffect(() => {
    if (!open) return
    const before = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    card.current?.querySelector('[data-autofocus]')?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') return onClose()
      if (event.key !== 'Tab') return
      const items = [...card.current.querySelectorAll('button')]
      if (!items.length) return
      const first = items[0], last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      before?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60)
  const time = seconds > 0 ? `${h ? `${h}h ` : ''}${m} min` : null

  return createPortal(
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.pieces} aria-hidden="true">
        {pieces.burst.map((p, i) => (
          <span key={`b${i}`} className={styles.burst}
            style={{ '--dx': p.dx, '--dy': p.dy, '--spin': p.spin, width: p.w, height: p.h, background: p.color, borderRadius: p.round ? '50%' : '2px', animationDelay: `${p.delay}s` }} />
        ))}
        {pieces.rain.map((p, i) => (
          <span key={`r${i}`} className={styles.rain}
            style={{ left: `${p.left}%`, width: p.w, height: p.h, background: p.color, borderRadius: p.round ? '50%' : '2px', animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }} />
        ))}
        {pieces.emoji.map((p, i) => (
          <span key={`e${i}`} className={styles.emoji}
            style={{ left: `${p.left}%`, fontSize: `${p.size}rem`, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }}>{p.symbol}</span>
        ))}
      </div>

      <div ref={card} className={styles.card} role="dialog" aria-modal="true" aria-labelledby="finish-title" aria-describedby="finish-sub">
        <div className={styles.frog}><Frog size={150} mood="happy" /></div>
        <h2 id="finish-title" className={styles.title}>You did it!</h2>
        <p id="finish-sub" className={styles.sub}>
          <strong>{title}</strong> is finished. All {totalRows} rows, done.
        </p>
        <ul className={styles.stats}>
          <li><strong>{totalRows}</strong> rows</li>
          {time && <li><strong>{time}</strong> of crocheting</li>}
        </ul>
        <div className={styles.actions}>
          {onShare && <Button onClick={onShare}>Share it with the community</Button>}
          <Button data-autofocus variant="secondary" onClick={onClose}>Back to my project</Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

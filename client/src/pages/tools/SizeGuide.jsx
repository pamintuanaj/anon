import { useState } from 'react'
import Tabs from '../../components/molecules/Tabs.jsx'
import page from '../Page.module.css'
import styles from './Tools.module.css'

// Reference tables. Static data, so no API call: it is the same for everyone.
// Hook and yarn-weight ranges follow the Craft Yarn Council's published
// standards. Old UK hook numbers vary between makers; sizes with no widely
// agreed UK number are left blank rather than guessed.
const HOOKS = [
  { mm: '2.25', us: 'B-1', uk: '13' },
  { mm: '2.75', us: 'C-2', uk: '' },
  { mm: '3.25', us: 'D-3', uk: '10' },
  { mm: '3.5', us: 'E-4', uk: '9' },
  { mm: '3.75', us: 'F-5', uk: '' },
  { mm: '4', us: 'G-6', uk: '8' },
  { mm: '4.5', us: '7', uk: '7' },
  { mm: '5', us: 'H-8', uk: '6' },
  { mm: '5.5', us: 'I-9', uk: '5' },
  { mm: '6', us: 'J-10', uk: '4' },
  { mm: '6.5', us: 'K-10½', uk: '3' },
  { mm: '8', us: 'L-11', uk: '0' },
  { mm: '9', us: 'M/N-13', uk: '00' },
  { mm: '10', us: 'N/P-15', uk: '000' },
]

const WEIGHTS = [
  { n: 0, name: 'Lace', also: 'Fingering, 10-count crochet thread', hook: 'Steel 1.4–2.25 mm', tile: 'var(--tile-pink)' },
  { n: 1, name: 'Super fine', also: 'Sock, fingering, baby', hook: '2.25–3.5 mm', tile: 'var(--tile-peach)' },
  { n: 2, name: 'Fine', also: 'Sport, baby', hook: '3.5–4.5 mm', tile: 'var(--tile-butter)' },
  { n: 3, name: 'Light', also: 'DK, light worsted', hook: '4.5–5.5 mm', tile: 'var(--tile-mint)' },
  { n: 4, name: 'Medium', also: 'Worsted, afghan, aran', hook: '5.5–6.5 mm', tile: 'var(--tile-sky)' },
  { n: 5, name: 'Bulky', also: 'Chunky, craft, rug', hook: '6.5–9 mm', tile: 'var(--tile-lilac)' },
  { n: 6, name: 'Super bulky', also: 'Super bulky, roving', hook: '9–15 mm', tile: 'var(--tile-pink)' },
  { n: 7, name: 'Jumbo', also: 'Jumbo, roving', hook: '15 mm and larger', tile: 'var(--tile-peach)' },
]

// The same stitch has different names in US and UK patterns, which is the
// commonest way to follow a pattern wrong.
const TERMS = [
  { us: 'chain (ch)', uk: 'chain (ch)' },
  { us: 'slip stitch (sl st)', uk: 'slip stitch (ss)' },
  { us: 'single crochet (sc)', uk: 'double crochet (dc)' },
  { us: 'half double crochet (hdc)', uk: 'half treble (htr)' },
  { us: 'double crochet (dc)', uk: 'treble (tr)' },
  { us: 'treble (tr)', uk: 'double treble (dtr)' },
  { us: 'skip', uk: 'miss' },
  { us: 'gauge', uk: 'tension' },
]

const SECTIONS = [
  { value: 'hooks', label: 'Hook sizes' },
  { value: 'weights', label: 'Yarn weights' },
  { value: 'terms', label: 'US / UK terms' },
]

export default function SizeGuide() {
  const [section, setSection] = useState('hooks')
  const [mm, setMm] = useState('')
  const match = HOOKS.find((h) => h.mm === mm.trim().replace(/mm$/i, '').trim())

  return (
    <>
      <div className={page.toolbar}>
        <Tabs label="Guide section" options={SECTIONS} value={section} onChange={setSection} />
      </div>

      {section === 'hooks' && (
        <>
          <div className={styles.lookup}>
            <label htmlFor="hook-mm">Look up a hook in mm</label>
            <div className={styles.lookupRow}>
              <input id="hook-mm" inputMode="decimal" placeholder="e.g. 5" value={mm} onChange={(e) => setMm(e.target.value)} />
              <p className={styles.answer} aria-live="polite">
                {!mm.trim() ? 'Type a size to see its US and UK names.'
                  : match ? <>US <strong>{match.us}</strong>{match.uk && <>, UK <strong>{match.uk}</strong></>}</>
                  : 'Not a standard size in this table.'}
              </p>
            </div>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className="visually-hidden">Crochet hook sizes</caption>
              <thead><tr><th scope="col">Metric</th><th scope="col">US</th><th scope="col">Old UK</th></tr></thead>
              <tbody>
                {HOOKS.map((h) => (
                  <tr key={h.mm} className={match?.mm === h.mm ? styles.hit : ''}>
                    <td><strong>{h.mm} mm</strong></td><td>{h.us}</td><td>{h.uk || '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {section === 'weights' && (
        <div className={styles.weights}>
          {WEIGHTS.map((w) => (
            <article key={w.n} className={styles.weight}>
              <span className={styles.number} style={{ background: w.tile }} aria-hidden="true">{w.n}</span>
              <div>
                <h2 className={styles.weightName}>{w.name} <span className="visually-hidden">(weight {w.n})</span></h2>
                <p className={styles.also}>{w.also}</p>
                <p className={styles.hook}>Hook: <strong>{w.hook}</strong></p>
              </div>
            </article>
          ))}
          <p className={styles.note}>Ranges are the Craft Yarn Council's guidelines. Your yarn label wins if it says something different.</p>
        </div>
      )}

      {section === 'terms' && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="visually-hidden">US and UK crochet terms</caption>
            <thead><tr><th scope="col">US pattern says</th><th scope="col">UK pattern says</th></tr></thead>
            <tbody>
              {TERMS.map((t) => <tr key={t.us}><td>{t.us}</td><td>{t.uk}</td></tr>)}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

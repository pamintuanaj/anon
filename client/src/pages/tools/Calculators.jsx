import { useState } from 'react'
import styles from './Tools.module.css'

const num = (value) => (value === '' ? NaN : Number(value))
const round1 = (n) => Math.round(n * 10) / 10

// ---- Length converter ---------------------------------------------------------
export function LengthConverter() {
  const [value, setValue] = useState('10')
  const [unit, setUnit] = useState('cm')
  const v = num(value)
  // Exact definitions: 1 in = 2.54 cm, 1 yd = 0.9144 m.
  const cm = { cm: v, in: v * 2.54, m: v * 100, yd: v * 91.44 }[unit]
  const ok = Number.isFinite(cm) && cm >= 0
  return (
    <section className={styles.calc} aria-labelledby="len-title">
      <h2 id="len-title">Length converter</h2>
      <div className={styles.row}>
        <div><label htmlFor="len-v">Amount</label><input id="len-v" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} /></div>
        <div>
          <label htmlFor="len-u">Unit</label>
          <select id="len-u" value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="cm">centimetres</option><option value="in">inches</option>
            <option value="m">metres</option><option value="yd">yards</option>
          </select>
        </div>
      </div>
      {ok && (
        <div className={styles.result} aria-live="polite">
          <span><strong>{round1(cm)}</strong> cm · <strong>{round1(cm / 2.54)}</strong> in</span>
          <span><strong>{round1(cm / 100)}</strong> m · <strong>{round1(cm / 91.44)}</strong> yd</span>
        </div>
      )}
    </section>
  )
}

// ---- Gauge / swatch adapter ---------------------------------------------------
export function GaugeAdapter() {
  const [f, setF] = useState({ patSts: '18', patRows: '20', mySts: '16', myRows: '19', count: '90', kind: 'sts' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const [pS, pR, mS, mR, n] = [num(f.patSts), num(f.patRows), num(f.mySts), num(f.myRows), num(f.count)]
  const ok = [pS, pR, mS, mR, n].every((x) => Number.isFinite(x) && x > 0)
  // Gauge is stitches (or rows) per 10 cm. The width a pattern wants is
  // count / patternGauge * 10 cm; you need that width at your own gauge.
  const [pat, mine] = f.kind === 'sts' ? [pS, mS] : [pR, mR]
  const adjusted = ok ? Math.round((n * mine) / pat) : null
  const size = ok ? round1((n / pat) * 10) : null
  return (
    <section className={styles.calc} aria-labelledby="gauge-title">
      <h2 id="gauge-title">Swatch adapter</h2>
      <p className={styles.explain}>Your swatch does not match the pattern's gauge? Get the numbers for your own gauge. Gauge is per 10 cm (4 in).</p>
      <div className={styles.row}>
        <div><label htmlFor="g-ps">Pattern: stitches</label><input id="g-ps" inputMode="decimal" value={f.patSts} onChange={set('patSts')} /></div>
        <div><label htmlFor="g-pr">Pattern: rows</label><input id="g-pr" inputMode="decimal" value={f.patRows} onChange={set('patRows')} /></div>
        <div><label htmlFor="g-ms">Your swatch: stitches</label><input id="g-ms" inputMode="decimal" value={f.mySts} onChange={set('mySts')} /></div>
        <div><label htmlFor="g-mr">Your swatch: rows</label><input id="g-mr" inputMode="decimal" value={f.myRows} onChange={set('myRows')} /></div>
      </div>
      <div className={styles.row}>
        <div><label htmlFor="g-n">Number in the pattern</label><input id="g-n" inputMode="numeric" value={f.count} onChange={set('count')} /></div>
        <div>
          <label htmlFor="g-k">That number is</label>
          <select id="g-k" value={f.kind} onChange={set('kind')}><option value="sts">stitches (width)</option><option value="rows">rows (length)</option></select>
        </div>
      </div>
      {ok && (
        <div className={styles.result} aria-live="polite">
          <span>Work <strong>{adjusted}</strong> {f.kind === 'sts' ? 'stitches' : 'rows'} instead of {n}</span>
          <span className={styles.explain}>Both come out about {size} cm ({round1(size / 2.54)} in).</span>
        </div>
      )}
    </section>
  )
}

// ---- Spread increases or decreases evenly ------------------------------------
// With S stitches and N changes: q = floor(S / N), r = S mod N.
// Each repeat uses some stitches and ends in one increase or decrease; r
// repeats use q + 1 stitches and N - r use q, which adds up to exactly S.
export function spreadEvenly(stitches, changes, mode) {
  const q = Math.floor(stitches / changes)
  const r = stitches % changes
  const plain = (k) => (mode === 'inc' ? k - 1 : k - 2)   // stitches worked plain in a repeat of k
  const act = mode === 'inc' ? 'increase in next st' : 'decrease over next 2 sts'
  const part = (k, times) => {
    const n = plain(k)
    return `[${n > 0 ? `work ${n}, ` : ''}${act}] × ${times}`
  }
  const steps = []
  if (r > 0) steps.push(part(q + 1, r))
  if (changes - r > 0) steps.push(part(q, changes - r))
  return { steps, end: mode === 'inc' ? stitches + changes : stitches - changes }
}

export function SpreadCalculator() {
  const [f, setF] = useState({ stitches: '48', changes: '6', mode: 'inc' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const s = num(f.stitches), n = num(f.changes)
  let error = null
  if (!Number.isInteger(s) || s < 1) error = 'Stitches must be a whole number, 1 or more.'
  else if (!Number.isInteger(n) || n < 1) error = 'Changes must be a whole number, 1 or more.'
  else if (f.mode === 'inc' && n > s) error = 'You can increase at most once per stitch.'
  else if (f.mode === 'dec' && n > Math.floor(s / 2)) error = 'Each decrease uses two stitches, so at most half the stitches.'
  const result = error ? null : spreadEvenly(s, n, f.mode)
  return (
    <section className={styles.calc} aria-labelledby="spread-title">
      <h2 id="spread-title">Spread increases or decreases evenly</h2>
      <div className={styles.row}>
        <div><label htmlFor="sp-s">Stitches now</label><input id="sp-s" inputMode="numeric" value={f.stitches} onChange={set('stitches')} /></div>
        <div><label htmlFor="sp-n">How many</label><input id="sp-n" inputMode="numeric" value={f.changes} onChange={set('changes')} /></div>
        <div>
          <label htmlFor="sp-m">Type</label>
          <select id="sp-m" value={f.mode} onChange={set('mode')}><option value="inc">Increases</option><option value="dec">Decreases</option></select>
        </div>
      </div>
      {error && <p className={styles.explain} role="alert">{error}</p>}
      {result && (
        <div className={styles.result} aria-live="polite">
          {result.steps.map((step) => <span key={step}>{step}</span>)}
          <span className={styles.explain}>You end with <strong>{result.end}</strong> stitches.</span>
        </div>
      )}
    </section>
  )
}

// ---- How many balls of yarn --------------------------------------------------
export function YarnCalculator() {
  const [f, setF] = useState({ need: '400', needUnit: 'm', ball: '120', ballUnit: 'm' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const toM = (v, u) => (u === 'yd' ? v * 0.9144 : v)
  const need = toM(num(f.need), f.needUnit), ball = toM(num(f.ball), f.ballUnit)
  const ok = need > 0 && ball > 0
  const balls = ok ? Math.ceil(need / ball) : null
  const spare = ok ? round1(balls * ball - need) : null
  return (
    <section className={styles.calc} aria-labelledby="yarn-title">
      <h2 id="yarn-title">How many balls do I need?</h2>
      <p className={styles.explain}>Use this when your yarn has a different length per ball than the one in the pattern.</p>
      <div className={styles.row}>
        <div><label htmlFor="y-need">Pattern needs</label><input id="y-need" inputMode="decimal" value={f.need} onChange={set('need')} /></div>
        <div><label htmlFor="y-nu">Unit</label><select id="y-nu" value={f.needUnit} onChange={set('needUnit')}><option value="m">metres</option><option value="yd">yards</option></select></div>
        <div><label htmlFor="y-ball">Your ball has</label><input id="y-ball" inputMode="decimal" value={f.ball} onChange={set('ball')} /></div>
        <div><label htmlFor="y-bu">Unit</label><select id="y-bu" value={f.ballUnit} onChange={set('ballUnit')}><option value="m">metres</option><option value="yd">yards</option></select></div>
      </div>
      {ok && (
        <div className={styles.result} aria-live="polite">
          <span>Buy <strong>{balls}</strong> {balls === 1 ? 'ball' : 'balls'}</span>
          <span className={styles.explain}>About {spare} m left over. Buy them from the same dye lot.</span>
        </div>
      )}
    </section>
  )
}

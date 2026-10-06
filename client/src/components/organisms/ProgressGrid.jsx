import { useId } from 'react'
import { SHAPES, grannyRings, bands, segmentProgress, segmentCount, HAT, BALL } from '../../utils/shapes.js'
import styles from './ProgressGrid.module.css'

// Progress as a picture of what you are making. "Dots" is the original: one dot
// per row. The other shapes group the rows into rings or bands, and each fills
// in as you finish rows, so a granny square grows outwards from its centre and
// a hat or a ball is coloured in from the top down, the way it is crocheted.
//
// shape: dots | granny | hat | ball.  onShape (optional) shows the picker.
export default function ProgressGrid({ totalRows, currentRow, plain = false, shape = 'dots', color = '#E88FA4', onShape }) {
  const label = `Progress: ${currentRow} of ${totalRows} rows done`
  return (
    <section className={plain ? styles.plain : styles.panel} aria-label={label}>
      {onShape && (
        <div className={styles.picker} role="radiogroup" aria-label="Progress picture">
          {SHAPES.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={shape === s.id}
              className={`${styles.choice} ${shape === s.id ? styles.chosen : ''}`} onClick={() => onShape(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      )}
      {shape === 'dots'
        ? <Dots totalRows={totalRows} currentRow={currentRow} />
        : <ShapeProgress shape={shape} totalRows={totalRows} currentRow={currentRow} color={color} />}
    </section>
  )
}

// One dot per row of the pattern. Worked rows are green, the row you are on is
// pink, rows still to come are an outline.
function Dots({ totalRows, currentRow }) {
  const dots = Array.from({ length: totalRows }, (_, index) => {
    const row = index + 1
    const state = row <= currentRow ? styles.done : row === currentRow + 1 ? styles.current : ''
    return <span key={row} className={`${styles.dot} ${state}`} title={`Row ${row}`} />
  })
  return <div className={styles.grid} aria-hidden="true">{dots}</div>
}

const INK = { stroke: 'var(--color-text)', strokeWidth: 2.5, strokeLinejoin: 'round' }
const PALE = 'var(--color-primary-soft)'
// Granny squares are famously multicoloured; ring colours cycle through these.
const GRANNY = ['#E88FA4', '#8ED0D6', '#F4B3A8', '#FBE3B8']

function ShapeProgress({ shape, totalRows, currentRow, color }) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg className={styles.svg} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      {shape === 'granny' && <Granny total={totalRows} current={currentRow} />}
      {shape === 'hat' && <Banded uid={uid} total={totalRows} current={currentRow} color={color} spec={HAT} kind="hat" />}
      {shape === 'ball' && <Banded uid={uid} total={totalRows} current={currentRow} color={color} spec={BALL} kind="ball" />}
    </svg>
  )
}

function Granny({ total, current }) {
  return (
    <g>
      {grannyRings(total).map((ring) => {
        const p = segmentProgress(ring.i, segmentCount(total, 12), current, total)
        const colour = GRANNY[ring.i % GRANNY.length]
        if (ring.solid) {
          return <rect key={ring.i} x={ring.x} y={ring.y} width={ring.size} height={ring.size} rx="3"
            fill={p > 0 ? colour : 'none'} stroke={p > 0 ? 'none' : PALE} strokeWidth="2" strokeDasharray="4 4" />
        }
        return (
          <g key={ring.i}>
            {/* the empty ring, then the finished part drawn over it. pathLength=100 makes
                the dash maths percentages: "p*100 100" paints the first p of the way round. */}
            <rect x={ring.x} y={ring.y} width={ring.size} height={ring.size} rx="2" fill="none"
              stroke={PALE} strokeWidth={ring.stroke} strokeDasharray="3 3" pathLength="100" opacity="0.9" />
            {p > 0 && (
              <rect x={ring.x} y={ring.y} width={ring.size} height={ring.size} rx="2" fill="none" pathLength="100"
                stroke={colour} strokeWidth={ring.stroke} strokeDasharray={`${p * 100} 100`}
                className={p < 1 ? styles.working : ''} style={{ transition: 'stroke-dasharray 500ms ease' }} />
            )}
          </g>
        )
      })}
    </g>
  )
}

function Banded({ uid, total, current, color, spec, kind }) {
  const clip = `${uid}-clip`
  const list = bands(spec, total, spec.bands)
  const n = list.length
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          {kind === 'hat'
            ? spec.paths.map((d) => <path key={d} d={d} />)
            : <circle cx={spec.cx} cy={spec.cy} r={spec.r} />}
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect x="0" y="0" width="200" height="200" fill={PALE} opacity="0.35" />
        {list.map((b) => {
          const p = segmentProgress(b.i, n, current, total)
          return (
            <g key={b.i}>
              {/* +0.6 overlaps neighbouring bands so no hairline gaps show between them */}
              <rect x="0" y={b.y} width="200" height={b.h + 0.6} fill="none" stroke={PALE} strokeWidth="0.8" strokeDasharray="2 3" />
              {p > 0 && (
                <rect x="0" y={b.y} width={200 * p} height={b.h + 0.6} fill={color}
                  className={p < 1 ? styles.working : ''} style={{ transition: 'width 500ms ease' }} />
              )}
            </g>
          )
        })}
      </g>
      {/* the outline goes on top, unclipped, so the edge stays crisp */}
      {kind === 'hat'
        ? spec.paths.map((d) => <path key={d} d={d} fill="none" {...INK} />)
        : <circle cx={spec.cx} cy={spec.cy} r={spec.r} fill="none" {...INK} />}
      {kind === 'ball' && <path d="M56 58 Q70 38 96 34" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.7" />}
    </g>
  )
}

import styles from './RowCounter.module.css'

// 10 pieces around a circle: 360 / 10 = 36 degrees apart.
const PIECES = Array.from({ length: 10 }, (_, i) => ({
  angle: i * 36,
  symbol: i % 2 === 0 ? '♥' : '🧶',
  distance: 110 + (i % 3) * 18,   // three rings, so it does not look too perfect
}))

// The big yarn-ball button. Tapping it finishes the current row.
// burstKey: a number that changes every time a milestone is hit. Using it as the
// React `key` makes React throw away the old hearts and mount new ones, which
// restarts the CSS animation from the beginning.
export default function RowCounter({ currentRow, totalRows, onAdd, onUndo, burstKey, anchorRef }) {
  const finished = currentRow >= totalRows
  return (
    <div className={styles.wrap} ref={anchorRef}>
      <div className={styles.ballWrap}>
        <button
          type="button"
          className={styles.ball}
          onClick={onAdd}
          disabled={finished}
          aria-label={finished ? 'All rows finished' : `Finish row ${currentRow + 1}`}
        >
          <span key={currentRow} className={styles.number}>{currentRow}</span>
          <span className={styles.hint}>{finished ? 'all done!' : 'tap: +1 row'}</span>
        </button>
        {burstKey && (
          <div key={burstKey} className={styles.burst} aria-hidden="true">
            {PIECES.map((p, i) => (
              <span
                key={i}
                className={styles.piece}
                style={{ '--angle': `${p.angle}deg`, '--distance': `${p.distance}px`, '--delay': `${i * 25}ms` }}
              >
                {p.symbol}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* Bubbly minus (mint) and plus (strawberry) under the ball, for people who
          would rather press a clear button than tap the ball itself. */}
      <div className={styles.bubbles}>
        <button type="button" className={`${styles.bubble} ${styles.minus}`} onClick={onUndo}
          disabled={currentRow === 0} aria-label="Undo last row">−</button>
        <span className={styles.of}>of {totalRows}</span>
        <button type="button" className={`${styles.bubble} ${styles.plus}`} onClick={onAdd}
          disabled={finished} aria-label={`Finish row ${currentRow + 1}`}>+</button>
      </div>
    </div>
  )
}

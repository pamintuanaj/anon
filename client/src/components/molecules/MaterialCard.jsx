import Button from '../atoms/Button.jsx'
import styles from './MaterialCard.module.css'

const ICONS = { yarn: '🧶', hook: '🪝', other: '🧷' }

export default function MaterialCard({ material, index = 0, onQty, onDelete }) {
  const out = material.qty === 0
  return (
    <article className={`${styles.card} ${out ? styles.out : ''} ${material.low_stock ? styles.low : ''} enter lift`} style={{ '--i': index }}>
      <div className={styles.top}>
        {material.color_hex
          ? <span className={styles.ball} style={{ backgroundColor: material.color_hex }} aria-hidden="true" />
          : <span className={styles.icon} aria-hidden="true">{ICONS[material.type]}</span>}
        <div className={styles.text}>
          {out && <span className={`${styles.badge} ${styles.badgeOut}`}>Out of stock</span>}
          {material.low_stock && <span className={styles.badge}>Running low</span>}
          <h3>{material.name}</h3>
          <p className={styles.meta}>
            {[material.fiber_weight, material.color_number && `color ${material.color_number}`, material.batch_number && `batch ${material.batch_number}`]
              .filter(Boolean).join(', ') || 'No extra details'}
          </p>
        </div>
      </div>
      <div className={styles.bottom}>
        <div className={styles.qty} aria-live="polite">
          <Button size="sm" variant="secondary" onClick={() => onQty(material, -1)} disabled={out} aria-label={`Use one ${material.name}`}>−</Button>
          <span className={styles.number}>{out ? 'out' : material.qty}</span>
          <Button size="sm" variant="secondary" onClick={() => onQty(material, 1)} aria-label={`Add one ${material.name}`}>+</Button>
        </div>
        <Button size="sm" variant="danger" onClick={() => onDelete(material)}>Remove</Button>
      </div>
    </article>
  )
}

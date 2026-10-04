import styles from './RowNotesCard.module.css'

export default function RowNotesCard({ value, onChange }) {
  return (
    <section className={styles.card}>
      <label htmlFor="row-notes"><h2 className={styles.title}>Notes for this row</h2></label>
      <textarea
        id="row-notes"
        rows={4}
        maxLength={2000}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="e.g. increase every 6th stitch, switch to the mint yarn at row 40"
        className={styles.area}
      />
    </section>
  )
}

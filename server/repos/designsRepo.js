// Saved patterns from the Pattern Builder. The structured instructions live in
// the JSONB column `data`; the list view leaves them out so it stays small.
const META = 'id, title, difficulty, source, total_rows, created_at, updated_at'
const FULL = `${META}, data`

// Flatten { data: {...} } so the client sees one plain pattern object.
const shape = (row) => (row ? { ...row, ...row.data, data: undefined } : null)

export async function list(db) {
  const { rows } = await db.query(
    `SELECT ${META}, data->>'description' AS description FROM pattern_designs ORDER BY updated_at DESC LIMIT 200`)
  return rows
}

export async function getById(db, id) {
  const { rows } = await db.query(`SELECT ${FULL} FROM pattern_designs WHERE id = $1`, [id])
  return shape(rows[0])
}

export async function create(db, d) {
  const { rows } = await db.query(
    `INSERT INTO pattern_designs (title, difficulty, source, total_rows, data)
     VALUES ($1, $2, $3, $4, $5) RETURNING ${FULL}`,
    [d.title, d.difficulty, d.source, d.total_rows, JSON.stringify(d.data)])
  return shape(rows[0])
}

export async function update(db, id, d) {
  const { rows } = await db.query(
    `UPDATE pattern_designs
        SET title = $2, difficulty = $3, source = $4, total_rows = $5, data = $6, updated_at = now()
      WHERE id = $1 RETURNING ${FULL}`,
    [id, d.title, d.difficulty, d.source, d.total_rows, JSON.stringify(d.data)])
  return shape(rows[0])
}

export async function remove(db, id) {
  const { rowCount } = await db.query('DELETE FROM pattern_designs WHERE id = $1', [id])
  return rowCount > 0
}

export { shape }

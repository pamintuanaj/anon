const COLUMNS = 'id, name, cols, rows, palette, cells, updated_at'

export // Returns an array of records, or an empty array if none exist.
// Returns an array of records, or an empty array if none exist.
async function getAll(db) {
  const { rows } = await db.query(`SELECT ${COLUMNS} FROM charts ORDER BY updated_at DESC`)
  return rows
}

export async function create(db, c) {
  const { rows } = await db.query(
    `INSERT INTO charts (name, cols, rows, palette, cells) VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLUMNS}`,
    [c.name, c.cols, c.rows, JSON.stringify(c.palette), JSON.stringify(c.cells)])
  return rows[0]
}

export async function update(db, id, c) {
  const { rows } = await db.query(
    `UPDATE charts SET name = $2, cols = $3, rows = $4, palette = $5, cells = $6, updated_at = now()
      WHERE id = $1 RETURNING ${COLUMNS}`,
    [id, c.name, c.cols, c.rows, JSON.stringify(c.palette), JSON.stringify(c.cells)])
  return rows[0] ?? null
}

export async function remove(db, id) {
  const { rowCount } = await db.query('DELETE FROM charts WHERE id = $1', [id])
  return rowCount > 0
}

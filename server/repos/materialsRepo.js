// low_stock is worked out in SQL so the API, the filter and the badge all use
// the same rule: some left, but at or below the item's own threshold.
const COLUMNS = `id, type, name, color_hex, color_number, batch_number, fiber_weight, qty, low_at,
  (qty > 0 AND qty <= low_at) AS low_stock, created_at`

export // Returns an array of records, or an empty array if none exist.
// Returns an array of records, or an empty array if none exist.
async function getAll(db, { type, search, low }) {
  const conditions = []
  const values = []
  if (low) conditions.push('qty <= low_at')   // running low OR out
  if (type) {
    values.push(type)
    conditions.push(`type = $${values.length}`)
  }
  if (search) {
    // ILIKE with the wildcards added to the VALUE, not glued into the SQL text.
    values.push(`%${search}%`)
    conditions.push(`(name ILIKE $${values.length} OR color_number ILIKE $${values.length})`)
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM materials ${where} ORDER BY type, name`,
    values
  )
  return rows
}

export // Returns an array of records, or an empty array if none exist.
// Returns an array of records, or an empty array if none exist.
async function getById(db, id) {
  const { rows } = await db.query(`SELECT ${COLUMNS} FROM materials WHERE id = $1`, [id])
  return rows[0] ?? null
}

export async function create(db, m) {
  const { rows } = await db.query(
    `INSERT INTO materials (type, name, color_hex, color_number, batch_number, fiber_weight, qty, low_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${COLUMNS}`,
    [m.type, m.name, m.color_hex, m.color_number, m.batch_number, m.fiber_weight, m.qty, m.low_at]
  )
  return rows[0]
}

export async function update(db, id, m) {
  const { rows } = await db.query(
    `UPDATE materials
        SET type = $2, name = $3, color_hex = $4, color_number = $5,
            batch_number = $6, fiber_weight = $7, qty = $8, low_at = $9
      WHERE id = $1
      RETURNING ${COLUMNS}`,
    [id, m.type, m.name, m.color_hex, m.color_number, m.batch_number, m.fiber_weight, m.qty, m.low_at]
  )
  return rows[0] ?? null
}

export async function remove(db, id) {
  const { rowCount } = await db.query('DELETE FROM materials WHERE id = $1', [id])
  return rowCount > 0
}

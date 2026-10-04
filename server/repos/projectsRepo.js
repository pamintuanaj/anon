// Every query uses $1, $2 placeholders. User input never gets pasted into SQL.

const COLUMNS = `id, title, pattern_ref, color_hex, total_rows, current_row, current_stitch,
  status, notes, elapsed_seconds, created_at, updated_at`

export // Returns an array of records, or an empty array if none exist.
// Returns an array of records, or an empty array if none exist.
async function getAll(db, status) {
  if (status) {
    const { rows } = await db.query(
      `SELECT ${COLUMNS} FROM projects WHERE status = $1 ORDER BY updated_at DESC`,
      [status]
    )
    return rows
  }
  const { rows } = await db.query(`SELECT ${COLUMNS} FROM projects ORDER BY updated_at DESC`)
  return rows
}

export // Returns an array of records, or an empty array if none exist.
// Returns an array of records, or an empty array if none exist.
async function getById(db, id) {
  const { rows } = await db.query(`SELECT ${COLUMNS} FROM projects WHERE id = $1`, [id])
  return rows[0] ?? null
}

export async function create(db, p) {
  const { rows } = await db.query(
    `INSERT INTO projects (title, pattern_ref, color_hex, total_rows, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLUMNS}`,
    [p.title, p.pattern_ref, p.color_hex, p.total_rows, p.status]
  )
  return rows[0]
}

// Full edit of the project's details. If total_rows shrinks below the current
// row, the current row is clamped down so the CHECK constraint still holds.
export async function update(db, id, p) {
  const { rows } = await db.query(
    `UPDATE projects
        SET title = $2, pattern_ref = $3, color_hex = $4, total_rows = $5,
            status = $6, current_row = LEAST(current_row, $5), updated_at = now()
      WHERE id = $1
      RETURNING ${COLUMNS}`,
    [id, p.title, p.pattern_ref, p.color_hex, p.total_rows, p.status]
  )
  return rows[0] ?? null
}

// The tracker's autosave. Only the fields that change while crocheting.
// Reaching the last row moves an ongoing project to done; undoing back below
// the last row moves a done project back to ongoing. Archived is left alone.
export async function saveProgress(db, id, p) {
  const { rows } = await db.query(
    `UPDATE projects
        SET current_row = LEAST($2, total_rows), notes = $3, elapsed_seconds = $4,
            current_stitch = $5,
            status = CASE
                       WHEN LEAST($2, total_rows) = total_rows AND status = 'ongoing' THEN 'done'
                       WHEN LEAST($2, total_rows) < total_rows AND status = 'done' THEN 'ongoing'
                       ELSE status
                     END,
            updated_at = now()
      WHERE id = $1
      RETURNING ${COLUMNS}`,
    [id, p.current_row, p.notes, p.elapsed_seconds, p.current_stitch]
  )
  return rows[0] ?? null
}

export async function remove(db, id) {
  const { rowCount } = await db.query('DELETE FROM projects WHERE id = $1', [id])
  return rowCount > 0
}

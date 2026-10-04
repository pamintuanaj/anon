// The file bytes are only read by getFile. Listing never selects `data`, so a
// project with three 5 MB PDFs still lists instantly.
const META = 'id, project_id, name, mime, size_bytes, marks, created_at'

export async function listForProject(db, projectId) {
  const { rows } = await db.query(
    `SELECT ${META} FROM patterns WHERE project_id = $1 ORDER BY id`, [projectId])
  return rows
}

export async function create(db, projectId, p) {
  const { rows } = await db.query(
    `INSERT INTO patterns (project_id, name, mime, size_bytes, data)
     SELECT id, $2, $3, $4, $5 FROM projects WHERE id = $1
     RETURNING ${META}`,
    [projectId, p.name, p.mime, p.data.length, p.data])
  return rows[0] ?? null
}

export // Returns an array of records, or an empty array if none exist.
// Returns an array of records, or an empty array if none exist.
async function getFile(db, id) {
  const { rows } = await db.query('SELECT name, mime, data FROM patterns WHERE id = $1', [id])
  return rows[0] ?? null
}

export async function saveMarks(db, id, marks) {
  const { rows } = await db.query(
    `UPDATE patterns SET marks = $2 WHERE id = $1 RETURNING ${META}`, [id, JSON.stringify(marks)])
  return rows[0] ?? null
}

export async function remove(db, id) {
  const { rowCount } = await db.query('DELETE FROM patterns WHERE id = $1', [id])
  return rowCount > 0
}

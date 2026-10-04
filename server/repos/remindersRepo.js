const COLUMNS = 'id, project_id, at_row, repeat_every, text, created_at'

export async function listForProject(db, projectId) {
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM reminders WHERE project_id = $1 ORDER BY at_row, id`, [projectId])
  return rows
}

export async function create(db, projectId, r) {
  const { rows } = await db.query(
    `INSERT INTO reminders (project_id, at_row, repeat_every, text)
     SELECT id, $2, $3, $4 FROM projects WHERE id = $1
     RETURNING ${COLUMNS}`,
    [projectId, r.at_row, r.repeat_every, r.text])
  return rows[0] ?? null
}

export async function remove(db, id) {
  const { rowCount } = await db.query('DELETE FROM reminders WHERE id = $1', [id])
  return rowCount > 0
}

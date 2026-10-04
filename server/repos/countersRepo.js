const COLUMNS = 'id, project_id, name, value, repeat_every, linked, color, created_at'

export async function listForProject(db, projectId) {
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM counters WHERE project_id = $1 ORDER BY id`, [projectId])
  return rows
}

// INSERT ... SELECT FROM projects: returns nothing if the project is missing,
// so the route can answer 404 instead of a foreign-key 500.
export async function create(db, projectId, c) {
  const { rows } = await db.query(
    `INSERT INTO counters (project_id, name, value, repeat_every, linked, color)
     SELECT id, $2, $3, $4, $5, $6 FROM projects WHERE id = $1
     RETURNING ${COLUMNS}`,
    [projectId, c.name, c.value, c.repeat_every, c.linked, c.color])
  return rows[0] ?? null
}

export async function update(db, id, c) {
  const { rows } = await db.query(
    `UPDATE counters SET name = $2, value = $3, repeat_every = $4, linked = $5, color = $6
      WHERE id = $1 RETURNING ${COLUMNS}`,
    [id, c.name, c.value, c.repeat_every, c.linked, c.color])
  return rows[0] ?? null
}

export async function setValue(db, id, value) {
  const { rows } = await db.query(
    `UPDATE counters SET value = $2 WHERE id = $1 RETURNING ${COLUMNS}`, [id, value])
  return rows[0] ?? null
}

export async function remove(db, id) {
  const { rowCount } = await db.query('DELETE FROM counters WHERE id = $1', [id])
  return rowCount > 0
}

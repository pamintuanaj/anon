// comment_count is a subquery so the feed can show "3 comments" without
// loading every comment for every post.
const COLUMNS = `p.id, p.author, p.body, p.project_id, p.project_title, p.row_snapshot,
  p.total_rows_snapshot, p.likes, p.saved, p.created_at,
  (SELECT COUNT(*)::int FROM comments c WHERE c.post_id = p.id) AS comment_count`

export // Returns an array of records, or an empty array if none exist.
// Returns an array of records, or an empty array if none exist.
async function getAll(db, { search, saved }) {
  const conditions = []
  const values = []
  if (search) {
    values.push(`%${search}%`)
    const n = values.length
    conditions.push(`(p.body ILIKE $${n} OR p.author ILIKE $${n} OR p.project_title ILIKE $${n})`)
  }
  if (saved) conditions.push('p.saved = true')
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM posts p ${where} ORDER BY p.created_at DESC LIMIT 100`,
    values
  )
  return rows
}

// Returns an array of records, or an empty array if none exist.
// Returns an array of records, or an empty array if none exist.
async function getById(db, id) {
  const { rows } = await db.query(`SELECT ${COLUMNS} FROM posts p WHERE p.id = $1`, [id])
  return rows[0] ?? null
}

// A plain post, or a "Share snapshot" post from the tracker. For a snapshot the
// project's title and rows are copied from the projects table inside the same
// statement, so the client cannot claim a row count the project never reached.
export async function create(db, { author, body, project_id }) {
  let id
  if (project_id) {
    const { rows } = await db.query(
      `INSERT INTO posts (author, body, project_id, project_title, row_snapshot, total_rows_snapshot)
       SELECT $1, $2, pr.id, pr.title, pr.current_row, pr.total_rows
         FROM projects pr WHERE pr.id = $3
       RETURNING id`,
      [author, body, project_id]
    )
    if (!rows[0]) return null   // the project does not exist
    id = rows[0].id
  } else {
    const { rows } = await db.query(
      'INSERT INTO posts (author, body) VALUES ($1, $2) RETURNING id',
      [author, body]
    )
    id = rows[0].id
  }
  return getById(db, id)
}

// likes = likes + 1 happens inside the database, so two likes at the same
// moment both count.
export async function like(db, id) {
  const { rowCount } = await db.query('UPDATE posts SET likes = likes + 1 WHERE id = $1', [id])
  return rowCount ? getById(db, id) : null
}

export async function setSaved(db, id, saved) {
  const { rowCount } = await db.query('UPDATE posts SET saved = $2 WHERE id = $1', [id, saved])
  return rowCount ? getById(db, id) : null
}

export async function remove(db, id) {
  const { rowCount } = await db.query('DELETE FROM posts WHERE id = $1', [id])
  return rowCount > 0
}

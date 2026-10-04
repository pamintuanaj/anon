const COLUMNS = 'id, post_id, author, body, created_at'

export async function listForPost(db, postId) {
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM comments WHERE post_id = $1 ORDER BY created_at ASC`,
    [postId]
  )
  return rows
}

// Returns null if the post does not exist, so the route can answer 404
// instead of letting the foreign key throw a 500.
export async function create(db, postId, { author, body }) {
  const { rows } = await db.query(
    `INSERT INTO comments (post_id, author, body)
     SELECT id, $2, $3 FROM posts WHERE id = $1
     RETURNING ${COLUMNS}`,
    [postId, author, body]
  )
  return rows[0] ?? null
}

export async function remove(db, id) {
  const { rowCount } = await db.query('DELETE FROM comments WHERE id = $1', [id])
  return rowCount > 0
}

const COLUMNS = 'id, post_id, author, body, sticker, (image_data IS NOT NULL) AS has_image, created_at'

export async function listForPost(db, postId) {
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM comments WHERE post_id = $1 ORDER BY created_at ASC`,
    [postId]
  )
  return rows
}

// Returns null if the post does not exist, so the route can answer 404
// instead of letting the foreign key throw a 500.
export async function create(db, postId, { author, body, sticker, image }) {
  const { rows } = await db.query(
    `INSERT INTO comments (post_id, author, body, sticker, image_mime, image_data)
     SELECT id, $2, $3, $4, $5, $6 FROM posts WHERE id = $1
     RETURNING ${COLUMNS}`,
    [postId, author, body, sticker ?? null, image?.mime ?? null, image?.data ?? null]
  )
  return rows[0] ?? null
}

export async function getImage(db, id) {
  const { rows } = await db.query(
    'SELECT image_mime AS mime, image_data AS data FROM comments WHERE id = $1 AND image_data IS NOT NULL', [id])
  return rows[0] ?? null
}

export async function remove(db, id) {
  const { rowCount } = await db.query('DELETE FROM comments WHERE id = $1', [id])
  return rowCount > 0
}

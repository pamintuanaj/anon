import { Router } from 'express'
import { pool } from '../db/pool.js'
import * as posts from '../repos/postsRepo.js'
import * as comments from '../repos/commentsRepo.js'
import { parseId, validatePost, validateComment } from '../validate.js'
import { sendImage } from './sendImage.js'

export const router = Router()

const handle = (fn) => (req, res, next) => fn(req, res, next).catch(next)

router.param('id', (req, res, next, raw) => {
  const id = parseId(raw)
  if (!id) return res.status(404).json({ error: 'Post not found' })
  req.postId = id
  next()
})

router.get('/', handle(async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 80) : ''
  const saved = req.query.saved === 'true'
  res.json(await posts.getAll(pool, { search, saved }))
}))

router.post('/', handle(async (req, res) => {
  const { errors, value } = validatePost(req.body ?? {})
  if (errors.length) return res.status(400).json({ error: errors.join('; ') })
  const row = await posts.create(pool, value)
  if (!row) return res.status(404).json({ error: 'That project does not exist' })
  res.status(201).json(row)
}))

router.get('/:id/image', handle(async (req, res) => {
  const file = await posts.getImage(pool, req.postId)
  if (!file) return res.status(404).json({ error: 'No picture on this post' })
  sendImage(res, file)
}))

router.post('/:id/like', handle(async (req, res) => {
  const row = await posts.like(pool, req.postId)
  if (!row) return res.status(404).json({ error: 'Post not found' })
  res.json(row)
}))

// PUT because the client says the final state ("saved: true"), which is safe
// to repeat; a toggle endpoint would flip back if a request were retried.
router.put('/:id/saved', handle(async (req, res) => {
  if (typeof req.body?.saved !== 'boolean') {
    return res.status(400).json({ error: 'saved must be true or false' })
  }
  const row = await posts.setSaved(pool, req.postId, req.body.saved)
  if (!row) return res.status(404).json({ error: 'Post not found' })
  res.json(row)
}))

router.get('/:id/comments', handle(async (req, res) => {
  res.json(await comments.listForPost(pool, req.postId))
}))

router.post('/:id/comments', handle(async (req, res) => {
  const { errors, value } = validateComment(req.body ?? {})
  if (errors.length) return res.status(400).json({ error: errors.join('; ') })
  const row = await comments.create(pool, req.postId, value)
  if (!row) return res.status(404).json({ error: 'Post not found' })
  res.status(201).json(row)
}))

router.delete('/:id', handle(async (req, res) => {
  const removed = await posts.remove(pool, req.postId)
  if (!removed) return res.status(404).json({ error: 'Post not found' })
  res.status(204).end()
}))

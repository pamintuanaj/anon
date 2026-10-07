import { Router } from 'express'
import { pool } from '../db/pool.js'
import * as comments from '../repos/commentsRepo.js'
import { parseId } from '../validate.js'
import { sendImage } from './sendImage.js'

// Listing and adding comments live under /api/posts/:id/comments. Deleting one
// only needs the comment's own id, so it lives here.
export const router = Router()

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id)
    if (!id) return res.status(404).json({ error: 'Comment not found' })
    const removed = await comments.remove(pool, id)
    if (!removed) return res.status(404).json({ error: 'Comment not found' })
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

router.get('/:id/image', async (req, res, next) => {
  try {
    const id = parseId(req.params.id)
    const file = id && await comments.getImage(pool, id)
    if (!file) return res.status(404).json({ error: 'No picture on this comment' })
    sendImage(res, file)
  } catch (error) {
    next(error)
  }
})

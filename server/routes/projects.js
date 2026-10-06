import express, { Router } from 'express'
import { pool } from '../db/pool.js'
import * as projects from '../repos/projectsRepo.js'
import { parseId, validateProject, validateProgress, detectImageType, validateCoverUrl } from '../validate.js'

export const router = Router()

// Express 4 does not catch errors thrown in async handlers. Wrapping each one
// sends a rejected promise to the error middleware instead of crashing.
const handle = (fn) => (req, res, next) => fn(req, res, next).catch(next)

// Every :id route needs a valid number. Doing it once here means a request for
// /api/projects/abc gets a clean 404 rather than a Postgres type error (500).
router.param('id', (req, res, next, raw) => {
  const id = parseId(raw)
  if (!id) return res.status(404).json({ error: 'Project not found' })
  req.projectId = id
  next()
})

router.get('/', handle(async (req, res) => {
  const status = ['ongoing', 'done', 'archived'].includes(req.query.status) ? req.query.status : null
  res.json(await projects.getAll(pool, status))
}))

router.get('/:id', handle(async (req, res) => {
  const row = await projects.getById(pool, req.projectId)
  if (!row) return res.status(404).json({ error: 'Project not found' })
  res.json(row)
}))

router.post('/', handle(async (req, res) => {
  const { errors, value } = validateProject(req.body ?? {})
  if (errors.length) return res.status(400).json({ error: errors.join('; ') })
  res.status(201).json(await projects.create(pool, value))
}))

router.put('/:id', handle(async (req, res) => {
  const { errors, value } = validateProject(req.body ?? {})
  if (errors.length) return res.status(400).json({ error: errors.join('; ') })
  const row = await projects.update(pool, req.projectId, value)
  if (!row) return res.status(404).json({ error: 'Project not found' })
  res.json(row)
}))

// PATCH because the tracker only sends the three fields that change while you
// crochet, not the whole project.
router.patch('/:id/progress', handle(async (req, res) => {
  const { errors, value } = validateProgress(req.body ?? {})
  if (errors.length) return res.status(400).json({ error: errors.join('; ') })
  const row = await projects.saveProgress(pool, req.projectId, value)
  if (!row) return res.status(404).json({ error: 'Project not found' })
  res.json(row)
}))

// ---- Cover photo ------------------------------------------------------------
// PUT with an image body uploads a file (the client shrinks it first, so 2 MB is
// generous). PUT with JSON { url } links to a picture instead. Either one
// replaces whatever cover was there before.
const COVER_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const coverUpload = express.raw({ type: COVER_TYPES, limit: 2 * 1024 * 1024 })

router.put('/:id/cover', coverUpload, handle(async (req, res) => {
  let row
  if (Buffer.isBuffer(req.body) && req.body.length > 0) {
    const mime = detectImageType(req.body)   // decided from the bytes, not the header
    if (!mime) return res.status(415).json({ error: 'That file is not a PNG, JPEG or WebP image' })
    row = await projects.setCoverImage(pool, req.projectId, { mime, data: req.body })
  } else {
    const { errors, value } = validateCoverUrl(req.body?.url)
    if (errors.length) return res.status(400).json({ error: errors.join('; ') })
    row = await projects.setCoverUrl(pool, req.projectId, value)
  }
  if (!row) return res.status(404).json({ error: 'Project not found' })
  res.json(row)
}))

router.delete('/:id/cover', handle(async (req, res) => {
  const row = await projects.clearCover(pool, req.projectId)
  if (!row) return res.status(404).json({ error: 'Project not found' })
  res.json(row)
}))

router.get('/:id/cover', handle(async (req, res) => {
  const file = await projects.getCoverImage(pool, req.projectId)
  if (!file) return res.status(404).json({ error: 'No cover image' })
  res.set({
    'Content-Type': file.mime,
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': 'sandbox',
    // The client adds ?v=<cover_version>, so a new cover is a new URL.
    'Cache-Control': 'private, max-age=31536000, immutable',
  })
  res.send(file.data)
}))

router.delete('/:id', handle(async (req, res) => {
  const removed = await projects.remove(pool, req.projectId)
  if (!removed) return res.status(404).json({ error: 'Project not found' })
  res.status(204).end()
}))

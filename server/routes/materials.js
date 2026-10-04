import { Router } from 'express'
import { pool } from '../db/pool.js'
import * as materials from '../repos/materialsRepo.js'
import { parseId, validateMaterial } from '../validate.js'

export const router = Router()

const handle = (fn) => (req, res, next) => fn(req, res, next).catch(next)

router.param('id', (req, res, next, raw) => {
  const id = parseId(raw)
  if (!id) return res.status(404).json({ error: 'Material not found' })
  req.materialId = id
  next()
})

router.get('/', handle(async (req, res) => {
  const type = ['yarn', 'hook', 'other'].includes(req.query.type) ? req.query.type : null
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 80) : ''
  const low = req.query.low === 'true'
  res.json(await materials.getAll(pool, { type, search, low }))
}))

router.get('/:id', handle(async (req, res) => {
  const row = await materials.getById(pool, req.materialId)
  if (!row) return res.status(404).json({ error: 'Material not found' })
  res.json(row)
}))

router.post('/', handle(async (req, res) => {
  const { errors, value } = validateMaterial(req.body ?? {})
  if (errors.length) return res.status(400).json({ error: errors.join('; ') })
  res.status(201).json(await materials.create(pool, value))
}))

router.put('/:id', handle(async (req, res) => {
  const { errors, value } = validateMaterial(req.body ?? {})
  if (errors.length) return res.status(400).json({ error: errors.join('; ') })
  const row = await materials.update(pool, req.materialId, value)
  if (!row) return res.status(404).json({ error: 'Material not found' })
  res.json(row)
}))

router.delete('/:id', handle(async (req, res) => {
  const removed = await materials.remove(pool, req.materialId)
  if (!removed) return res.status(404).json({ error: 'Material not found' })
  res.status(204).end()
}))

import { Router } from 'express'
import { pool } from '../db/pool.js'
import * as charts from '../repos/chartsRepo.js'
import { parseId, validateChart } from '../validate.js'

export const router = Router()
const handle = (fn) => (req, res, next) => fn(req, res, next).catch(next)

router.param('id', (req, res, next, raw) => {
  const id = parseId(raw)
  if (!id) return res.status(404).json({ error: 'Chart not found' })
  req.chartId = id
  next()
})

router.get('/', handle(async (req, res) => res.json(await charts.getAll(pool))))

router.post('/', handle(async (req, res) => {
  const { errors, value } = validateChart(req.body ?? {})
  if (errors.length) return res.status(400).json({ error: errors.join('; ') })
  res.status(201).json(await charts.create(pool, value))
}))

router.put('/:id', handle(async (req, res) => {
  const { errors, value } = validateChart(req.body ?? {})
  if (errors.length) return res.status(400).json({ error: errors.join('; ') })
  const row = await charts.update(pool, req.chartId, value)
  if (!row) return res.status(404).json({ error: 'Chart not found' })
  res.json(row)
}))

router.delete('/:id', handle(async (req, res) => {
  if (!(await charts.remove(pool, req.chartId))) return res.status(404).json({ error: 'Chart not found' })
  res.status(204).end()
}))

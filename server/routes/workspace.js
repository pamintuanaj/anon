import express, { Router } from 'express'
import { pool } from '../db/pool.js'
import * as counters from '../repos/countersRepo.js'
import * as reminders from '../repos/remindersRepo.js'
import * as patterns from '../repos/patternsRepo.js'
import {
  parseId, validateCounter, validateCounterValue, validateReminder,
  validateMarks, detectPatternType,
} from '../validate.js'

// Everything that belongs to one project's workspace: extra counters,
// reminders and imported patterns.
export const router = Router()

const handle = (fn) => (req, res, next) => fn(req, res, next).catch(next)
const MAX_FILE = 8 * 1024 * 1024
const small = express.json({ limit: '50kb' })
const marksBody = express.json({ limit: '1mb' })   // drawings can hold many points

// A shared id check for every :projectId / :id in this router.
function idParam(label) {
  return (req, res, next, raw) => {
    const id = parseId(raw)
    if (!id) return res.status(404).json({ error: `${label} not found` })
    req.params[`${label.toLowerCase()}Id`] = id
    next()
  }
}
router.param('projectId', idParam('Project'))
router.param('counterId', idParam('Counter'))
router.param('reminderId', idParam('Reminder'))
router.param('patternId', idParam('Pattern'))

// ---- Counters ---------------------------------------------------------------
router.get('/projects/:projectId/counters', handle(async (req, res) => {
  res.json(await counters.listForProject(pool, req.params.projectId))
}))

router.post('/projects/:projectId/counters', small, handle(async (req, res) => {
  const { errors, value } = validateCounter(req.body ?? {})
  if (errors.length) return res.status(400).json({ error: errors.join('; ') })
  const row = await counters.create(pool, req.params.projectId, value)
  if (!row) return res.status(404).json({ error: 'Project not found' })
  res.status(201).json(row)
}))

router.put('/counters/:counterId', small, handle(async (req, res) => {
  const { errors, value } = validateCounter(req.body ?? {})
  if (errors.length) return res.status(400).json({ error: errors.join('; ') })
  const row = await counters.update(pool, req.params.counterId, value)
  if (!row) return res.status(404).json({ error: 'Counter not found' })
  res.json(row)
}))

// PATCH: tapping + or - only changes the number.
router.patch('/counters/:counterId', small, handle(async (req, res) => {
  const { errors, value } = validateCounterValue(req.body)
  if (errors.length) return res.status(400).json({ error: errors.join('; ') })
  const row = await counters.setValue(pool, req.params.counterId, value)
  if (!row) return res.status(404).json({ error: 'Counter not found' })
  res.json(row)
}))

router.delete('/counters/:counterId', handle(async (req, res) => {
  if (!(await counters.remove(pool, req.params.counterId))) return res.status(404).json({ error: 'Counter not found' })
  res.status(204).end()
}))

// ---- Reminders --------------------------------------------------------------
router.get('/projects/:projectId/reminders', handle(async (req, res) => {
  res.json(await reminders.listForProject(pool, req.params.projectId))
}))

router.post('/projects/:projectId/reminders', small, handle(async (req, res) => {
  const { errors, value } = validateReminder(req.body ?? {})
  if (errors.length) return res.status(400).json({ error: errors.join('; ') })
  const row = await reminders.create(pool, req.params.projectId, value)
  if (!row) return res.status(404).json({ error: 'Project not found' })
  res.status(201).json(row)
}))

router.delete('/reminders/:reminderId', handle(async (req, res) => {
  if (!(await reminders.remove(pool, req.params.reminderId))) return res.status(404).json({ error: 'Reminder not found' })
  res.status(204).end()
}))

// ---- Patterns ---------------------------------------------------------------
router.get('/projects/:projectId/patterns', handle(async (req, res) => {
  res.json(await patterns.listForProject(pool, req.params.projectId))
}))

// The file arrives as the raw request body (not a form), with its name in a
// header. express.raw only accepts these content types and at most 8 MB.
router.post(
  '/projects/:projectId/patterns',
  express.raw({ type: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain'], limit: MAX_FILE }),
  handle(async (req, res) => {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: 'Send a PDF, PNG, JPEG, WebP or plain text file' })
    }
    const mime = detectPatternType(req.body, req.headers['content-type'])
    if (!mime) return res.status(415).json({ error: 'That file is not a PDF, image or plain text' })
    let name = ''
    try { name = decodeURIComponent(String(req.headers['x-file-name'] ?? '')).trim() } catch { name = '' }
    name = (name || 'Pattern').slice(0, 120)
    const row = await patterns.create(pool, req.params.projectId, { name, mime, data: req.body })
    if (!row) return res.status(404).json({ error: 'Project not found' })
    res.status(201).json(row)
  })
)

router.get('/patterns/:patternId/file', handle(async (req, res) => {
  const file = await patterns.getFile(pool, req.params.patternId)
  if (!file) return res.status(404).json({ error: 'Pattern not found' })
  // The stored type came from the file's own bytes. nosniff stops the browser
  // guessing a different one, and the sandbox CSP means that even opened on
  // its own, the file cannot run scripts on this site.
  res.set({
    'Content-Type': file.mime,
    'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': 'sandbox',
    'Cache-Control': 'private, max-age=3600',
  })
  res.send(file.data)
}))

router.put('/patterns/:patternId/marks', marksBody, handle(async (req, res) => {
  const { errors, value } = validateMarks(req.body)
  if (errors.length) return res.status(400).json({ error: errors.join('; ') })
  const row = await patterns.saveMarks(pool, req.params.patternId, value)
  if (!row) return res.status(404).json({ error: 'Pattern not found' })
  res.json(row)
}))

router.delete('/patterns/:patternId', handle(async (req, res) => {
  if (!(await patterns.remove(pool, req.params.patternId))) return res.status(404).json({ error: 'Pattern not found' })
  res.status(204).end()
}))

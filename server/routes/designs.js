import { Router } from 'express'
import { pool } from '../db/pool.js'
import * as designs from '../repos/designsRepo.js'
import { parseId, validateDesign } from '../validate.js'
import { AiError, aiConfigured, allowAiCall, generatePattern } from '../ai/generatePattern.js'

// Saved patterns (the Pattern Builder) and the AI generator.
export const router = Router()

const handle = (fn) => (req, res, next) => fn(req, res, next).catch(next)

// /generate is registered before /:id so "generate" is never read as an id.
// It does NOT save anything: the visitor reviews and edits the pattern in the
// builder first, then saves it with POST /.
router.post('/generate', handle(async (req, res) => {
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim().slice(0, 300) : ''
  if (prompt.length < 3) return res.status(400).json({ error: 'Describe what you want to make, like "amigurumi frog, beginner".' })
  if (!aiConfigured()) {
    return res.status(503).json({ error: 'The AI is not set up on this server yet.', code: 'ai_not_configured' })
  }
  if (!allowAiCall(req.ip)) {
    return res.status(429).json({ error: 'That is the hourly limit for AI patterns. Try again later, or build one by hand.', code: 'ai_limit' })
  }
  try {
    const raw = await generatePattern(prompt)
    const { errors, value } = validateDesign({ ...raw, source: 'ai' })
    if (errors.length) throw new AiError('The AI pattern was incomplete. Try again.')
    res.json(designs.shape({ ...value, id: null }))
  } catch (error) {
    if (error instanceof AiError) return res.status(error.status).json({ error: error.message, code: error.code })
    throw error
  }
}))

router.get('/', handle(async (req, res) => res.json(await designs.list(pool))))

router.param('id', (req, res, next, raw) => {
  const id = parseId(raw)
  if (!id) return res.status(404).json({ error: 'Pattern not found' })
  req.designId = id
  next()
})

router.get('/:id', handle(async (req, res) => {
  const row = await designs.getById(pool, req.designId)
  if (!row) return res.status(404).json({ error: 'Pattern not found' })
  res.json(row)
}))

router.post('/', handle(async (req, res) => {
  const { errors, value } = validateDesign(req.body ?? {})
  if (errors.length) return res.status(400).json({ error: errors.join('; ') })
  res.status(201).json(await designs.create(pool, value))
}))

router.put('/:id', handle(async (req, res) => {
  const { errors, value } = validateDesign(req.body ?? {})
  if (errors.length) return res.status(400).json({ error: errors.join('; ') })
  const row = await designs.update(pool, req.designId, value)
  if (!row) return res.status(404).json({ error: 'Pattern not found' })
  res.json(row)
}))

router.delete('/:id', handle(async (req, res) => {
  if (!(await designs.remove(pool, req.designId))) return res.status(404).json({ error: 'Pattern not found' })
  res.status(204).end()
}))

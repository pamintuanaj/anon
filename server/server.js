import express from 'express'
import cors from 'cors'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { pool } from './db/pool.js'
import { basicAuth } from './middleware/basicAuth.js'
import { router as projectsRouter } from './routes/projects.js'
import { router as materialsRouter } from './routes/materials.js'
import { router as postsRouter } from './routes/posts.js'
import { router as commentsRouter } from './routes/comments.js'
import { router as workspaceRouter } from './routes/workspace.js'
import { router as chartsRouter } from './routes/charts.js'

const app = express()
const isProduction = process.env.NODE_ENV === 'production'

// Behind Render/Railway there is a proxy in front of us. This makes req.ip and
// req.protocol report the visitor, not the proxy.
app.set('trust proxy', 1)
app.disable('x-powered-by')

// Health checks come BEFORE the password gate, so the host can check the app is
// alive without knowing the password. Neither route reads or changes data.
app.get('/healthz', (req, res) => res.json({ ok: true }))
app.get('/readyz', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true, db: 'up' })
  } catch (error) {
    console.error('readyz failed:', error.message)
    res.status(503).json({ ok: false, db: 'down' })
  }
})

// The password gate. Registered before every other route and before the static
// client, so nothing below this line can be reached without it.
const APP_USER = process.env.APP_USER
const APP_PASSWORD = process.env.APP_PASSWORD
if (APP_USER && APP_PASSWORD) {
  app.use(basicAuth({ user: APP_USER, password: APP_PASSWORD }))
} else if (isProduction) {
  console.error('APP_USER and APP_PASSWORD must be set in production. Refusing to start without the gate.')
  process.exit(1)
} else {
  console.warn('APP_USER / APP_PASSWORD not set: password gate is OFF (development only).')
}

// CORS only matters if the client is served from a different origin (for
// example Vite on :5173 in development). Named origins, never a wildcard.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
app.use(cors({ origin: allowedOrigins, credentials: true }))

// The workspace router brings its own body parsers: raw bytes for pattern
// uploads (up to 8 MB) and a 1 MB JSON limit for drawings. It is mounted
// BEFORE the global 50 kb JSON parser, so those bigger bodies are not
// rejected first. It is still after the password gate.
app.use('/api', workspaceRouter)

app.use(express.json({ limit: '50kb' }))

app.use('/api/projects', projectsRouter)
app.use('/api/materials', materialsRouter)
app.use('/api/posts', postsRouter)
app.use('/api/comments', commentsRouter)
app.use('/api/charts', chartsRouter)
app.use('/api', (req, res) => res.status(404).json({ error: 'No such route' }))

// In production the built React app is served from here, on the same origin as
// the API. That way the browser asks for the password once and then sends it
// with every API call automatically.
const here = path.dirname(fileURLToPath(import.meta.url))
const clientDist = path.join(here, '..', 'client', 'dist')
if (existsSync(clientDist)) {
  app.use(express.static(clientDist))
  // Any other GET is a client-side route like /gallery: send the React app.
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')))
}

app.use((req, res) => res.status(404).json({ error: 'No such route' }))

// Bad JSON bodies are the visitor's fault (400), not ours (500).
// Everything else: log the detail, send a plain message. No stack traces.
app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON' })
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large' })
  }
  console.error(error)
  res.status(500).json({ error: 'Something went wrong on the server' })
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`CrocheTa API listening on http://localhost:${port}`)
})

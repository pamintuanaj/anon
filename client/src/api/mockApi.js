// The simulated backend for demo mode. Data lives in this browser's
// localStorage and nowhere else. It copies the server's rules (row clamping,
// auto-done, snapshot posts) so the app behaves the same either way.

import { seedProjects, seedMaterials, seedPosts, seedComments, seedCounters, seedReminders, seedCharts } from './seed.js'

const KEYS = {
  projects: 'crocheta:v3:projects', materials: 'crocheta:v3:materials', posts: 'crocheta:v3:posts',
  comments: 'crocheta:v3:comments', counters: 'crocheta:v3:counters', reminders: 'crocheta:v3:reminders',
  patterns: 'crocheta:v3:patterns', charts: 'crocheta:v3:charts',
}
const SEEDS = {
  projects: seedProjects, materials: seedMaterials, posts: seedPosts, comments: seedComments,
  counters: seedCounters, reminders: seedReminders, patterns: [], charts: seedCharts,
}

// A real network is not instant; the delay keeps loading states honest.
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

function read(table) {
  const stored = localStorage.getItem(KEYS[table])
  if (stored) {
    try { return JSON.parse(stored) } catch { localStorage.removeItem(KEYS[table]) }
  }
  localStorage.setItem(KEYS[table], JSON.stringify(SEEDS[table]))
  return structuredClone(SEEDS[table])
}

function write(table, rows) {
  try {
    localStorage.setItem(KEYS[table], JSON.stringify(rows))
  } catch {
    // localStorage holds about 5 MB per site, and pattern files are stored in it.
    throw new Error('Demo mode storage is full. Delete a pattern, or use the full app with a database.')
  }
}
const nextId = (rows) => rows.reduce((max, row) => Math.max(max, row.id), 0) + 1
const now = () => new Date().toISOString()

function find(table, id) {
  const row = read(table).find((r) => String(r.id) === String(id))
  if (!row) throw new Error('Not found')
  return row
}

function patch(table, id, change) {
  const rows = read(table)
  const index = rows.findIndex((r) => String(r.id) === String(id))
  if (index === -1) throw new Error('Not found')
  rows[index] = { ...rows[index], ...change(rows[index]) }
  write(table, rows)
  return rows[index]
}

function remove(table, id) {
  write(table, read(table).filter((r) => String(r.id) !== String(id)))
  return null
}

function requireText(value, name) {
  if (!String(value ?? '').trim()) throw new Error(`${name} is required`)
}

// Projects
export async function listProjects(status) {
  await delay()
  return read('projects')
    .filter((p) => !status || p.status === status)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}

export async function getProject(id) { await delay(); return find('projects', id) }

export async function createProject(input) {
  await delay()
  requireText(input.title, 'title')
  const rows = read('projects')
  const created = {
    id: nextId(rows), title: input.title.trim(), pattern_ref: input.pattern_ref?.trim() ?? '',
    color_hex: input.color_hex || '#F8C7D2', total_rows: Number(input.total_rows), current_row: 0,
    status: input.status || 'ongoing', notes: '', elapsed_seconds: 0, current_stitch: 0, created_at: now(), updated_at: now(),
  }
  write('projects', [...rows, created])
  return created
}

export async function updateProject(id, input) {
  await delay()
  requireText(input.title, 'title')
  return patch('projects', id, (p) => ({
    ...input, total_rows: Number(input.total_rows),
    current_row: Math.min(p.current_row, Number(input.total_rows)), updated_at: now(),
  }))
}

export async function saveProgress(id, { current_row, notes, elapsed_seconds, current_stitch = 0 }) {
  await delay(50)
  return patch('projects', id, (p) => {
    const row = Math.min(current_row, p.total_rows)
    return {
      current_row: row, notes, elapsed_seconds, current_stitch,
      status: row === p.total_rows && p.status === 'ongoing' ? 'done'
        : row < p.total_rows && p.status === 'done' ? 'ongoing'
        : p.status,
      updated_at: now(),
    }
  })
}

export async function deleteProject(id) {
  await delay()
  // Same as ON DELETE CASCADE for the project's workspace.
  for (const table of ['counters', 'reminders', 'patterns']) {
    write(table, read(table).filter((row) => String(row.project_id) !== String(id)))
  }
  // Same as ON DELETE SET NULL: posts survive, they just lose the link.
  write('posts', read('posts').map((post) =>
    String(post.project_id) === String(id) ? { ...post, project_id: null } : post))
  return remove('projects', id)
}

// Stash materials
// Same rule as the server: some left, but at or below the item's threshold.
const withLow = (m) => ({ ...m, low_stock: m.qty > 0 && m.qty <= m.low_at })
const defaultLowAt = (type) => (type === 'yarn' ? 1 : 0)

export async function listMaterials({ type, search, low } = {}) {
  await delay()
  const term = (search ?? '').trim().toLowerCase()
  return read('materials')
    .map(withLow)
    .filter((m) => !type || m.type === type)
    .filter((m) => !low || m.qty <= m.low_at)
    .filter((m) => !term || m.name.toLowerCase().includes(term) || m.color_number.toLowerCase().includes(term))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function createMaterial(input) {
  await delay()
  requireText(input.name, 'name')
  const rows = read('materials')
  const created = {
    color_hex: null, color_number: '', batch_number: '', fiber_weight: '', ...input,
    id: nextId(rows), qty: Number(input.qty ?? 1), low_at: Number(input.low_at ?? defaultLowAt(input.type)),
  }
  delete created.low_stock
  write('materials', [...rows, created])
  return withLow(created)
}

export async function updateMaterial(id, input) {
  await delay()
  requireText(input.name, 'name')
  const { low_stock, ...rest } = input
  return withLow(patch('materials', id, (m) => ({ ...rest, qty: Number(input.qty), low_at: Number(input.low_at ?? m.low_at) })))
}

export async function deleteMaterial(id) { await delay(); return remove('materials', id) }

// Community posts
function withCount(post) {
  return { ...post, comment_count: read('comments').filter((c) => c.post_id === post.id).length }
}

export async function listPosts({ search, saved } = {}) {
  await delay()
  const term = (search ?? '').trim().toLowerCase()
  return read('posts')
    .map(withCount)
    .filter((p) => !saved || p.saved)
    .filter((p) => !term || [p.body, p.author, p.project_title ?? ''].some((t) => t.toLowerCase().includes(term)))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function createPost({ author, body, project_id }) {
  await delay()
  requireText(author, 'author')
  requireText(body, 'body')
  const rows = read('posts')
  let snapshot = { project_id: null, project_title: null, row_snapshot: null, total_rows_snapshot: null }
  if (project_id) {
    const project = find('projects', project_id)
    snapshot = { project_id: project.id, project_title: project.title, row_snapshot: project.current_row, total_rows_snapshot: project.total_rows }
  }
  const created = { id: nextId(rows), author: author.trim(), body: body.trim(), ...snapshot, likes: 0, saved: false, created_at: now() }
  write('posts', [...rows, created])
  return withCount(created)
}

export async function likePost(id) {
  await delay(80)
  return withCount(patch('posts', id, (p) => ({ likes: p.likes + 1 })))
}

export async function setPostSaved(id, saved) {
  await delay(80)
  return withCount(patch('posts', id, () => ({ saved: Boolean(saved) })))
}

export async function deletePost(id) {
  await delay()
  // Same as ON DELETE CASCADE: the post's comments go with it.
  write('comments', read('comments').filter((c) => String(c.post_id) !== String(id)))
  return remove('posts', id)
}

// Comments
export async function listComments(postId) {
  await delay()
  return read('comments')
    .filter((c) => String(c.post_id) === String(postId))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export async function createComment(postId, { author, body }) {
  await delay()
  requireText(author, 'author')
  requireText(body, 'body')
  find('posts', postId)   // throws "Not found" like the server's 404
  const rows = read('comments')
  const created = { id: nextId(rows), post_id: Number(postId), author: author.trim(), body: body.trim(), created_at: now() }
  write('comments', [...rows, created])
  return created
}

export async function deleteComment(id) { await delay(); return remove('comments', id) }

// ---- Pattern workspace ------------------------------------------------------
const byProject = (table, projectId) => read(table).filter((r) => String(r.project_id) === String(projectId))

export async function listCounters(projectId) { await delay(); return byProject('counters', projectId) }

export async function createCounter(projectId, input) {
  await delay()
  requireText(input.name, 'name')
  find('projects', projectId)
  const rows = read('counters')
  const created = {
    id: nextId(rows), project_id: Number(projectId), name: input.name.trim(), value: Number(input.value ?? 0),
    repeat_every: input.repeat_every ? Number(input.repeat_every) : null, linked: input.linked === true,
    color: input.color || '#8ED0D6',
  }
  write('counters', [...rows, created])
  return created
}

export async function updateCounter(id, input) {
  await delay()
  requireText(input.name, 'name')
  return patch('counters', id, () => ({
    name: input.name.trim(), value: Number(input.value), linked: input.linked === true, color: input.color,
    repeat_every: input.repeat_every ? Number(input.repeat_every) : null,
  }))
}

export async function setCounterValue(id, value) { await delay(40); return patch('counters', id, () => ({ value: Number(value) })) }
export async function deleteCounter(id) { await delay(); return remove('counters', id) }

export async function listReminders(projectId) {
  await delay()
  return byProject('reminders', projectId).sort((a, b) => a.at_row - b.at_row)
}

export async function createReminder(projectId, input) {
  await delay()
  requireText(input.text, 'text')
  find('projects', projectId)
  const rows = read('reminders')
  const created = {
    id: nextId(rows), project_id: Number(projectId), at_row: Number(input.at_row),
    repeat_every: input.repeat_every ? Number(input.repeat_every) : null, text: input.text.trim(),
  }
  write('reminders', [...rows, created])
  return created
}

export async function deleteReminder(id) { await delay(); return remove('reminders', id) }

const DEMO_FILE_LIMIT = 3 * 1024 * 1024

export async function listPatterns(projectId) {
  await delay()
  // Leave the file data out of the list, like the server does.
  return byProject('patterns', projectId).map(({ dataUrl, ...meta }) => meta)
}

export async function uploadPattern(projectId, file, name) {
  find('projects', projectId)
  if (file.size > DEMO_FILE_LIMIT) throw new Error('In demo mode, pattern files can be up to 3 MB.')
  const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain']
  const mime = allowed.find((t) => (file.type || '').startsWith(t))
  if (!mime) throw new Error('That file is not a PDF, image or plain text')
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read the file'))
    reader.readAsDataURL(file)
  })
  const rows = read('patterns')
  const created = {
    id: nextId(rows), project_id: Number(projectId), name: (name ?? file.name).slice(0, 120), mime,
    size_bytes: file.size, marks: {}, created_at: now(), dataUrl,
  }
  write('patterns', [...rows, created])
  const { dataUrl: _omit, ...meta } = created
  return meta
}

export const patternFileUrl = (pattern) => read('patterns').find((p) => p.id === pattern.id)?.dataUrl ?? ''

export async function savePatternMarks(id, marks) {
  await delay(60)
  const { dataUrl, ...meta } = patch('patterns', id, () => ({ marks }))
  return meta
}

export async function deletePattern(id) { await delay(); return remove('patterns', id) }

export async function listCharts() { await delay(); return read('charts').sort((a, b) => b.updated_at.localeCompare(a.updated_at)) }

export async function createChart(input) {
  await delay()
  requireText(input.name, 'name')
  const rows = read('charts')
  const created = { ...input, id: nextId(rows), updated_at: now() }
  write('charts', [...rows, created])
  return created
}

export async function updateChart(id, input) { await delay(); return patch('charts', id, () => ({ ...input, updated_at: now() })) }
export async function deleteChart(id) { await delay(); return remove('charts', id) }

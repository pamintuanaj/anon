// Server-side validation. The browser form gives a fast friendly message; this
// is what actually protects the database, because the client can be bypassed
// with a single curl command.

const HEX = /^#[0-9A-Fa-f]{6}$/

const text = (value) => (typeof value === 'string' ? value.trim() : '')

function wholeNumber(value) {
  const n = Number(value)
  return Number.isInteger(n) ? n : NaN
}

// Postgres INTEGER stops at 2147483647. Anything bigger is rejected here,
// otherwise Postgres throws "out of range" and the visitor gets a 500.
const MAX_INT = 2147483647

export function parseId(raw) {
  const id = wholeNumber(raw)
  return id > 0 && id <= MAX_INT ? id : null
}

export function validateProject(body) {
  const errors = []
  const value = {
    title: text(body.title),
    pattern_ref: text(body.pattern_ref),
    color_hex: text(body.color_hex) || '#F8C7D2',
    total_rows: wholeNumber(body.total_rows),
    status: text(body.status) || 'ongoing',
  }
  if (!value.title) errors.push('title is required')
  if (value.title.length > 80) errors.push('title must be 80 characters or fewer')
  if (value.pattern_ref.length > 200) errors.push('pattern_ref must be 200 characters or fewer')
  if (!HEX.test(value.color_hex)) errors.push('color_hex must look like #A1B2C3')
  if (!(value.total_rows >= 1 && value.total_rows <= 1000)) {
    errors.push('total_rows must be a whole number from 1 to 1000')
  }
  if (!['ongoing', 'done', 'archived'].includes(value.status)) {
    errors.push('status must be ongoing, done or archived')
  }
  return { errors, value }
}

export function validateProgress(body) {
  const errors = []
  const value = {
    current_row: wholeNumber(body.current_row),
    notes: typeof body.notes === 'string' ? body.notes : '',
    elapsed_seconds: wholeNumber(body.elapsed_seconds),
    current_stitch: wholeNumber(body.current_stitch ?? 0),
  }
  if (!(value.current_row >= 0 && value.current_row <= 1000)) {
    errors.push('current_row must be a whole number from 0 to 1000')
  }
  if (value.notes.length > 2000) errors.push('notes must be 2000 characters or fewer')
  if (!(value.elapsed_seconds >= 0 && value.elapsed_seconds <= MAX_INT)) {
    errors.push('elapsed_seconds must be a whole number, 0 or more')
  }
  if (!(value.current_stitch >= 0 && value.current_stitch <= 9999)) {
    errors.push('current_stitch must be a whole number from 0 to 9999')
  }
  return { errors, value }
}

export function validateMaterial(body) {
  const errors = []
  const value = {
    type: text(body.type),
    name: text(body.name),
    color_hex: text(body.color_hex) || null,
    color_number: text(body.color_number),
    batch_number: text(body.batch_number),
    fiber_weight: text(body.fiber_weight),
    qty: wholeNumber(body.qty ?? 1),
    // Default warning level: 1 skein for yarn; hooks and notions do not warn.
    low_at: wholeNumber(body.low_at ?? (text(body.type) === 'yarn' ? 1 : 0)),
  }
  if (!['yarn', 'hook', 'other'].includes(value.type)) errors.push('type must be yarn, hook or other')
  if (!value.name) errors.push('name is required')
  if (value.name.length > 80) errors.push('name must be 80 characters or fewer')
  if (value.color_hex && !HEX.test(value.color_hex)) errors.push('color_hex must look like #A1B2C3')
  for (const field of ['color_number', 'batch_number', 'fiber_weight']) {
    if (value[field].length > 40) errors.push(`${field} must be 40 characters or fewer`)
  }
  if (!(value.qty >= 0 && value.qty <= 999)) errors.push('qty must be a whole number from 0 to 999')
  if (!(value.low_at >= 0 && value.low_at <= 999)) errors.push('low_at must be a whole number from 0 to 999')
  return { errors, value }
}

// ---- Community media ---------------------------------------------------------
// Stickers are drawn by the client from this fixed list. Storing only the id
// means a post can never carry arbitrary markup.
export const STICKER_IDS = ['yarn', 'hook', 'frog', 'icecream', 'strawberry', 'heart', 'sparkle', 'rainbow']
const MAX_POST_IMAGE = 450 * 1024

// Pictures arrive inside the JSON as a data: URL. Rebuild them into bytes and
// decide the type from the bytes themselves, never from the label.
export function parseImageDataUrl(input) {
  if (input == null || input === '') return { errors: [], value: null }
  if (typeof input !== 'string') return { errors: ['image must be a picture'], value: null }
  const match = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(input)
  if (!match) return { errors: ['image must be a PNG, JPEG or WebP picture'], value: null }
  const data = Buffer.from(match[1], 'base64')
  if (!data.length || data.length > MAX_POST_IMAGE) {
    return { errors: [`image must be under ${MAX_POST_IMAGE / 1024} KB`], value: null }
  }
  const mime = detectImageType(data)
  return mime ? { errors: [], value: { mime, data } } : { errors: ['image must be a PNG, JPEG or WebP picture'], value: null }
}

function mediaFields(body, errors) {
  const sticker = body.sticker == null || body.sticker === '' ? null : String(body.sticker)
  if (sticker && !STICKER_IDS.includes(sticker)) errors.push('sticker must be one of the crochet stickers')
  const image = parseImageDataUrl(body.image)
  errors.push(...image.errors)
  return { sticker: STICKER_IDS.includes(sticker) ? sticker : null, image: image.value }
}

export function validatePost(body) {
  const errors = []
  const media = mediaFields(body, errors)
  const value = {
    author: text(body.author),
    body: text(body.body),
    project_id: body.project_id == null || body.project_id === '' ? null : parseId(body.project_id),
    ...media,
  }
  if (!value.author) errors.push('author is required')
  if (value.author.length > 40) errors.push('author must be 40 characters or fewer')
  if (!value.body && !value.sticker && !value.image) errors.push('body is required')
  if (value.body.length > 500) errors.push('body must be 500 characters or fewer')
  if (body.project_id != null && body.project_id !== '' && value.project_id === null) {
    errors.push('project_id must be a positive whole number')
  }
  return { errors, value }
}

export function validateComment(body) {
  const errors = []
  const media = mediaFields(body, errors)
  const value = { author: text(body.author), body: text(body.body), ...media }
  if (!value.author) errors.push('author is required')
  if (value.author.length > 40) errors.push('author must be 40 characters or fewer')
  if (!value.body && !value.sticker && !value.image) errors.push('body is required')
  if (value.body.length > 300) errors.push('body must be 300 characters or fewer')
  return { errors, value }
}

// ---- Pattern workspace -----------------------------------------------------

const optionalWhole = (value, min, max) => {
  if (value == null || value === '') return { ok: true, value: null }
  const n = wholeNumber(value)
  return { ok: n >= min && n <= max, value: n }
}

export function validateCounter(body) {
  const errors = []
  const repeat = optionalWhole(body.repeat_every, 1, 999)
  const value = {
    name: text(body.name),
    value: wholeNumber(body.value ?? 0),
    repeat_every: repeat.value,
    linked: body.linked === true,
    color: text(body.color) || '#8ED0D6',
  }
  if (!value.name) errors.push('name is required')
  if (value.name.length > 40) errors.push('name must be 40 characters or fewer')
  if (!(value.value >= 0 && value.value <= 99999)) errors.push('value must be a whole number from 0 to 99999')
  if (!repeat.ok) errors.push('repeat_every must be empty or a whole number from 1 to 999')
  if (!HEX.test(value.color)) errors.push('color must look like #A1B2C3')
  return { errors, value }
}

export function validateCounterValue(body) {
  const n = wholeNumber(body?.value)
  return n >= 0 && n <= 99999 ? { errors: [], value: n } : { errors: ['value must be a whole number from 0 to 99999'], value: null }
}

export function validateReminder(body) {
  const errors = []
  const repeat = optionalWhole(body.repeat_every, 1, 1000)
  const value = { at_row: wholeNumber(body.at_row), repeat_every: repeat.value, text: text(body.text) }
  if (!(value.at_row >= 1 && value.at_row <= 1000)) errors.push('at_row must be a whole number from 1 to 1000')
  if (!repeat.ok) errors.push('repeat_every must be empty or a whole number from 1 to 1000')
  if (!value.text) errors.push('text is required')
  if (value.text.length > 200) errors.push('text must be 200 characters or fewer')
  return { errors, value }
}

// The browser says what type a file is, but the browser can be lied to. The
// first bytes of a file ("magic numbers") say what it really is, so the type
// is decided from those. Anything else is refused: no HTML, no SVG, no scripts.
export function detectPatternType(buffer, declared) {
  const starts = (...bytes) => bytes.every((b, i) => buffer[i] === b)
  if (starts(0x25, 0x50, 0x44, 0x46)) return 'application/pdf'                  // %PDF
  if (starts(0x89, 0x50, 0x4e, 0x47)) return 'image/png'
  if (starts(0xff, 0xd8, 0xff)) return 'image/jpeg'
  if (starts(0x52, 0x49, 0x46, 0x46) && buffer.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  if (declared?.startsWith('text/plain')) {
    const asText = buffer.toString('utf8')
    // Valid UTF-8 round-trips unchanged; binary files do not, and contain NULs.
    if (!asText.includes('\u0000') && Buffer.from(asText, 'utf8').equals(buffer)) return 'text/plain'
  }
  return null
}

// Cover photos: images only (the same magic-number check as patterns, minus PDF/text).
export function detectImageType(buffer) {
  const type = detectPatternType(buffer, null)
  return type && type.startsWith('image/') ? type : null
}

// A cover link must be https and plain-looking. It is only ever used as an <img src>.
export function validateCoverUrl(input) {
  const raw = typeof input === 'string' ? input.trim() : ''
  if (!raw) return { errors: ['url is required'], value: null }
  if (raw.length > 500) return { errors: ['url must be 500 characters or fewer'], value: null }
  let url
  try { url = new URL(raw) } catch { return { errors: ['url is not a valid link'], value: null } }
  if (url.protocol !== 'https:') return { errors: ['url must start with https://'], value: null }
  if (url.username || url.password) return { errors: ['url must not contain a login'], value: null }
  return { errors: [], value: url.toString() }
}

const clamp01 = (n) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : null)
const MARK_COLORS = /^#[0-9A-Fa-f]{6}$/
const STICKERS = ['star', 'warning', 'heart', 'check', 'note']

// Marks come from the browser as JSON. Instead of storing whatever arrives,
// this rebuilds a clean object from only the known fields, with numbers
// clamped and lists capped, so the column cannot fill up with junk.
export function validateMarks(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { errors: ['marks must be an object'], value: null }
  }
  const list = (value, max) => (Array.isArray(value) ? value.slice(0, max) : [])
  const page = (p) => { const n = wholeNumber(p); return n >= 0 && n <= 500 ? n : 0 }
  const color = (c, fallback) => (typeof c === 'string' && MARK_COLORS.test(c) ? c : fallback)
  const rect = (r) => {
    const x = clamp01(Number(r.x)), y = clamp01(Number(r.y)), w = clamp01(Number(r.w)), h = clamp01(Number(r.h))
    return [x, y, w, h].some((v) => v === null) ? null : { x, y, w, h }
  }

  const value = {
    highlights: list(input.highlights, 300).map((m) => {
      const r = rect(m); return r && { page: page(m.page), ...r, color: color(m.color, '#FBE38E') }
    }).filter(Boolean),
    strokes: list(input.strokes, 300).map((m) => {
      const points = list(m.points, 2000)
        .map((pt) => [clamp01(Number(pt?.[0])), clamp01(Number(pt?.[1]))])
        .filter(([x, y]) => x !== null && y !== null)
      const width = Math.min(12, Math.max(1, Number(m.width) || 3))
      return points.length > 1 ? { page: page(m.page), color: color(m.color, '#E88FA4'), width, points } : null
    }).filter(Boolean),
    stickers: list(input.stickers, 200).map((m) => {
      const x = clamp01(Number(m.x)), y = clamp01(Number(m.y))
      if (x === null || y === null) return null
      return {
        page: page(m.page), x, y,
        icon: STICKERS.includes(m.icon) ? m.icon : 'star',
        note: typeof m.note === 'string' ? m.note.slice(0, 120) : '',
      }
    }).filter(Boolean),
    bookmarks: list(input.bookmarks, 20).map((m) => {
      const r = rect(m)
      return r && { page: page(m.page), ...r, label: typeof m.label === 'string' ? m.label.slice(0, 40) : 'Bookmark' }
    }).filter(Boolean),
    bar: null,
    chart: null,
  }
  if (input.bar && typeof input.bar === 'object') {
    const y = clamp01(Number(input.bar.y)), h = clamp01(Number(input.bar.h))
    if (y !== null && h !== null) {
      value.bar = { page: page(input.bar.page), y, h: Math.max(0.005, h), color: color(input.bar.color, '#FBE38E'), follow: input.bar.follow === true }
    }
  }
  if (input.chart && typeof input.chart === 'object') {
    const x = clamp01(Number(input.chart.x)), y = clamp01(Number(input.chart.y))
    const cw = clamp01(Number(input.chart.cellW)) ?? 0.02, ch = clamp01(Number(input.chart.cellH)) ?? 0.02
    if (x !== null && y !== null) value.chart = { page: page(input.chart.page), x, y, cellW: cw, cellH: ch, color: color(input.chart.color, '#8ED0D6') }
  }
  return { errors: [], value }
}

export function validateChart(body) {
  const errors = []
  const value = {
    name: text(body.name),
    cols: wholeNumber(body.cols),
    rows: wholeNumber(body.rows),
    palette: Array.isArray(body.palette) ? body.palette.slice(0, 12) : [],
    cells: Array.isArray(body.cells) ? body.cells : [],
  }
  if (!value.name) errors.push('name is required')
  if (value.name.length > 80) errors.push('name must be 80 characters or fewer')
  if (!(value.cols >= 2 && value.cols <= 60)) errors.push('cols must be from 2 to 60')
  if (!(value.rows >= 2 && value.rows <= 60)) errors.push('rows must be from 2 to 60')
  if (value.palette.length < 1 || !value.palette.every((c) => typeof c === 'string' && HEX.test(c))) {
    errors.push('palette must be a list of colours like #A1B2C3')
  }
  if (!errors.length) {
    if (value.cells.length !== value.cols * value.rows) errors.push('cells must have cols x rows entries')
    else if (!value.cells.every((c) => Number.isInteger(c) && c >= 0 && c < value.palette.length)) {
      errors.push('every cell must be a palette index')
    }
  }
  return { errors, value }
}

// ---- Pattern designs (Pattern Builder + AI generator) -----------------------
// The AI's reply is untrusted text, and so is anything a client posts. Either
// way the pattern is rebuilt from known fields only, with every string trimmed
// and capped and every list limited, so the JSONB column cannot fill with junk.
const DIFFICULTIES = ['beginner', 'easy', 'intermediate', 'advanced']
const SOURCES = ['manual', 'ai', 'generator']
const short = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '')
const strings = (list, count, max) =>
  (Array.isArray(list) ? list : []).slice(0, count).map((item) => short(item, max)).filter(Boolean)

export function validateDesign(body) {
  const errors = []
  const sections = (Array.isArray(body?.sections) ? body.sections : []).slice(0, 12).map((section) => ({
    name: short(section?.name, 60) || 'Section',
    rows: (Array.isArray(section?.rows) ? section.rows : []).slice(0, 300).map((row) => ({
      label: short(row?.label, 24),
      text: short(row?.text, 300),
      stitches: Number.isInteger(row?.stitches) && row.stitches >= 0 && row.stitches <= 9999 ? row.stitches : null,
    })).filter((row) => row.text),
  })).filter((section) => section.rows.length)

  const total = sections.reduce((sum, section) => sum + section.rows.length, 0)
  const value = {
    title: short(body?.title, 80),
    difficulty: DIFFICULTIES.includes(body?.difficulty) ? body.difficulty : 'beginner',
    source: SOURCES.includes(body?.source) ? body.source : 'manual',
    total_rows: total,
    data: {
      description: short(body?.description, 400),
      hook_mm: short(body?.hook_mm, 12),
      yarn: short(body?.yarn, 80),
      materials: strings(body?.materials, 15, 80),
      notes: strings(body?.notes, 8, 200),
      sections,
    },
  }
  if (!value.title) errors.push('title is required')
  if (total < 1) errors.push('add at least one row with instructions')
  if (total > 1000) errors.push('a pattern can have at most 1000 rows')
  return { errors, value }
}

// Everything about a Pattern Builder pattern that does not need a server:
// cleaning, turning it into text, and the built-in generator used when no AI
// is available (demo mode, or a server without an API key).
//
// A pattern is plain JSON:
// { title, description, difficulty, hook_mm, yarn, materials: [], notes: [],
//   sections: [{ name, rows: [{ label, text, stitches }] }] }

export const DIFFICULTIES = ['beginner', 'easy', 'intermediate', 'advanced']

export const emptyDesign = () => ({
  id: null, title: '', description: '', difficulty: 'beginner', hook_mm: '', yarn: '', source: 'manual',
  materials: [], notes: [],
  sections: [{ name: 'Main', rows: [{ label: '', text: '', stitches: null }] }],
})

const short = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '')
const strings = (list, count, max) => (Array.isArray(list) ? list : []).slice(0, count).map((s) => short(s, max)).filter(Boolean)

// The same rules as the server's validateDesign, so demo mode behaves alike
// and the builder can show a problem before it sends anything.
export function cleanDesign(input) {
  const sections = (Array.isArray(input?.sections) ? input.sections : []).slice(0, 12).map((section) => ({
    name: short(section?.name, 60) || 'Section',
    rows: (Array.isArray(section?.rows) ? section.rows : []).slice(0, 300).map((row) => ({
      label: short(row?.label, 24),
      text: short(row?.text, 300),
      stitches: Number.isInteger(row?.stitches) && row.stitches >= 0 && row.stitches <= 9999 ? row.stitches : null,
    })).filter((row) => row.text),
  })).filter((section) => section.rows.length)
  const total = sections.reduce((sum, section) => sum + section.rows.length, 0)
  const errors = []
  const title = short(input?.title, 80)
  if (!title) errors.push('Give the pattern a name.')
  if (total < 1) errors.push('Add at least one row with instructions.')
  if (total > 1000) errors.push('A pattern can have at most 1000 rows.')
  return {
    errors,
    value: {
      title, source: ['manual', 'ai', 'generator'].includes(input?.source) ? input.source : 'manual',
      difficulty: DIFFICULTIES.includes(input?.difficulty) ? input.difficulty : 'beginner',
      description: short(input?.description, 400), hook_mm: short(input?.hook_mm, 12), yarn: short(input?.yarn, 80),
      materials: strings(input?.materials, 15, 80), notes: strings(input?.notes, 8, 200), sections, total_rows: total,
    },
  }
}

export const countRows = (design) => design.sections.reduce((sum, s) => sum + s.rows.filter((r) => r.text.trim()).length, 0)

// One flat list, in the order the rows are worked. `number` is the same row
// number the tracker counts, which is what makes "start tracking" line up.
export function flattenRows(design) {
  const out = []
  design.sections.forEach((section) => section.rows.forEach((row) => {
    if (row.text.trim()) out.push({ ...row, section: section.name, number: out.length + 1 })
  }))
  return out
}

// The first row of each section, as { at_row, text }, used as tracker reminders.
export function sectionStarts(design) {
  let n = 0
  const starts = []
  design.sections.forEach((section) => {
    const rows = section.rows.filter((r) => r.text.trim())
    if (rows.length) starts.push({ at_row: n + 1, text: `${section.name}: ${rows[0].text}`.slice(0, 200) })
    n += rows.length
  })
  return starts
}

// Plain text version, saved into a project as its pattern file.
export function designToText(design) {
  const lines = [design.title, '']
  if (design.description) lines.push(design.description, '')
  const meta = [design.difficulty, design.hook_mm && `${design.hook_mm} mm hook`, design.yarn].filter(Boolean)
  if (meta.length) lines.push(meta.join(' | '), '')
  if (design.materials?.length) lines.push('Materials:', ...design.materials.map((m) => `- ${m}`), '')
  let n = 0
  design.sections.forEach((section) => {
    const rows = section.rows.filter((r) => r.text.trim())
    if (!rows.length) return
    lines.push(`== ${section.name} ==`)
    rows.forEach((row) => {
      n += 1
      const count = row.stitches != null ? ` (${row.stitches})` : ''
      lines.push(`Row ${n}${row.label ? ` [${row.label}]` : ''}: ${row.text}${count}`)
    })
    lines.push('')
  })
  if (design.notes?.length) lines.push('Notes:', ...design.notes.map((m) => `- ${m}`))
  return lines.join('\n').trim() + '\n'
}

// ---- Built-in generator -------------------------------------------------------
// Honest and simple: real maths for the shapes crocheters make most. It cannot
// design an animal's ears or legs the way the AI can, and says so.

const row = (label, text, stitches = null) => ({ label, text, stitches })

// Flat circle / sphere growth: round k has 6k stitches.
function growth(rounds) {
  const out = [row('Rnd 1', '6 sc in a magic ring', 6)]
  for (let k = 2; k <= rounds; k++) {
    out.push(row(`Rnd ${k}`, k === 2 ? 'inc in every stitch around' : `[${k - 2} sc, inc] × 6`, 6 * k))
  }
  return out
}

function shrink(from, startLabel) {
  const out = []
  for (let j = from - 1; j >= 1; j--) {
    out.push(row(`Rnd ${startLabel + out.length}`, j === 1 ? 'dec × 6' : `[${j - 1} sc, dec] × 6`, 6 * j))
  }
  return out
}

function ball(n, evenRounds, name) {
  const up = growth(n)
  const even = Array.from({ length: evenRounds }, (_, i) => row(`Rnd ${n + 1 + i}`, `sc in each stitch around`, 6 * n))
  const down = shrink(n, n + evenRounds + 1)
  return { name, rows: [...up, ...even, ...down, row('Finish', 'Stuff firmly. Fasten off, leaving a tail, and sew the last 6 stitches closed.')] }
}

const num = (text, pattern, fallback) => { const m = text.match(pattern); return m ? Number(m[1]) : fallback }

export function offlineGenerate(prompt) {
  const text = prompt.toLowerCase()
  const level = /advanced/.test(text) ? 'intermediate' : /easy|intermediate/.test(text) ? 'easy' : 'beginner'
  const base = { id: null, source: 'generator', difficulty: level, notes: [], materials: [] }

  if (/granny|square|motif/.test(text)) {
    const rounds = Math.min(12, Math.max(2, num(text, /(\d+)\s*(?:round|rnd)/, 4)))
    const rows = [row('Rnd 1', 'Ch 4, join with a sl st to make a ring. Ch 3, 2 dc in the ring, ch 2, [3 dc in the ring, ch 2] × 3, sl st into the top of the starting ch 3.', 12)]
    for (let r = 2; r <= rounds; r++) {
      rows.push(row(`Rnd ${r}`, `Sl st to the next corner space. Ch 3, (2 dc, ch 2, 3 dc) in the same corner. ${r > 2 ? `Along each side work ${r - 2} × [ch 1, 3 dc] in the spaces. ` : ''}At the next corners work ch 1, (3 dc, ch 2, 3 dc). Repeat for all 4 corners and sl st to join.`, 12 * r))
    }
    return { ...base, title: `Granny square, ${rounds} rounds`, description: 'A classic granny square. Join the rounds with a slip stitch and change colour whenever you like.',
      hook_mm: '4', yarn: 'DK or worsted, about 15 g per square', materials: ['Hook 4 mm', 'Yarn in 1 to 4 colours', 'Tapestry needle'],
      notes: ['Stitch counts show the number of double crochets in the round.'], sections: [{ name: 'Square', rows }] }
  }

  if (/hat|beanie|cap/.test(text)) {
    const crown = /baby/.test(text) ? 8 : /kid|child/.test(text) ? 9 : 10
    const sides = /baby/.test(text) ? 9 : /kid|child/.test(text) ? 11 : 14
    const rows = [...growth(crown), ...Array.from({ length: sides }, (_, i) => row(`Rnd ${crown + 1 + i}`, 'sc in each stitch around', 6 * crown)),
      row('Brim', `sl st in each stitch around. Fasten off and weave in the ends.`, 6 * crown)]
    return { ...base, title: `Basic ${/baby/.test(text) ? 'baby ' : /kid|child/.test(text) ? 'kids ' : ''}beanie`,
      description: 'A top-down hat worked in the round: a flat crown, then straight sides.', hook_mm: '4.5', yarn: 'Worsted, about 80 g',
      materials: ['Hook 4.5 mm', 'Stitch marker', 'Tapestry needle'], notes: ['Try the hat on as you go; add or remove side rounds to fit.'],
      sections: [{ name: 'Crown and sides', rows }] }
  }

  if (/scarf|blanket|dishcloth|washcloth|rectangle|swatch/.test(text)) {
    const width = Math.min(200, Math.max(6, num(text, /(\d+)\s*(?:st|stitch)/, 20)))
    const length = Math.min(300, Math.max(2, num(text, /(\d+)\s*row/, 30)))
    const rows = [row('Foundation', `Ch ${width + 1}. Sc in the 2nd ch from the hook and in each ch across.`, width),
      ...Array.from({ length: length - 1 }, (_, i) => row(`Row ${i + 2}`, 'Ch 1, turn. Sc in each stitch across.', width))]
    return { ...base, title: `Simple ${/scarf/.test(text) ? 'scarf' : /blanket/.test(text) ? 'blanket' : 'flat piece'}`,
      description: `A flat piece in single crochet, ${width} stitches wide and ${length} rows long.`, hook_mm: '5', yarn: 'Worsted',
      materials: ['Hook 5 mm', 'Tapestry needle'], notes: ['Change the width by changing the starting chain.'], sections: [{ name: 'Piece', rows }] }
  }

  const n = /tiny|mini/.test(text) ? 3 : /small|little/.test(text) ? 4 : /large|big|giant/.test(text) ? 6 : 5
  const subject = (text.match(/(?:amigurumi|plush|toy)?\s*([a-z]+)\s*(?:,|$)/)?.[1] ?? '').trim()
  const animal = /frog|bear|bunny|rabbit|cat|dog|duck|mouse|octopus|whale|turtle|penguin|sheep|lamb/.test(text)
  return { ...base, title: `Amigurumi ${animal ? 'body' : 'ball'}${subject && animal ? ` (${subject})` : ''}`,
    description: `A magic-ring sphere in single crochet.${animal ? ' This is the body; add eyes, ears and limbs of your own, or use the AI generator for a full design.' : ''}`,
    hook_mm: '3', yarn: 'DK cotton, about 30 g', materials: ['Hook 3 mm', 'Polyester stuffing', 'Safety eyes (optional)', 'Stitch marker', 'Tapestry needle'],
    notes: ['Work in a continuous spiral and mark the first stitch of every round.'], sections: [ball(n, 3, 'Body')] }
}

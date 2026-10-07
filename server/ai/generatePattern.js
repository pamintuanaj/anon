// Asks Anthropic's Claude for a structured crochet pattern. The API key stays
// on the server (ANTHROPIC_API_KEY); the browser only ever sees the result.
//
// To use a different provider, replace askModel() and keep the rest: whatever
// comes back is parsed and rebuilt by validateDesign() before anyone sees it.

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001'
const TIMEOUT_MS = 60_000

const SYSTEM = `You write beginner-friendly crochet patterns in US terms (sc, inc, dec, hdc, dc, ch, sl st, MR for magic ring).
Reply with ONE JSON object and nothing else: no prose, no markdown fences.
Shape:
{
  "title": "short pattern name",
  "description": "one or two sentences",
  "difficulty": "beginner" | "easy" | "intermediate" | "advanced",
  "hook_mm": "e.g. 3.5",
  "yarn": "weight and amount, e.g. DK cotton, about 60 g",
  "materials": ["each item on its own line, e.g. 'Safety eyes, 9 mm'"],
  "notes": ["short tips"],
  "sections": [
    { "name": "Body", "rows": [ { "label": "Rnd 1", "text": "6 sc in magic ring", "stitches": 6 } ] }
  ]
}
Rules:
- One entry in "rows" per row or round, in the order they are worked. Never write "repeat rows 3-5": write each row out so it can be counted.
- "stitches" is the stitch count at the end of that row or null if it does not apply. Make the counts add up correctly.
- Put separate pieces (head, body, ears, arms, assembly) in separate sections.
- At most 150 rows in total. Keep each "text" under 250 characters.
- Stay within what the request asks for. If it is not about crochet, return a simple beginner pattern for a small flat square.`

export class AiError extends Error {
  constructor(message, status = 502, code = 'ai_failed') {
    super(message)
    this.status = status
    this.code = code
  }
}

export const aiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY)

async function askModel(prompt) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 6000,
        system: SYSTEM,
        messages: [{ role: 'user', content: `Write a crochet pattern for: ${prompt}` }],
      }),
    })
    if (!response.ok) {
      // The provider's message can name keys or accounts, so log it here and
      // send the visitor something plain.
      console.error('Anthropic API error', response.status, (await response.text()).slice(0, 300))
      if (response.status === 429) throw new AiError('The AI is busy right now. Try again in a minute.', 503, 'ai_busy')
      throw new AiError('The AI could not make a pattern right now.')
    }
    const data = await response.json()
    return (data.content ?? []).filter((block) => block.type === 'text').map((block) => block.text).join('')
  } catch (error) {
    if (error instanceof AiError) throw error
    if (error.name === 'AbortError') throw new AiError('The AI took too long. Try a simpler request.', 504, 'ai_timeout')
    console.error('Anthropic request failed:', error.message)
    throw new AiError('The AI could not be reached.')
  } finally {
    clearTimeout(timer)
  }
}

// Models sometimes wrap JSON in text or fences despite instructions, so take
// the span from the first { to the last }.
function extractJson(text) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) throw new AiError('The AI reply was not a pattern. Try again.')
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    throw new AiError('The AI reply was cut off or malformed. Try again.')
  }
}

export async function generatePattern(prompt) {
  return extractJson(await askModel(prompt))
}

// A tiny in-memory limiter so a public link cannot drain the API credit.
// It resets when the server restarts, which is fine for a small app.
const hits = new Map()
export function allowAiCall(key, limit = Number(process.env.AI_HOURLY_LIMIT) || 10) {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((time) => now - time < 3_600_000)
  if (recent.length >= limit) { hits.set(key, recent); return false }
  hits.set(key, [...recent, now])
  return true
}

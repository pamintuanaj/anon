// A crafting streak: how many days in a row you have finished at least one
// row. Stored on this device only (localStorage), like the counter's position.
//
// Days are compared as LOCAL calendar dates ("2026-10-06"), so a night owl who
// crochets at 00:30 starts a new day, and daylight saving never turns "the next
// day" into 23 or 25 hours.

const KEY = 'crocheta:streak'

export function dayKey(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Whole days between two day keys, using UTC midnights so DST cannot interfere.
function daysBetween(a, b) {
  const utc = (key) => { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d) }
  return Math.round((utc(b) - utc(a)) / 86_400_000)
}

// state: { last, count, best } | null. Pure, so it is easy to test.
export function nextStreak(state, today) {
  if (!state?.last) return { last: today, count: 1, best: 1 }
  const gap = daysBetween(state.last, today)
  if (gap === 0) return state                                   // already counted today
  const count = gap === 1 ? state.count + 1 : 1                 // yesterday continues it, a gap restarts it
  return { last: today, count, best: Math.max(state.best ?? 0, count) }
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY))
    if (s && typeof s.last === 'string' && Number.isInteger(s.count) && s.count >= 0) return s
  } catch { /* unreadable or blocked: start fresh */ }
  return null
}

// What to show right now. A streak whose last day was before yesterday is over,
// even though nothing has been written yet.
export function readStreak(today = dayKey()) {
  const s = load()
  if (!s) return { count: 0, best: 0, today: false }
  const gap = daysBetween(s.last, today)
  return { count: gap <= 1 ? s.count : 0, best: s.best ?? s.count, today: gap === 0 }
}

// Call when a row is finished. Returns what to show.
export function recordCraftDay(today = dayKey()) {
  const next = nextStreak(load(), today)
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* private mode: still shown this session */ }
  return { count: next.count, best: next.best, today: true }
}

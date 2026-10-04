const MILESTONES = [
  { percent: 25, message: 'A quarter done! 🧶' },
  { percent: 50, message: 'Halfway there! 🎉' },
  { percent: 75, message: 'Three quarters! Almost there 💕' },
  { percent: 100, message: 'Finished! You did it 🐸🎉' },
]

// The milestone crossed by going from row `before` to row `after`, if any.
// "Crossed" (not "equal to") matters: 25% of 50 rows is row 12.5, so no row
// is exactly 25%, but going from row 12 to 13 crosses it.
export function milestoneCrossed(before, after, total) {
  const pct = (row) => (row / total) * 100
  return [...MILESTONES].reverse().find((m) => pct(before) < m.percent && pct(after) >= m.percent) ?? null
}

// Every tenth row gets hearts: 10, 20, 30... `%` is the remainder after
// division, so row % 10 is 0 exactly on multiples of 10. The row > 0 check
// stops row 0 (0 % 10 is also 0) from counting.
export function isTenRowMilestone(row) {
  return row > 0 && row % 10 === 0
}

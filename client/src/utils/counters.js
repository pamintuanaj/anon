// How a linked counter moves when the main row counter moves.
// Without a repeat it simply counts: 0, 1, 2, 3 ...
// With repeat_every = 6 it cycles through the pattern repeat: 1 ... 6, 1 ... 6.
export function advanceLinked(counter) {
  if (!counter.repeat_every) return counter.value + 1
  return (counter.value % counter.repeat_every) + 1
}

export function rewindLinked(counter) {
  if (!counter.repeat_every) return Math.max(0, counter.value - 1)
  return counter.value <= 1 ? counter.repeat_every : counter.value - 1
}

// Is this reminder for the row being worked now? `row` is the row in progress
// (finished rows + 1). A reminder fires on its at_row, and if it repeats, on
// every repeat_every rows after that.
export function reminderIsDue(reminder, row) {
  if (row === reminder.at_row) return true
  if (!reminder.repeat_every || row < reminder.at_row) return false
  return (row - reminder.at_row) % reminder.repeat_every === 0
}

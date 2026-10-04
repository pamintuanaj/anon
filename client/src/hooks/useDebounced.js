import { useEffect, useState } from 'react'

// Returns `value`, but only after it has stopped changing for `ms`. Used so a
// search box does not fire a request on every keystroke.
export function useDebounced(value, ms = 300) {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms)
    return () => clearTimeout(timer)
  }, [value, ms])
  return settled
}

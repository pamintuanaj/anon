import { useCallback, useEffect, useState } from 'react'

const KEY = 'crocheta:theme'

// 'light' | 'dark'. Starts from what the user picked before, otherwise from
// the device setting. The choice is written to <html data-theme>, which the
// CSS tokens in global.css read. index.html sets it before React loads, so the
// page does not flash light first.
function initialTheme() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* storage blocked: fall through */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState(initialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem(KEY, next) } catch { /* not saved, still switches */ }
      return next
    })
  }, [])

  return { theme, toggle }
}

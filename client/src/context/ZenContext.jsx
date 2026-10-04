import { createContext, useContext, useState } from 'react'

// Zen Focus Mode is switched on inside the Tracker page, but it changes things
// OUTSIDE that page: the navigation (in App) disappears and the whole screen
// gets a drifting gradient. So the state lives here, above both, and any
// component can read it with useZen().
const ZenContext = createContext(null)

export function ZenProvider({ children }) {
  const [isZenMode, setZenMode] = useState(false)
  return (
    <ZenContext.Provider value={{ isZenMode, setZenMode }}>
      {children}
    </ZenContext.Provider>
  )
}

export function useZen() {
  const value = useContext(ZenContext)
  if (!value) throw new Error('useZen must be used inside <ZenProvider>')
  return value
}

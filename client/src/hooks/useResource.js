import { useCallback, useEffect, useRef, useState } from 'react'

// Loads data and tracks the four states every screen needs: loading, ready,
// error, and "slow" (a free-tier server waking up). `deps` re-runs the load,
// e.g. when a tab or search term changes.
export function useResource(loader, deps) {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [slow, setSlow] = useState(false)
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const id = ++requestId.current
    setStatus('loading')
    setError(null)
    const timer = setTimeout(() => setSlow(true), 3000)
    try {
      const result = await loader()
      // Ignore answers to an older request (the user switched tabs meanwhile).
      if (id !== requestId.current) return
      setData(result)
      setStatus('ready')
    } catch (caught) {
      if (id !== requestId.current) return
      setError(caught)
      setStatus('error')
    } finally {
      clearTimeout(timer)
      setSlow(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { load() }, [load])

  return { data, setData, status, error, slow, reload: load }
}

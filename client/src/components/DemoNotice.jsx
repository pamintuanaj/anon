import { useState } from 'react'
import { Info, X } from 'lucide-react'
import { USING_MOCK_API } from '../api'
import styles from './DemoNotice.module.css'

const KEY = 'crocheta:demo-dismissed'

// A slim, dismissible line instead of a loud banner on every page. It only
// exists in demo mode, where nothing is saved to a server.
export default function DemoNotice() {
  const [hidden, setHidden] = useState(() => {
    try { return sessionStorage.getItem(KEY) === '1' } catch { return false }
  })
  if (!USING_MOCK_API || hidden) return null
  return (
    <p className={styles.notice} role="status">
      <Info size={16} aria-hidden="true" />
      <span><strong>Demo mode.</strong> Changes are saved in this browser only.</span>
      <button type="button" className={styles.close} aria-label="Hide this notice"
        onClick={() => { setHidden(true); try { sessionStorage.setItem(KEY, '1') } catch { /* fine */ } }}>
        <X size={16} />
      </button>
    </p>
  )
}

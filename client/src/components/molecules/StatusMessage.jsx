import Frog from '../atoms/Frog.jsx'
import Button from '../atoms/Button.jsx'
import styles from './StatusMessage.module.css'

// Loading, error and empty look different on purpose: "nothing here yet" and
// "we could not find out" are not the same message.
export function Loading({ slow, what = 'your stuff' }) {
  return (
    <p className={styles.muted} role="status">
      Loading {what}{slow ? '. The server may be waking up, which can take up to a minute.' : '...'}
    </p>
  )
}

export function ErrorMessage({ error, onRetry }) {
  return (
    <div className={styles.error} role="alert">
      <p><strong>Could not load this.</strong> {error?.message}</p>
      {onRetry && <Button size="sm" variant="ghost" onClick={onRetry}>Try again</Button>}
    </div>
  )
}

export function Empty({ children, action }) {
  return (
    <div className={styles.empty}>
      <Frog size={56} mood="sad" />
      <p>{children}</p>
      {action}
    </div>
  )
}

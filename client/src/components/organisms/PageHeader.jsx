import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import styles from './PageHeader.module.css'

// The same header on every page: an optional breadcrumb (where am I?), the
// title, one line of explanation, and the page's actions on the right.
export default function PageHeader({ breadcrumb, title, subtitle, actions, children }) {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        {breadcrumb && (
          <nav aria-label="Breadcrumb">
            <ol className={styles.crumbs}>
              {breadcrumb.map((crumb, i) => (
                <li key={crumb.label}>
                  {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}
                  {i < breadcrumb.length - 1 && <ChevronRight size={14} aria-hidden="true" />}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {children}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}

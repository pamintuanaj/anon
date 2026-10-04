import { Link } from 'react-router-dom'
import Logo from '../atoms/Logo.jsx'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.brand}>
        <Logo size={28} title="" />
        <span><strong>CrocheTa</strong> · Mag-crochet tamu! Every stitch made cozy.</span>
      </div>
      <nav aria-label="Footer" className={styles.links}>
        <Link to="/gallery">Projects</Link>
        <Link to="/inventory">Stash</Link>
        <Link to="/tools?tool=glossary">Glossary</Link>
        <Link to="/tools?tool=sizes">Size guide</Link>
      </nav>
      <p className={styles.small}>© 2026 CrocheTa. A student project.</p>
    </footer>
  )
}

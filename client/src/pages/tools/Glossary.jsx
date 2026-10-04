import { useState } from 'react'
import SearchBar from '../../components/molecules/SearchBar.jsx'
import styles from './Tools.module.css'

// Common abbreviations. `craft` says whether a term is mostly used in
// crochet, knitting, or both.
const TERMS = [
  ['ch', 'chain', 'crochet'], ['sl st', 'slip stitch', 'both'], ['sc', 'single crochet (UK: dc)', 'crochet'],
  ['hdc', 'half double crochet (UK: htr)', 'crochet'], ['dc', 'double crochet (UK: tr)', 'crochet'],
  ['tr', 'treble crochet (UK: dtr)', 'crochet'], ['inc', 'increase: two stitches in the same stitch', 'both'],
  ['dec', 'decrease: work two stitches together', 'both'], ['sc2tog', 'single crochet two together (a decrease)', 'crochet'],
  ['MR', 'magic ring, an adjustable starting loop', 'crochet'], ['BLO', 'back loop only', 'crochet'],
  ['FLO', 'front loop only', 'crochet'], ['FPdc', 'front post double crochet', 'crochet'],
  ['BPdc', 'back post double crochet', 'crochet'], ['sk', 'skip (UK: miss)', 'crochet'],
  ['sp', 'space', 'crochet'], ['st(s)', 'stitch(es)', 'both'], ['rep', 'repeat', 'both'],
  ['rnd', 'round', 'both'], ['yo', 'yarn over', 'both'], ['RS', 'right side', 'both'], ['WS', 'wrong side', 'both'],
  ['k', 'knit', 'knit'], ['p', 'purl', 'knit'], ['k2tog', 'knit two together (right-leaning decrease)', 'knit'],
  ['ssk', 'slip, slip, knit (left-leaning decrease)', 'knit'], ['m1', 'make one (an increase)', 'knit'],
  ['CO', 'cast on', 'knit'], ['BO', 'bind off (UK: cast off)', 'knit'], ['tbl', 'through the back loop', 'knit'],
  ['wyib', 'with yarn in back', 'knit'], ['pm', 'place marker', 'both'], ['sm', 'slip marker', 'both'],
  ['BOR', 'beginning of round', 'both'], ['MC / CC', 'main colour / contrast colour', 'both'],
]

export default function Glossary() {
  const [search, setSearch] = useState('')
  const term = search.trim().toLowerCase()
  const shown = TERMS.filter(([abbr, meaning]) => !term || abbr.toLowerCase().includes(term) || meaning.toLowerCase().includes(term))
  return (
    <>
      <div className={styles.search}>
        <SearchBar id="glossary-search" label="Search the glossary" value={search} onChange={setSearch} placeholder="Search: sc, decrease, marker..." />
      </div>
      <div className={styles.tableWrap}>
        <table className={`${styles.table} ${styles.glossary}`}>
          <caption className="visually-hidden">Crochet and knitting abbreviations</caption>
          <thead><tr><th scope="col">Abbreviation</th><th scope="col">Meaning</th><th scope="col">Used in</th></tr></thead>
          <tbody>
            {shown.map(([abbr, meaning, craft]) => (
              <tr key={abbr}><td>{abbr}</td><td>{meaning}</td><td><span className={styles.pill}>{craft}</span></td></tr>
            ))}
            {!shown.length && <tr><td colSpan="3">No match for “{search}”.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}

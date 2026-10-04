import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { listPatterns, uploadPattern, patternFileUrl, savePatternMarks, deletePattern } from '../../api'
import { useResource } from '../../hooks/useResource.js'
import Button from '../atoms/Button.jsx'
import { FileText, Camera, Type, Globe, Image as ImageIcon, NotebookPen, X } from 'lucide-react'
import page from '../../pages/Page.module.css'
import styles from './PatternPanel.module.css'

// The viewer pulls in pdf.js (large), so it is only downloaded when a pattern
// is actually opened, not with the rest of the app.
const PatternViewer = lazy(() => import('./PatternViewer.jsx'))

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.txt,application/pdf,image/png,image/jpeg,image/webp,text/plain'

// The "Pattern" part of the tracker: import patterns into this project, pick
// one, and work from it with the viewer's highlighters.
export default function PatternPanel({ projectId, rowSignal }) {
  const { data: patterns, setData: setPatterns, status, error, reload } = useResource(() => listPatterns(projectId), [projectId])
  const [selected, setSelected] = useState(null)
  const [mode, setMode] = useState(null)        // null | 'text' | 'web'
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [textForm, setTextForm] = useState({ name: '', text: '' })
  const fileInput = useRef(null)
  const cameraInput = useRef(null)

  useEffect(() => {
    if (patterns?.length && !patterns.some((p) => p.id === selected)) setSelected(patterns[0].id)
    if (patterns && !patterns.length) setSelected(null)
  }, [patterns, selected])

  async function importFile(file, name) {
    if (!file) return
    setBusy(true)
    setActionError(null)
    try {
      const created = await uploadPattern(projectId, file, name)
      setPatterns((all) => [...all, created])
      setSelected(created.id)
      setMode(null)
    } catch (caught) {
      setActionError(caught.message)
    } finally {
      setBusy(false)
    }
  }

  async function importText(event) {
    event.preventDefault()
    if (!textForm.text.trim()) return setActionError('Paste the pattern text first.')
    const name = (textForm.name.trim() || 'Typed pattern') + '.txt'
    await importFile(new File([textForm.text], name, { type: 'text/plain' }), name)
    setTextForm({ name: '', text: '' })
  }

  async function remove(pattern) {
    if (!window.confirm(`Remove "${pattern.name}" and its highlights from this project?`)) return
    try {
      await deletePattern(pattern.id)
      setPatterns((all) => all.filter((p) => p.id !== pattern.id))
    } catch (caught) {
      setActionError(caught.message)
    }
  }

  const current = patterns?.find((p) => p.id === selected)

  return (
    <section className={styles.panel} aria-labelledby="pattern-title">
      <header className={styles.head}>
        <h2 id="pattern-title" className={styles.title}>Pattern</h2>
        <div className={styles.importButtons}>
          <Button size="sm" onClick={() => fileInput.current?.click()} disabled={busy}><FileText size={16} aria-hidden="true" /> From device</Button>
          <Button size="sm" variant="secondary" onClick={() => cameraInput.current?.click()} disabled={busy}><Camera size={16} aria-hidden="true" /> Photo</Button>
          <Button size="sm" variant="secondary" onClick={() => setMode(mode === 'text' ? null : 'text')}><Type size={16} aria-hidden="true" /> Type or paste</Button>
          <Button size="sm" variant="ghost" onClick={() => setMode(mode === 'web' ? null : 'web')}><Globe size={16} aria-hidden="true" /> From a website</Button>
        </div>
        <input ref={fileInput} type="file" accept={ACCEPT} hidden onChange={(e) => { importFile(e.target.files?.[0]); e.target.value = '' }} />
        <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden
          onChange={(e) => { importFile(e.target.files?.[0]); e.target.value = '' }} />
      </header>

      {busy && <p className={styles.muted}>Importing...</p>}
      {actionError && <p className={page.formError} role="alert">{actionError}</p>}

      {mode === 'text' && (
        <form className={styles.box} onSubmit={importText}>
          <div>
            <label htmlFor="pt-name">Name</label>
            <input id="pt-name" maxLength={100} value={textForm.name} placeholder="Bunny body"
              onChange={(e) => setTextForm({ ...textForm, name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="pt-text">Pattern</label>
            <textarea id="pt-text" rows={8} value={textForm.text}
              placeholder={'Rnd 1: 6 sc in MR (6)\nRnd 2: inc x6 (12)\nRnd 3: (sc, inc) x6 (18)'}
              onChange={(e) => setTextForm({ ...textForm, text: e.target.value })} />
          </div>
          <div className={page.formActions}>
            <Button type="submit" size="sm" disabled={busy}>Add pattern</Button>
            <Button size="sm" variant="ghost" onClick={() => setMode(null)}>Cancel</Button>
          </div>
        </form>
      )}

      {mode === 'web' && (
        <div className={styles.box}>
          <p><strong>Blog or shop page:</strong> open the pattern page in your browser, press
            <kbd>Ctrl</kbd>+<kbd>P</kbd> (or Share, Print on a phone), choose <em>Save as PDF</em>, then use
            <em> From device</em>.</p>
          <p><strong>Ravelry, LoveCrafts and other shops:</strong> download the PDF from your library there, then use
            <em> From device</em>. CrocheTa cannot sign in to those sites for you.</p>
          <p><strong>Just a few rows?</strong> Copy the text and use <em>Type or paste</em>.</p>
        </div>
      )}

      {status === 'loading' && <p className={styles.muted}>Loading patterns...</p>}
      {status === 'error' && <p className={page.formError}>Could not load patterns. <button type="button" onClick={reload}>Try again</button></p>}

      {status === 'ready' && patterns.length === 0 && !mode && (
        <div className={styles.empty}>
          <p>Import a PDF, a photo of a paper pattern, or paste the text. Then follow it with a row bar that moves as you
            count, highlight sizes, draw notes, place stickers, track charts stitch by stitch, and pin bookmarks.</p>
        </div>
      )}

      {patterns?.length > 0 && (
        <>
          <div className={styles.tabs} role="tablist" aria-label="Patterns in this project">
            {patterns.map((p) => (
              <div key={p.id} className={`${styles.tab} ${p.id === selected ? styles.tabOn : ''}`}>
                <button type="button" role="tab" aria-selected={p.id === selected} onClick={() => setSelected(p.id)}>
                  {p.mime === 'application/pdf' ? <FileText size={15} aria-hidden="true" /> : p.mime === 'text/plain' ? <NotebookPen size={15} aria-hidden="true" /> : <ImageIcon size={15} aria-hidden="true" />} {p.name}
                </button>
                <button type="button" className={styles.x} onClick={() => remove(p)} aria-label={`Remove ${p.name}`}><X size={14} /></button>
              </div>
            ))}
          </div>
          {current && (
            <Suspense fallback={<p className={styles.muted}>Opening the pattern tools...</p>}>
            <PatternViewer key={current.id} pattern={current} fileUrl={patternFileUrl(current)} rowSignal={rowSignal}
              onSaveMarks={async (marks) => {
                const saved = await savePatternMarks(current.id, marks)
                setPatterns((all) => all.map((p) => (p.id === saved.id ? { ...p, marks: saved.marks } : p)))
              }} />
            </Suspense>
          )}
        </>
      )}
    </section>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Play, Trash2 } from 'lucide-react'
import {
  listDesigns, getDesign, createDesign, updateDesign, deleteDesign,
  createProject, uploadPattern, createReminder,
} from '../api'
import { useResource } from '../hooks/useResource.js'
import PageHeader from '../components/organisms/PageHeader.jsx'
import Tabs from '../components/molecules/Tabs.jsx'
import Button from '../components/atoms/Button.jsx'
import PatternGenerator from '../components/pattern-builder/PatternGenerator.jsx'
import PatternBuilder from '../components/pattern-builder/PatternBuilder.jsx'
import { Loading, ErrorMessage, Empty } from '../components/molecules/StatusMessage.jsx'
import { emptyDesign, cleanDesign, designToText, sectionStarts } from '../utils/pattern.js'
import styles from '../components/pattern-builder/PatternBuilder.module.css'

const SOURCE = { ai: 'AI', generator: 'Built-in', manual: 'By hand' }

export default function PatternsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('generate')       // generate | build | saved
  const [draft, setDraft] = useState(emptyDesign)
  const { data: saved, setData: setSaved, status, error, reload } = useResource(() => listDesigns(), [])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [problem, setProblem] = useState(null)

  function openDraft(design) {
    setDraft({ ...emptyDesign(), ...design })
    setMessage(null); setProblem(null)
    setTab('build')
  }

  async function save() {
    const { errors, value } = cleanDesign(draft)
    if (errors.length) return setProblem(errors.join(' '))
    setSaving(true); setProblem(null)
    try {
      const done = draft.id ? await updateDesign(draft.id, value) : await createDesign(value)
      setDraft({ ...emptyDesign(), ...done })
      setSaved((all) => [done, ...(all ?? []).filter((d) => d.id !== done.id)])
      setMessage('Saved to My patterns.')
    } catch (caught) {
      setProblem(caught.message)
    } finally {
      setSaving(false)
    }
  }

  // The bridge to the tracker: a project with the same number of rows, the whole
  // pattern attached as a text file you can read beside the counter, and a
  // reminder at the start of each section so you see what comes next.
  async function start(design) {
    const { errors, value } = cleanDesign(design)
    if (errors.length) return setProblem(errors.join(' '))
    setProblem(null); setMessage('Setting up your project…')
    let project
    try {
      project = await createProject({ title: value.title, pattern_ref: `Pattern Builder (${value.difficulty})`, total_rows: value.total_rows, color_hex: '#F8C7D2', status: 'ongoing' })
    } catch (caught) {
      setMessage(null)
      return setProblem(`Could not create the project: ${caught.message}`)
    }
    // The project exists now. Anything below failing should not strand the person.
    const failed = []
    try {
      const name = `${value.title}.txt`
      await uploadPattern(project.id, new File([designToText(value)], name, { type: 'text/plain' }), name)
    } catch { failed.push('the pattern file') }
    for (const reminder of sectionStarts(value)) {
      try { await createReminder(project.id, { ...reminder, repeat_every: null }) } catch { failed.push('a reminder') ; break }
    }
    if (failed.length) window.alert(`Your project was created, but ${failed.join(' and ')} could not be added. You can add it from the tracker.`)
    navigate(`/workspace/${project.id}`)
  }

  async function edit(meta) {
    try { openDraft(await getDesign(meta.id)) } catch (caught) { setProblem(caught.message) }
  }
  async function startSaved(meta) {
    try { await start(await getDesign(meta.id)) } catch (caught) { setProblem(caught.message) }
  }
  async function remove(meta) {
    if (!window.confirm(`Delete the pattern "${meta.title}"?`)) return
    try {
      await deleteDesign(meta.id)
      setSaved((all) => all.filter((d) => d.id !== meta.id))
      if (draft.id === meta.id) setDraft({ ...draft, id: null })
    } catch (caught) { setProblem(caught.message) }
  }

  return (
    <>
      <PageHeader title="Patterns" subtitle="Describe a pattern and get a draft, or write your own row by row. Then start tracking it in one tap." />
      <div className={styles.tabs}>
        <Tabs label="Pattern tools" value={tab} onChange={setTab}
          options={[{ value: 'generate', label: 'Generate' }, { value: 'build', label: 'Builder' }, { value: 'saved', label: 'My patterns', count: saved?.length }]} />
      </div>
      {message && <p className={styles.note} role="status">{message}</p>}
      {problem && tab !== 'build' && <p className={styles.error} role="alert">{problem}</p>}

      {tab === 'generate' && <PatternGenerator onDraft={openDraft} />}

      {tab === 'build' && (
        <>
          <div className={styles.actions}>
            <Button size="sm" variant="ghost" onClick={() => { setDraft(emptyDesign()); setMessage(null); setProblem(null) }}>New blank pattern</Button>
          </div>
          <PatternBuilder design={draft} onChange={setDraft} onSave={save} onStart={() => start(draft)} saving={saving} error={problem} />
        </>
      )}

      {tab === 'saved' && (
        <>
          {status === 'loading' && <Loading what="patterns" />}
          {status === 'error' && <ErrorMessage error={error} onRetry={reload} />}
          {status === 'ready' && saved.length === 0 && <Empty>No saved patterns yet. Generate one, or write your own in the Builder.</Empty>}
          {status === 'ready' && saved.length > 0 && (
            <ul className={styles.cards}>
              {saved.map((d) => (
                <li key={d.id} className={styles.card}>
                  <div>
                    <h3 className={styles.cardTitle}>{d.title}</h3>
                    <p className={styles.help}>{d.total_rows} rows · {d.difficulty} · {SOURCE[d.source] ?? 'By hand'}</p>
                    {d.description && <p className={styles.desc}>{d.description}</p>}
                  </div>
                  <div className={styles.actions}>
                    <Button size="sm" variant="secondary" onClick={() => edit(d)}><Pencil size={15} aria-hidden="true" /> Edit</Button>
                    <Button size="sm" onClick={() => startSaved(d)}><Play size={15} aria-hidden="true" /> Start tracking</Button>
                    <Button size="sm" variant="danger" onClick={() => remove(d)}><Trash2 size={15} aria-hidden="true" /> Delete</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  )
}

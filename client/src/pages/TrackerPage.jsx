import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  getProject, saveProgress, createPost,
  listCounters, createCounter, updateCounter, setCounterValue, deleteCounter,
  listReminders, createReminder, deleteReminder,
} from '../api'
import { useResource } from '../hooks/useResource.js'
import ProgressGrid from '../components/organisms/ProgressGrid.jsx'
import RowCounter from '../components/organisms/RowCounter.jsx'
import SessionTimer from '../components/molecules/SessionTimer.jsx'
import RowNotesCard from '../components/molecules/RowNotesCard.jsx'
import StitchCounter from '../components/molecules/StitchCounter.jsx'
import Confetti from '../components/molecules/Confetti.jsx'
import { milestoneCrossed, isTenRowMilestone } from '../utils/milestones.js'
import ZenToggle from '../components/molecules/ZenToggle.jsx'
import { useZen } from '../context/ZenContext.jsx'
import Button from '../components/atoms/Button.jsx'
import Tabs from '../components/molecules/Tabs.jsx'
import PageHeader from '../components/organisms/PageHeader.jsx'
import { Watch, Share2, Check, Loader2, CloudOff, Wrench } from 'lucide-react'
import CountersPanel from '../components/organisms/CountersPanel.jsx'
import RemindersPanel, { ReminderBanner } from '../components/organisms/RemindersPanel.jsx'
import PatternPanel from '../components/pattern/PatternPanel.jsx'
import VoiceControl from '../components/molecules/VoiceControl.jsx'
import FloatingCounter from '../components/molecules/FloatingCounter.jsx'
import ToolsDrawer from '../components/organisms/ToolsDrawer.jsx'
import FinishCelebration from '../components/organisms/FinishCelebration.jsx'
import StreakChip from '../components/atoms/StreakChip.jsx'
import { guessShape } from '../utils/shapes.js'
import { readStreak, recordCraftDay } from '../utils/streak.js'
import { advanceLinked, rewindLinked, reminderIsDue } from '../utils/counters.js'
import { Loading, ErrorMessage } from '../components/molecules/StatusMessage.jsx'
import page from './Page.module.css'
import styles from './TrackerPage.module.css'

const NAME_KEY = 'crocheta:name'

export default function TrackerPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: project, status, error, slow, reload } = useResource(() => getProject(id), [id])
  const { data: counterData, setData: setCounters } = useResource(() => listCounters(id), [id])
  const { data: reminderData, setData: setReminders } = useResource(() => listReminders(id), [id])
  const counters = counterData ?? []
  const reminders = reminderData ?? []
  const [counterError, setCounterError] = useState(null)
  const [tab, setTab] = useState('counters')

  // Show the floating pill only while the big counter is scrolled off screen.
  // IntersectionObserver tells us when an element enters or leaves the view,
  // without checking on every scroll event.
  const counterAnchor = useRef(null)
  const [counterOnScreen, setCounterOnScreen] = useState(true)
  useEffect(() => {
    const el = counterAnchor.current
    if (!el || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) => setCounterOnScreen(entry.isIntersecting), { threshold: 0.2 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [status])

  // The live tracker state. It starts from the saved project and then changes
  // locally on every tap; autosave writes it back.
  const [currentRow, setCurrentRow] = useState(0)
  const [currentStitch, setCurrentStitch] = useState(0)
  const [celebration, setCelebration] = useState(null)   // { key, message }
  const [heartBurst, setHeartBurst] = useState(null)     // changes on every 10th row
  const [toolsOpen, setToolsOpen] = useState(false)    // the Tools drawer
  const [sprinkleKey, setSprinkleKey] = useState(0)       // +1 on every finished row
  const [finished, setFinished] = useState(false)         // the fullscreen "You did it!"
  const [streak, setStreak] = useState(() => readStreak())
  // The progress picture: the person's choice for THIS project, else a guess from its name.
  const shapeKey = `crocheta:shape:${id}`
  const [shapeChoice, setShapeChoice] = useState(() => { try { return localStorage.getItem(shapeKey) } catch { return null } })
  function chooseShape(next) {
    setShapeChoice(next)
    try { localStorage.setItem(shapeKey, next) } catch { /* blocked storage: the choice lasts until reload */ }
  }
  const { isZenMode, setZenMode } = useZen()

  // Zen mode belongs to the tracker: leaving the page switches it off, so the
  // navigation is never missing on another screen. Escape also exits.
  useEffect(() => {
    if (!isZenMode) return
    const onKey = (event) => { if (event.key === 'Escape') setZenMode(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isZenMode, setZenMode])
  useEffect(() => () => setZenMode(false), [setZenMode])
  const [notes, setNotes] = useState('')
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saveState, setSaveState] = useState('saved')   // saved | saving | failed

  const [sharing, setSharing] = useState(false)
  const [author, setAuthor] = useState(() => localStorage.getItem(NAME_KEY) ?? '')
  const [shareText, setShareText] = useState('')
  const [shareError, setShareError] = useState(null)

  // Copy the loaded project into local state once it arrives.
  useEffect(() => {
    if (!project) return
    setCurrentRow(project.current_row)
    setCurrentStitch(project.current_stitch ?? 0)
    setNotes(project.notes)
    setSeconds(project.elapsed_seconds)
    setRunning(false)
    setDirty(false)
  }, [project])

  // The session timer: one interval while running, cleared when paused or when
  // leaving the page. The functional update avoids reading a stale `seconds`.
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [running])

  // Autosave: wait until changes stop for a moment, then save once. While the
  // timer runs, `seconds` changes every second, so this also saves roughly
  // every 15 seconds instead of on every tick.
  const latest = useRef({ currentRow, currentStitch, notes, seconds })
  latest.current = { currentRow, currentStitch, notes, seconds }

  async function persist() {
    const { currentRow: current_row, currentStitch: current_stitch, notes: n, seconds: elapsed_seconds } = latest.current
    setSaveState('saving')
    try {
      await saveProgress(id, { current_row, current_stitch, notes: n, elapsed_seconds })
      setSaveState('saved')
      setDirty(false)
    } catch {
      setSaveState('failed')
    }
  }

  useEffect(() => {
    if (!dirty) return
    const timer = setTimeout(persist, 800)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, currentRow, currentStitch, notes])

  useEffect(() => {
    if (!running) return
    const timer = setInterval(persist, 15000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  // Leaving the page before the 800ms autosave fires would lose the last taps,
  // so save once more on the way out if anything is still unsaved.
  const dirtyRef = useRef(false)
  dirtyRef.current = dirty
  useEffect(() => () => {
    if (dirtyRef.current) {
      const { currentRow: current_row, currentStitch: current_stitch, notes: n, seconds: elapsed_seconds } = latest.current
      saveProgress(id, { current_row, current_stitch, notes: n, elapsed_seconds }).catch(() => {})
    }
  }, [id])

  // ---- Extra counters ------------------------------------------------------
  // Save one counter's new value. The screen has already changed (optimistic);
  // if the save fails, say so rather than silently losing the count.
  function saveCounter(counter, value) {
    setCounterValue(counter.id, value).catch(() => setCounterError('A counter could not be saved. Check your connection.'))
  }

  // Linked counters move one step with every row (+1) or undo (-1).
  function moveLinked(direction) {
    if (!counters.some((c) => c.linked)) return
    const next = counters.map((c) => (c.linked
      ? { ...c, value: direction > 0 ? advanceLinked(c) : rewindLinked(c) }
      : c))
    setCounters(next)
    next.forEach((c, i) => { if (c.value !== counters[i].value) saveCounter(c, c.value) })
  }

  function changeCounter(counter, delta) {
    let value = delta > 0 ? counter.value + 1 : Math.max(0, counter.value - 1)
    if (counter.repeat_every) value = delta > 0 ? advanceLinked(counter) : rewindLinked(counter)
    setCounters((all) => all.map((c) => (c.id === counter.id ? { ...c, value } : c)))
    saveCounter(counter, value)
  }

  async function addCounter(input) {
    const created = await createCounter(id, input)
    setCounters((all) => [...(all ?? []), created])
  }

  async function editCounter(counterId, input) {
    const saved = await updateCounter(counterId, input)
    setCounters((all) => all.map((c) => (c.id === counterId ? saved : c)))
  }

  async function removeCounter(counterId) {
    await deleteCounter(counterId)
    setCounters((all) => all.filter((c) => c.id !== counterId))
  }

  async function addReminder(input) {
    const created = await createReminder(id, input)
    setReminders((all) => [...(all ?? []), created].sort((a, b) => a.at_row - b.at_row))
  }

  async function removeReminder(reminderId) {
    await deleteReminder(reminderId)
    setReminders((all) => all.filter((r) => r.id !== reminderId))
  }

  function addRow() {
    if (!project || currentRow >= project.total_rows) return
    const next = currentRow + 1
    setCurrentRow(next)
    setCurrentStitch(0)   // a new row starts from stitch 0
    setDirty(true)
    setSprinkleKey((k) => k + 1)
    setStreak(recordCraftDay())
    const milestone = milestoneCrossed(currentRow, next, project.total_rows)
    // The last row gets the fullscreen celebration; the smaller milestones keep the toast.
    if (milestone?.percent === 100) setFinished(true)
    else if (milestone) setCelebration({ key: Date.now(), message: milestone.message })
    if (isTenRowMilestone(next)) setHeartBurst(Date.now())
    moveLinked(1)
  }

  function changeStitch(value) {
    setCurrentStitch(value)
    setDirty(true)
  }

  function undoRow() {
    if (currentRow === 0) return
    setCurrentRow(currentRow - 1)
    setDirty(true)
    moveLinked(-1)
  }

  function toggleTimer() {
    if (running) persist()   // save the time the moment you pause
    setRunning(!running)
  }

  function resetTimer() {
    setSeconds(0)
    setDirty(true)
  }

  async function handleShare(event) {
    event.preventDefault()
    if (!author.trim() || !shareText.trim()) {
      setShareError('Add your name and a line about this milestone.')
      return
    }
    setShareError(null)
    try {
      await persist()   // the server copies the saved row, so save first
      await createPost({ author, body: shareText, project_id: project.id })
      localStorage.setItem(NAME_KEY, author.trim())
      navigate('/')
    } catch (caught) {
      setShareError(caught.message)
    }
  }

  if (status === 'loading') return <Loading slow={slow} what="this project" />
  if (status === 'error') {
    return (
      <>
        <ErrorMessage error={error} onRetry={reload} />
        <Link to="/gallery">Back to the gallery</Link>
      </>
    )
  }

  const percent = Math.round((currentRow / project.total_rows) * 100)
  // The row being worked right now is the one after the last finished row.
  const workingRow = Math.min(currentRow + 1, project.total_rows)
  const due = reminders.filter((r) => reminderIsDue(r, workingRow))
  const voiceCommands = [
    { words: ['next', 'plus', 'row', 'add'], run: addRow },
    { words: ['back', 'minus', 'undo'], run: undoRow },
    { words: ['stitch'], run: () => changeStitch(Math.min(9999, latest.current.currentStitch + 1)) },
    { words: ['unstitch'], run: () => changeStitch(Math.max(0, latest.current.currentStitch - 1)) },
  ]

  return (
    <div className={`${styles.root} ${toolsOpen ? styles.split : ''}`}>
      <Confetti burst={celebration?.key} message={celebration?.message} />
      <FinishCelebration open={finished} onClose={() => setFinished(false)} title={project.title}
        totalRows={project.total_rows} seconds={seconds}
        onShare={() => { setFinished(false); setSharing(true) }} />

      <PageHeader
        breadcrumb={isZenMode ? null : [{ label: 'Projects', to: '/gallery' }, { label: project.title }]}
        title={project.title}
        subtitle={project.pattern_ref || null}
        actions={
          <>
            {!isZenMode && <StreakChip count={streak.count} best={streak.best} />}
            <SaveChip state={saveState} dirty={dirty} onRetry={persist} />
            {!isZenMode && <VoiceControl commands={voiceCommands} />}
            {!isZenMode && (
              <Button size="sm" variant={toolsOpen ? 'secondary' : 'ghost'} aria-expanded={toolsOpen}
                title="Calculators, sizes and charts, beside your pattern" onClick={() => setToolsOpen((o) => !o)}>
                <Wrench size={16} aria-hidden="true" /> Tools
              </Button>
            )}
            {!isZenMode && (
              <Button size="sm" variant="ghost" title="A small counter window to keep beside your pattern"
                onClick={() => window.open(`${import.meta.env.BASE_URL}mini/${project.id}`, 'crocheta-mini', 'width=340,height=520')}>
                <Watch size={16} aria-hidden="true" /> Mini counter
              </Button>
            )}
            <ZenToggle checked={isZenMode} onChange={setZenMode} />
          </>
        }
      />

      <ReminderBanner due={due} />
      {counterError && <p className={page.formError} role="alert">{counterError}</p>}

      {/* ---- Overview: the three things you look at while crocheting ---- */}
      <section className={`${styles.hero} ${isZenMode ? styles.heroZen : ''}`} aria-label="Row counter and progress">
        <div className={`${styles.card} ${styles.counterCard} enter`} style={{ '--i': 0 }}>
          <RowCounter currentRow={currentRow} totalRows={project.total_rows} onAdd={addRow} onUndo={undoRow}
            burstKey={heartBurst} sprinkleKey={sprinkleKey} anchorRef={counterAnchor} />
          {!isZenMode && (
            <Button size="sm" variant="secondary" onClick={() => setSharing((s) => !s)}>
              <Share2 size={16} aria-hidden="true" /> {sharing ? 'Close' : 'Share snapshot'}
            </Button>
          )}
          {sharing && !isZenMode && (
            <form className={styles.share} onSubmit={handleShare}>
              <p>Posts <strong>row {currentRow} of {project.total_rows}</strong> to the community.</p>
              <div>
                <label htmlFor="share-author">Your name</label>
                <input id="share-author" maxLength={40} value={author} placeholder="e.g. mossy.loops" onChange={(e) => setAuthor(e.target.value)} />
              </div>
              <div>
                <label htmlFor="share-text">What happened</label>
                <textarea id="share-text" rows={2} maxLength={500} value={shareText}
                  onChange={(e) => setShareText(e.target.value)} placeholder="e.g. Halfway through the brim!" />
              </div>
              {shareError && <p className={page.formError} role="alert">{shareError}</p>}
              <Button type="submit" size="sm">Post to community</Button>
            </form>
          )}
        </div>

        <div className={`${styles.card} ${styles.progressCard} enter`} style={{ '--i': 1 }}>
          <div className={styles.progressTop}>
            <div>
              <p className={styles.eyebrow}>Progress</p>
              <p className={styles.rowBig}><span key={currentRow} className={styles.roll}>{currentRow}</span><span className={styles.of}> / {project.total_rows} rows</span></p>
            </div>
            <span className={styles.percentChip}>{percent}%</span>
          </div>
          <div className={styles.bar} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Rows done">
            <span style={{ width: `${percent}%` }} />
          </div>
          <ProgressGrid totalRows={project.total_rows} currentRow={currentRow} plain
            shape={shapeChoice || guessShape(project)} color={project.color_hex} onShape={chooseShape} />
          <dl className={styles.facts}>
            <div><dt>To go</dt><dd>{project.total_rows - currentRow} rows</dd></div>
            <div><dt>Working on</dt><dd>Row {workingRow}</dd></div>
            <div><dt>Time so far</dt><dd>{Math.floor(seconds / 3600)}h {String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}m</dd></div>
          </dl>
        </div>

        {!isZenMode && (
          <div className={styles.stack}>
            <div className="enter" style={{ '--i': 2 }}><StitchCounter value={currentStitch} onChange={changeStitch} /></div>
            <div className="enter" style={{ '--i': 3 }}><SessionTimer seconds={seconds} running={running} onToggle={toggleTimer} onReset={resetTimer} /></div>
          </div>
        )}
      </section>

      {/* ---- Workspace: the things you set up, behind tabs ---- */}
      {!isZenMode && (
        <section className={`${styles.workspace} enter`} style={{ '--i': 4 }} aria-label="Counters, reminders and notes">
          <Tabs label="Project tools" value={tab} onChange={setTab} options={[
            { value: 'counters', label: 'Counters', count: counters.length },
            { value: 'reminders', label: 'Reminders', count: reminders.length },
            { value: 'notes', label: 'Notes' },
          ]} />
          <div className={styles.tabPanel} key={tab}>
            {tab === 'counters' && (
              <CountersPanel counters={counters} onChange={changeCounter} onCreate={addCounter}
                onUpdate={editCounter} onDelete={removeCounter} />
            )}
            {tab === 'reminders' && (
              <RemindersPanel reminders={reminders} workingRow={workingRow} onCreate={addReminder} onDelete={removeReminder} />
            )}
            {tab === 'notes' && (
              <RowNotesCard value={notes} onChange={(value) => { setNotes(value); setDirty(true) }} />
            )}
          </div>
        </section>
      )}

      <PatternPanel projectId={project.id} rowSignal={currentRow} />

      <FloatingCounter visible={!counterOnScreen} row={currentRow} total={project.total_rows}
        onAdd={addRow} onUndo={undoRow} />

      <ToolsDrawer open={toolsOpen && !isZenMode} onClose={() => setToolsOpen(false)}
        projectTitle={project.title} row={currentRow} total={project.total_rows} />
    </div>
  )
}

// A small status chip: "Saved", "Saving...", or "Not saved" with a retry.
function SaveChip({ state, dirty, onRetry }) {
  if (state === 'failed') {
    return (
      <button type="button" className={`${styles.chip} ${styles.chipError}`} onClick={onRetry}>
        <CloudOff size={14} aria-hidden="true" /> Not saved, retry
      </button>
    )
  }
  const saving = state === 'saving' || dirty
  return (
    <span className={styles.chip} aria-live="polite">
      {saving ? <Loader2 size={14} className={styles.spin} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}
      {saving ? 'Saving' : 'Saved'}
    </span>
  )
}

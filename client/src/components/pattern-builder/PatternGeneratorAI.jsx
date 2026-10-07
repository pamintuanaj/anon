import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import Button from '../atoms/Button.jsx'
import { generateDesign } from '../../api/index.js'
import { offlineGenerate } from '../../utils/pattern.js'
import styles from './PatternBuilder.module.css'

const EXAMPLES = ['Amigurumi frog, beginner', 'Granny square, 5 rounds', 'Baby beanie', 'Scarf, 20 stitches, 60 rows', 'Small ball']

// Asks for a pattern in plain words. The AI (when the server has a key) writes
// it; otherwise the built-in generator does. Either way the result lands in the
// builder as a DRAFT to read and edit. Nothing is saved until the person says so.
export default function PatternGenerator({ onDraft }) {
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState(null)
  const [error, setError] = useState(null)

  const builtIn = (why) => {
    onDraft(offlineGenerate(prompt))
    setNote(why)
    setError(null)
  }

  async function generate(event) {
    event.preventDefault()
    if (prompt.trim().length < 3) return setError('Describe what you want to make, like "amigurumi frog, beginner".')
    setBusy(true); setError(null); setNote(null)
    try {
      onDraft(await generateDesign(prompt.trim()))
    } catch (caught) {
      // No key on the server, or demo mode: use the built-in generator and say so.
      if (caught.code === 'ai_not_configured') builtIn('Made with the built-in generator, because the AI is not switched on here. It handles granny squares, hats, flat pieces and amigurumi balls.')
      else setError({ message: caught.message, canFallBack: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className={styles.panel} onSubmit={generate}>
      <h2 className={styles.h2}><Sparkles size={20} aria-hidden="true" /> Describe it, get a pattern</h2>
      <p className={styles.help}>Say what you want to make and how experienced you are. You will get a row-by-row draft you can edit before saving.</p>
      <label htmlFor="gen-prompt">What would you like to make?</label>
      <textarea id="gen-prompt" rows={3} maxLength={300} value={prompt} placeholder="e.g. Amigurumi frog, beginner"
        onChange={(e) => setPrompt(e.target.value)} />
      <div className={styles.chips} aria-label="Examples">
        {EXAMPLES.map((example) => <button key={example} type="button" className={styles.chip} onClick={() => setPrompt(example)}>{example}</button>)}
      </div>
      <div className={styles.actions}>
        <Button type="submit" disabled={busy}>{busy ? 'Writing your pattern…' : 'Generate pattern'}</Button>
        <Button type="button" variant="ghost" disabled={busy || prompt.trim().length < 3} onClick={() => builtIn('Made with the built-in generator.')}>Use built-in generator</Button>
      </div>
      {busy && <p className={styles.help} role="status">This can take up to a minute.</p>}
      {note && <p className={styles.note} role="status">{note}</p>}
      {error && (
        <p className={styles.error} role="alert">
          {error.message ?? error}
          {error.canFallBack && prompt.trim().length >= 3 && <> <button type="button" className={styles.link} onClick={() => builtIn('Made with the built-in generator.')}>Use the built-in generator instead</button></>}
        </p>
      )}
    </form>
  )
}

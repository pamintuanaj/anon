import { useEffect, useRef, useState } from 'react'
import { Mic } from 'lucide-react'
import styles from './VoiceControl.module.css'

const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

// Hands full of yarn? Say "next" to count a row. Uses the browser's built-in
// speech recognition (Chrome, Edge, Safari). Where the browser has none, the
// button simply does not appear.
//
// commands: [{ words: ['next', 'plus'], run: () => ... }, ...]
export default function VoiceControl({ commands }) {
  const [listening, setListening] = useState(false)
  const [heard, setHeard] = useState('')
  const recognizer = useRef(null)
  const wanted = useRef(false)
  const latestCommands = useRef(commands)
  latestCommands.current = commands

  useEffect(() => () => { wanted.current = false; recognizer.current?.stop() }, [])

  if (!Recognition) return null

  function start() {
    const r = new Recognition()
    r.lang = 'en-US'
    r.continuous = true
    r.interimResults = false
    r.onresult = (event) => {
      const said = event.results[event.results.length - 1][0].transcript.trim().toLowerCase()
      setHeard(said)
      const command = latestCommands.current.find((c) => c.words.some((w) => said.split(/\s+/).includes(w)))
      command?.run()
    }
    // Browsers stop listening after a pause; start again while still switched on.
    r.onend = () => { if (wanted.current) { try { r.start() } catch { /* already starting */ } } else setListening(false) }
    r.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        wanted.current = false
        setHeard('Microphone permission was refused')
      }
    }
    recognizer.current = r
    wanted.current = true
    r.start()
    setListening(true)
  }

  function stop() {
    wanted.current = false
    recognizer.current?.stop()
    setListening(false)
  }

  return (
    <div className={styles.wrap}>
      <button type="button" className={`${styles.mic} ${listening ? styles.on : ''}`}
        onClick={listening ? stop : start} aria-pressed={listening}
        title='Say "next", "back", "stitch" or "unstitch"'>
        <Mic size={16} aria-hidden="true" /> {listening ? 'Listening' : 'Voice'}
      </button>
      {listening && <span className={styles.heard} aria-live="polite">{heard ? `“${heard}”` : 'Say “next” or “back”'}</span>}
    </div>
  )
}

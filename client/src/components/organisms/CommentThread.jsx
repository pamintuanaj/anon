import { useState } from 'react'
import { listComments, createComment, deleteComment, commentImageSrc } from '../../api'
import AttachBar from '../molecules/AttachBar.jsx'
import Sticker from '../atoms/Sticker.jsx'
import { blobToDataUrl } from '../../utils/image.js'
import { useResource } from '../../hooks/useResource.js'
import Avatar from '../atoms/Avatar.jsx'
import Button from '../atoms/Button.jsx'
import styles from './CommentThread.module.css'

const NAME_KEY = 'crocheta:name'

// Loaded only when the comments are opened, so the feed does not fetch every
// comment of every post up front. onCountChange keeps the "💬 3" label right.
export default function CommentThread({ postId, onCountChange }) {
  const { data: comments, setData: setComments, status, error, reload } =
    useResource(() => listComments(postId), [postId])
  const [author, setAuthor] = useState(() => localStorage.getItem(NAME_KEY) ?? '')
  const [body, setBody] = useState('')
  const [image, setImage] = useState(null)
  const [sticker, setSticker] = useState(null)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (!author.trim() || (!body.trim() && !image && !sticker)) return setFormError('Add your name, and a comment, photo or sticker.')
    setSaving(true)
    setFormError(null)
    try {
      const created = await createComment(postId, { author, body, sticker, image: image ? await blobToDataUrl(image.blob) : null })
      localStorage.setItem(NAME_KEY, author.trim())
      const next = [...comments, created]
      setComments(next)
      onCountChange(next.length)
      setBody('')
      setImage(null)
      setSticker(null)
    } catch (caught) {
      setFormError(caught.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id) {
    try {
      await deleteComment(id)
      const next = comments.filter((c) => c.id !== id)
      setComments(next)
      onCountChange(next.length)
    } catch (caught) {
      setFormError(caught.message)
    }
  }

  return (
    <div className={styles.thread}>
      {status === 'loading' && <p className={styles.muted}>Loading comments...</p>}
      {status === 'error' && (
        <p className={styles.muted}>Could not load comments. <button type="button" className={styles.link} onClick={reload}>Try again</button></p>
      )}
      {status === 'ready' && comments.length === 0 && <p className={styles.muted}>No comments yet. Say something nice!</p>}
      {status === 'ready' && comments.length > 0 && (
        <ul className={styles.list}>
          {comments.map((c) => (
            <li key={c.id} className={styles.comment}>
              <Avatar name={c.author} size="sm" />
              <div className={styles.bubble}>
                <p><strong>{c.author}</strong> {c.body}</p>
                {commentImageSrc(c) && <img className={styles.photo} src={commentImageSrc(c)} alt={`Photo from ${c.author}`} loading="lazy" />}
                {c.sticker && <span className={styles.sticker}><Sticker id={c.sticker} size={56} /></span>}
                <button type="button" className={styles.link} onClick={() => remove(c.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form className={styles.form} onSubmit={submit}>
        <label htmlFor={`c-author-${postId}`} className="visually-hidden">Your name</label>
        <input id={`c-author-${postId}`} className={styles.name} placeholder="Name" maxLength={40}
          value={author} onChange={(e) => setAuthor(e.target.value)} />
        <label htmlFor={`c-body-${postId}`} className="visually-hidden">Comment</label>
        <input id={`c-body-${postId}`} placeholder="Write a comment" maxLength={300}
          value={body} onChange={(e) => setBody(e.target.value)} />
        <Button type="submit" size="sm" disabled={saving}>{saving ? '...' : 'Send'}</Button>
      </form>
      <AttachBar compact idPrefix={`c-${postId}`} image={image} sticker={sticker} onImage={setImage} onSticker={setSticker} />
      {formError && <p className={styles.error} role="alert">{formError}</p>}
    </div>
  )
}

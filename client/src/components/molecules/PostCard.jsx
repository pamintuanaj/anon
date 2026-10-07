import { useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../atoms/Avatar.jsx'
import Button from '../atoms/Button.jsx'
import CommentThread from '../organisms/CommentThread.jsx'
import Sticker from '../atoms/Sticker.jsx'
import { postImageSrc } from '../../api'
import { Heart, ThumbsUp, MessageCircle, Trash2 } from 'lucide-react'
import styles from './PostCard.module.css'

function timeAgo(iso) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.round(hours / 24)} d ago`
}

export default function PostCard({ post, index = 0, onLike, onSave, onDelete, onCommentCount }) {
  const [showComments, setShowComments] = useState(false)
  const hasSnapshot = post.row_snapshot != null
  const percent = hasSnapshot ? Math.round((post.row_snapshot / post.total_rows_snapshot) * 100) : 0
  const count = post.comment_count ?? 0

  return (
    <article className={`${styles.card} enter`} style={{ '--i': index }}>
      <header className={styles.head}>
        <Avatar name={post.author} />
        <div className={styles.who}>
          <p className={styles.author}>{post.author}</p>
          <time className={styles.time} dateTime={post.created_at}>{timeAgo(post.created_at)}</time>
        </div>
        <button
          type="button"
          className={`${styles.save} ${post.saved ? styles.saved : ''}`}
          onClick={() => onSave(post)}
          aria-pressed={post.saved}
          aria-label={post.saved ? 'Remove from saved' : 'Save post'}
          title={post.saved ? 'Saved' : 'Save'}
        >
          <Heart size={18} fill={post.saved ? 'currentColor' : 'none'} />
        </button>
      </header>

      {/* React escapes this text, so a post cannot inject HTML or scripts. */}
      {post.body && <p className={styles.body}>{post.body}</p>}

      {postImageSrc(post) && (
        <img className={styles.photo} src={postImageSrc(post)} alt={`Photo shared by ${post.author}`} loading="lazy" />
      )}
      {post.sticker && <span className={styles.sticker}><Sticker id={post.sticker} size={96} /></span>}

      {hasSnapshot && (
        <div className={styles.snapshot}>
          <div className={styles.snapshotHead}>
            {post.project_id
              ? <Link to={`/workspace/${post.project_id}`}>{post.project_title}</Link>
              : <span>{post.project_title}</span>}
            <span className={styles.rows}>row {post.row_snapshot}/{post.total_rows_snapshot}</span>
          </div>
          <div className={styles.bar} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Progress when shared">
            <span style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}

      <footer className={styles.foot}>
        <div className={styles.actions}>
          <Button size="sm" variant="ghost" onClick={() => onLike(post.id)} aria-label={`Like, ${post.likes} likes so far`}>
            <ThumbsUp size={15} aria-hidden="true" /> {post.likes}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowComments((s) => !s)} aria-expanded={showComments}>
            <MessageCircle size={15} aria-hidden="true" /> {count} {count === 1 ? 'comment' : 'comments'}
          </Button>
        </div>
        <Button size="sm" variant="danger" onClick={() => onDelete(post.id)}><Trash2 size={15} aria-hidden="true" /> Delete</Button>
      </footer>

      {showComments && (
        <CommentThread postId={post.id} onCountChange={(n) => onCommentCount(post.id, n)} />
      )}
    </article>
  )
}

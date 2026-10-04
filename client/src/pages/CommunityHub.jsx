import { useState } from 'react'
import { listPosts, createPost, likePost, setPostSaved, deletePost } from '../api'
import { useResource } from '../hooks/useResource.js'
import { useDebounced } from '../hooks/useDebounced.js'
import PostCard from '../components/molecules/PostCard.jsx'
import SearchBar from '../components/molecules/SearchBar.jsx'
import Tabs from '../components/molecules/Tabs.jsx'
import PageHeader from '../components/organisms/PageHeader.jsx'
import { SkeletonList } from '../components/atoms/Skeleton.jsx'
import Button from '../components/atoms/Button.jsx'
import { Loading, ErrorMessage, Empty } from '../components/molecules/StatusMessage.jsx'
import styles from './Page.module.css'

const NAME_KEY = 'crocheta:name'

export default function CommunityHub() {
  const [search, setSearch] = useState('')
  const [view, setView] = useState('all')   // all | saved
  const term = useDebounced(search)
  const { data: posts, setData: setPosts, status, error, slow, reload } =
    useResource(() => listPosts({ search: term, saved: view === 'saved' }), [term, view])

  const [author, setAuthor] = useState(() => localStorage.getItem(NAME_KEY) ?? '')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [actionError, setActionError] = useState(null)

  async function handlePost(event) {
    event.preventDefault()
    if (!author.trim() || !body.trim()) {
      setFormError('Add your name and something to say.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const created = await createPost({ author, body })
      localStorage.setItem(NAME_KEY, author.trim())
      if (view === 'all') setPosts([created, ...(posts ?? [])])
      setBody('')
    } catch (caught) {
      setFormError(caught.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleLike(id) {
    try {
      const updated = await likePost(id)
      setPosts((current) => current.map((p) => (p.id === id ? updated : p)))
    } catch (caught) {
      setActionError(caught)
    }
  }

  async function handleSave(post) {
    const saved = !post.saved
    // Optimistic, and in the Saved view an unsaved post leaves the list.
    setPosts((current) => view === 'saved' && !saved
      ? current.filter((p) => p.id !== post.id)
      : current.map((p) => (p.id === post.id ? { ...p, saved } : p)))
    try {
      await setPostSaved(post.id, saved)
    } catch (caught) {
      setActionError(caught)
      reload()
    }
  }

  function handleCommentCount(id, count) {
    setPosts((current) => current.map((p) => (p.id === id ? { ...p, comment_count: count } : p)))
  }

  async function handleDelete(id) {
    const previous = posts
    setPosts(posts.filter((p) => p.id !== id))   // optimistic
    try {
      await deletePost(id)
    } catch (caught) {
      setPosts(previous)                           // put it back
      setActionError(caught)
    }
  }

  return (
    <>
      <PageHeader title="Community"
        subtitle="Milestones, questions and finished makes from other crocheters." />

      {/* Feed on the left (where the eye starts), writing on the right, the
          way most social apps are laid out. On phones the composer comes first. */}
      <div className={styles.twoCol}>
        <section className={styles.mainCol} aria-label="Posts">
          <div className={styles.toolbar}>
            <Tabs label="Which posts" value={view} onChange={setView}
              options={[{ value: 'all', label: 'All posts' }, { value: 'saved', label: 'Saved' }]} />
            <SearchBar id="feed-search" label="Search posts" value={search} onChange={setSearch} placeholder="Search posts" />
          </div>

          {actionError && <ErrorMessage error={actionError} onRetry={() => { setActionError(null); reload() }} />}
          {status === 'loading' && (slow ? <Loading slow what="posts" /> : <SkeletonList />)}
          {status === 'error' && <ErrorMessage error={error} onRetry={reload} />}
          {status === 'ready' && posts.length === 0 && (
            <Empty>
              {term ? `No posts match "${term}".`
                : view === 'saved' ? 'Nothing saved yet. Tap the heart on a post to keep it here.'
                : 'No posts yet. Write the first one.'}
            </Empty>
          )}
          {status === 'ready' && posts.length > 0 && (
            <div className={styles.feed}>
              {posts.map((post, i) => (
                <PostCard key={post.id} index={i} post={post} onLike={handleLike} onSave={handleSave}
                  onDelete={handleDelete} onCommentCount={handleCommentCount} />
              ))}
            </div>
          )}
        </section>

        <aside className={styles.aside}>
          <form className={styles.panel} onSubmit={handlePost}>
            <h2 className={styles.asideTitle}>Write a post</h2>
            <div>
              <label htmlFor="post-author">Your name</label>
              <input id="post-author" value={author} maxLength={40} placeholder="e.g. mossy.loops" onChange={(e) => setAuthor(e.target.value)} />
            </div>
            <div>
              <label htmlFor="post-body">Post</label>
              <textarea id="post-body" rows={4} maxLength={500} value={body} onChange={(e) => setBody(e.target.value)}
                placeholder="Ask a question or share a finished row" />
              <p className={styles.counter}>{body.length} / 500</p>
            </div>
            {formError && <p className={styles.formError} role="alert">{formError}</p>}
            <Button type="submit" disabled={saving}>{saving ? 'Posting...' : 'Post'}</Button>
          </form>
          <div className={styles.tip}>
            <p><strong>Tip:</strong> to share your progress with the row count attached, use <em>Share snapshot</em> in the tracker.</p>
          </div>
        </aside>
      </div>
    </>
  )
}

import { useState } from 'react'
import { listMaterials, createMaterial, updateMaterial, deleteMaterial } from '../api'
import { useResource } from '../hooks/useResource.js'
import { useDebounced } from '../hooks/useDebounced.js'
import MaterialCard from '../components/molecules/MaterialCard.jsx'
import MaterialForm from '../components/organisms/MaterialForm.jsx'
import Tabs from '../components/molecules/Tabs.jsx'
import SearchBar from '../components/molecules/SearchBar.jsx'
import Button from '../components/atoms/Button.jsx'
import { Plus } from 'lucide-react'
import PageHeader from '../components/organisms/PageHeader.jsx'
import { SkeletonCards } from '../components/atoms/Skeleton.jsx'
import { Loading, ErrorMessage, Empty } from '../components/molecules/StatusMessage.jsx'
import styles from './Page.module.css'

const TYPES = [
  { value: 'yarn', label: 'Yarn' },
  { value: 'hook', label: 'Hooks' },
  { value: 'other', label: 'Other' },
  { value: 'low', label: 'Running low' },
]

export default function StashPage() {
  const [type, setType] = useState('yarn')
  const [search, setSearch] = useState('')
  const term = useDebounced(search)
  const [adding, setAdding] = useState(false)
  const [actionError, setActionError] = useState(null)
  const lowView = type === 'low'
  const { data: materials, setData: setMaterials, status, error, slow, reload } =
    useResource(() => listMaterials(lowView ? { low: true, search: term } : { type, search: term }), [type, term])
  // Everything that is low or out, across all tabs, for the warning banner.
  const { data: lowItems, reload: reloadLow } = useResource(() => listMaterials({ low: true }), [])

  async function handleCreate(input) {
    const created = await createMaterial(input)
    setMaterials((all) => [...all, created].sort((a, b) => a.name.localeCompare(b.name)))
    setAdding(false)
    reloadLow()
  }

  async function handleQty(material, change) {
    const qty = Math.max(0, material.qty + change)
    // Optimistic: show the new number now, undo it if the save fails.
    setMaterials((all) => all.map((m) => (m.id === material.id ? { ...m, qty, low_stock: qty > 0 && qty <= m.low_at } : m)))
    try {
      const { low_stock, created_at, id, ...fields } = material
      const saved = await updateMaterial(material.id, { ...fields, qty })
      setMaterials((all) => all.map((m) => (m.id === material.id ? saved : m)))
      reloadLow()
    } catch (caught) {
      setMaterials((all) => all.map((m) => (m.id === material.id ? material : m)))
      setActionError(caught)
    }
  }

  async function handleDelete(material) {
    if (!window.confirm(`Remove "${material.name}" from your stash?`)) return
    try {
      await deleteMaterial(material.id)
      setMaterials((all) => all.filter((m) => m.id !== material.id))
      reloadLow()
    } catch (caught) {
      setActionError(caught)
    }
  }

  return (
    <>
      <PageHeader title="Stash"
        subtitle="The yarn, hooks and notions you already own. Check here before buying more."
        actions={!adding && <Button onClick={() => setAdding(true)}><Plus size={18} aria-hidden="true" /> Add item</Button>} />

      {lowItems?.length > 0 && !lowView && (
        <div className={styles.warning} role="status">
          <span aria-hidden="true">⚠️</span>
          <p>
            <strong>{lowItems.length} {lowItems.length === 1 ? 'item is' : 'items are'} low or out:</strong>{' '}
            {lowItems.slice(0, 3).map((m) => m.name).join(', ')}{lowItems.length > 3 ? ', and more' : ''}.
          </p>
          <Button size="sm" variant="ghost" onClick={() => setType('low')}>See them</Button>
        </div>
      )}

      {adding && <MaterialForm key={lowView ? 'yarn' : type} type={lowView ? 'yarn' : type} onSave={handleCreate} onCancel={() => setAdding(false)} />}

      <div className={styles.toolbar}>
        <Tabs label="Material type" options={TYPES.map((t) => t.value === 'low' ? { ...t, count: lowItems?.length ?? 0 } : t)} value={type} onChange={setType} />
        <SearchBar id="stash-search" label="Search your stash" value={search} onChange={setSearch}
          placeholder="Search name or colour no." />
      </div>

      {actionError && <ErrorMessage error={actionError} onRetry={() => { setActionError(null); reload() }} />}
      {status === 'loading' && (slow ? <Loading slow what="your stash" /> : <SkeletonCards count={4} height="9rem" min="14rem" />)}
      {status === 'error' && <ErrorMessage error={error} onRetry={reload} />}
      {status === 'ready' && materials.length === 0 && (
        <Empty action={!term && !lowView && <Button onClick={() => setAdding(true)}>Add the first one</Button>}>
          {term ? `Nothing matches "${term}".` : lowView ? 'Nothing is running low. Your stash is well stocked!' : 'Nothing here yet.'}
        </Empty>
      )}
      {status === 'ready' && materials.length > 0 && (
        <div className={styles.grid}>
          {materials.map((material, i) => (
            <MaterialCard key={material.id} index={i} material={material} onQty={handleQty} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </>
  )
}

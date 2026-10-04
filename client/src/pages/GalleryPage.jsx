import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import PageHeader from '../components/organisms/PageHeader.jsx'
import { SkeletonCards } from '../components/atoms/Skeleton.jsx'
import { listProjects, createProject, updateProject, deleteProject } from '../api'
import { useResource } from '../hooks/useResource.js'
import ProjectCard from '../components/molecules/ProjectCard.jsx'
import ProjectForm from '../components/organisms/ProjectForm.jsx'
import Tabs from '../components/molecules/Tabs.jsx'
import Button from '../components/atoms/Button.jsx'
import { Loading, ErrorMessage, Empty } from '../components/molecules/StatusMessage.jsx'
import styles from './Page.module.css'

const FOLDERS = [
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'done', label: 'Done' },
  { value: 'archived', label: 'Archived' },
]

export default function GalleryPage() {
  const navigate = useNavigate()
  const [folder, setFolder] = useState('ongoing')
  const [params, setParams] = useSearchParams()
  const [adding, setAdding] = useState(params.get('new') === '1')   // the sidebar's "New project" opens the form
  const [actionError, setActionError] = useState(null)
  // Load everything once and filter here, so the tab counts are always right.
  const { data: projects, setData: setProjects, status, error, slow, reload } = useResource(() => listProjects(), [])

  async function handleCreate(input) {
    const created = await createProject(input)
    navigate(`/workspace/${created.id}`)
  }

  async function handleStatus(project, newStatus) {
    try {
      const updated = await updateProject(project.id, { ...project, status: newStatus })
      setProjects((all) => all.map((p) => (p.id === project.id ? updated : p)))
    } catch (caught) {
      setActionError(caught)
    }
  }

  async function handleDelete(project) {
    if (!window.confirm(`Delete "${project.title}"? Its row count and notes go with it.`)) return
    try {
      await deleteProject(project.id)
      setProjects((all) => all.filter((p) => p.id !== project.id))
    } catch (caught) {
      setActionError(caught)
    }
  }

  const shown = (projects ?? []).filter((p) => p.status === folder)
  const tabs = FOLDERS.map((f) => ({ ...f, count: (projects ?? []).filter((p) => p.status === f.value).length }))

  return (
    <>
      <PageHeader title="Projects"
        subtitle="Everything you are making, sorted into folders. Open one to keep counting."
        actions={!adding && <Button onClick={() => setAdding(true)}><Plus size={18} aria-hidden="true" /> New project</Button>} />

      {adding && <ProjectForm onSave={handleCreate} onCancel={() => { setAdding(false); if (params.get('new')) setParams({}) }} />}

      <div className={styles.toolbar}>
        <Tabs label="Project folders" options={tabs} value={folder} onChange={setFolder} />
      </div>

      {actionError && <ErrorMessage error={actionError} onRetry={() => { setActionError(null); reload() }} />}
      {status === 'loading' && (slow ? <Loading slow what="projects" /> : <SkeletonCards count={3} height="20rem" />)}
      {status === 'error' && <ErrorMessage error={error} onRetry={reload} />}
      {status === 'ready' && shown.length === 0 && (
        <Empty action={folder === 'ongoing' && <Button onClick={() => setAdding(true)}>Start a project</Button>}>
          Nothing in {folder} yet.
        </Empty>
      )}
      {status === 'ready' && shown.length > 0 && (
        <div className={styles.grid}>
          {shown.map((project, i) => (
            <ProjectCard key={project.id} index={i} project={project} onStatus={handleStatus} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </>
  )
}

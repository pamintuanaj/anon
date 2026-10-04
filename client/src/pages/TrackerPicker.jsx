import { Link, Navigate } from 'react-router-dom'
import { listProjects } from '../api'
import { useResource } from '../hooks/useResource.js'
import { Loading, ErrorMessage, Empty } from '../components/molecules/StatusMessage.jsx'

// "Tracker" in the nav has no project id. Open the most recently touched
// ongoing project, or explain how to start one.
export default function TrackerPicker() {
  const { data, status, error, slow, reload } = useResource(() => listProjects('ongoing'), [])

  if (status === 'loading') return <Loading slow={slow} what="your projects" />
  if (status === 'error') return <ErrorMessage error={error} onRetry={reload} />
  if (data.length > 0) return <Navigate to={`/workspace/${data[0].id}`} replace />
  return (
    <Empty action={<Link to="/gallery">Start a project in the gallery</Link>}>
      No ongoing projects to track yet.
    </Empty>
  )
}

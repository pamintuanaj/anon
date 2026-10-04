// The real client: every function calls the Express API.
// Same names and return shapes as mockApi.js, so no component knows which one
// it is talking to.

const BASE = import.meta.env.VITE_API_BASE_URL || ''

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`
    try {
      const body = await response.json()
      if (body?.error) message = body.error
    } catch {
      // Not JSON; the status line is all we have.
    }
    throw new Error(message)
  }

  return response.status === 204 ? null : response.json()
}

const json = (method, body) => ({ method, body: JSON.stringify(body) })
const query = (params) => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value) search.set(key, value)
  const text = search.toString()
  return text ? `?${text}` : ''
}

// Projects
export const listProjects = (status) => request(`/api/projects${query({ status })}`)
export const getProject = (id) => request(`/api/projects/${id}`)
export const createProject = (input) => request('/api/projects', json('POST', input))
export const updateProject = (id, input) => request(`/api/projects/${id}`, json('PUT', input))
export const saveProgress = (id, input) => request(`/api/projects/${id}/progress`, json('PATCH', input))
export const deleteProject = (id) => request(`/api/projects/${id}`, { method: 'DELETE' })

// Stash materials
export const listMaterials = ({ type, search, low } = {}) =>
  request(`/api/materials${query({ type, search, low: low ? 'true' : '' })}`)
export const createMaterial = (input) => request('/api/materials', json('POST', input))
export const updateMaterial = (id, input) => request(`/api/materials/${id}`, json('PUT', input))
export const deleteMaterial = (id) => request(`/api/materials/${id}`, { method: 'DELETE' })

// Community posts
export const listPosts = ({ search, saved } = {}) =>
  request(`/api/posts${query({ search, saved: saved ? 'true' : '' })}`)
export const createPost = (input) => request('/api/posts', json('POST', input))
export const likePost = (id) => request(`/api/posts/${id}/like`, { method: 'POST' })
export const setPostSaved = (id, saved) => request(`/api/posts/${id}/saved`, json('PUT', { saved }))
export const deletePost = (id) => request(`/api/posts/${id}`, { method: 'DELETE' })

// Comments
export const listComments = (postId) => request(`/api/posts/${postId}/comments`)
export const createComment = (postId, input) => request(`/api/posts/${postId}/comments`, json('POST', input))
export const deleteComment = (id) => request(`/api/comments/${id}`, { method: 'DELETE' })

// Counters
export const listCounters = (projectId) => request(`/api/projects/${projectId}/counters`)
export const createCounter = (projectId, input) => request(`/api/projects/${projectId}/counters`, json('POST', input))
export const updateCounter = (id, input) => request(`/api/counters/${id}`, json('PUT', input))
export const setCounterValue = (id, value) => request(`/api/counters/${id}`, json('PATCH', { value }))
export const deleteCounter = (id) => request(`/api/counters/${id}`, { method: 'DELETE' })

// Reminders
export const listReminders = (projectId) => request(`/api/projects/${projectId}/reminders`)
export const createReminder = (projectId, input) => request(`/api/projects/${projectId}/reminders`, json('POST', input))
export const deleteReminder = (id) => request(`/api/reminders/${id}`, { method: 'DELETE' })

// Patterns. Uploads send the raw file as the body, not JSON.
export const listPatterns = (projectId) => request(`/api/projects/${projectId}/patterns`)
export async function uploadPattern(projectId, file, name) {
  return request(`/api/projects/${projectId}/patterns`, {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-File-Name': encodeURIComponent(name ?? file.name) },
    body: file,
  })
}
export const patternFileUrl = (pattern) => `${BASE}/api/patterns/${pattern.id}/file`
export const savePatternMarks = (id, marks) => request(`/api/patterns/${id}/marks`, json('PUT', marks))
export const deletePattern = (id) => request(`/api/patterns/${id}`, { method: 'DELETE' })

// Charts
export const listCharts = () => request('/api/charts')
export const createChart = (input) => request('/api/charts', json('POST', input))
export const updateChart = (id, input) => request(`/api/charts/${id}`, json('PUT', input))
export const deleteChart = (id) => request(`/api/charts/${id}`, { method: 'DELETE' })

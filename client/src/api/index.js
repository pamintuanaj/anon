// The only file components import from. One build-time variable picks the
// implementation: VITE_USE_MOCK_API=false uses the Express API, anything else
// (including unset) uses the browser-only demo.
//
// Both are imported statically on purpose: `await import()` at the top level
// fails to build on Vite's default browser target.

import * as mockApi from './mockApi.js'
import * as httpApi from './httpApi.js'

export const USING_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'

const api = USING_MOCK_API ? mockApi : httpApi

export const {
  listProjects, getProject, createProject, updateProject, saveProgress, deleteProject,
  listMaterials, createMaterial, updateMaterial, deleteMaterial,
  listPosts, createPost, likePost, setPostSaved, deletePost,
  listComments, createComment, deleteComment,
  listCounters, createCounter, updateCounter, setCounterValue, deleteCounter,
  listReminders, createReminder, deleteReminder,
  listPatterns, uploadPattern, patternFileUrl, savePatternMarks, deletePattern,
  listCharts, createChart, updateChart, deleteChart,
} = api

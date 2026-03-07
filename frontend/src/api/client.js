import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || '/api'
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sstg_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sstg_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login', new URLSearchParams({ username, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}

// ── Teachers ─────────────────────────────────────────────────────────────────
export const teachersAPI = {
  list: () => api.get('/teachers'),
  get: (id) => api.get(`/teachers/${id}`),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  delete: (id) => api.delete(`/teachers/${id}`),
  assignSubjects: (id, subject_ids) => api.post(`/teachers/${id}/subjects`, { subject_ids }),
  schedule: (id, draft_id) => api.get(`/teachers/${id}/schedule?draft_id=${draft_id}`),
}

// ── Subjects ─────────────────────────────────────────────────────────────────
export const subjectsAPI = {
  list: () => api.get('/subjects'),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
}

// ── Classes ──────────────────────────────────────────────────────────────────
export const classesAPI = {
  list: () => api.get('/classes'),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
}

// ── Schedules ─────────────────────────────────────────────────────────────────
export const schedulesAPI = {
  generate: (draft_count = 3, seeds = null) => api.post('/schedule/generate', { draft_count, seeds }),
  reshuffle: (draft_id, class_ids = null, keep_locked = true) =>
    api.post('/schedule/reshuffle', { draft_id, class_ids, keep_locked }),
  drafts: () => api.get('/schedule/drafts'),
  getDraft: (id) => api.get(`/schedule/drafts/${id}`),
  lockSlot: (slot_id, locked) => api.post('/schedule/lock', { slot_id, locked }),
  activate: (id) => api.put(`/schedule/drafts/${id}/activate`),
  deleteDraft: (id) => api.delete(`/schedule/drafts/${id}`),
  validate:   (id) => api.get(`/schedule/drafts/${id}/validate`),
  moveSlot:   (slot_id, new_day, new_period) => api.post('/schedule/move',  { slot_id, new_day, new_period }),
  swapSlots:  (slot_a_id, slot_b_id) => api.post('/schedule/swap', { slot_a_id, slot_b_id }),
}

// ── Export ────────────────────────────────────────────────────────────────────
export const exportAPI = {
  draftPdf: (draft_id) =>
    api.get(`/export/draft/${draft_id}/pdf`, { responseType: 'blob' }),
  teacherPdf: (teacher_id, draft_id) =>
    api.get(`/export/teacher/${teacher_id}/pdf?draft_id=${draft_id}`, { responseType: 'blob' }),
  emailTeacher: (teacher_id, draft_id, custom_message = '') =>
    api.post('/export/email/teacher', { teacher_id, draft_id, custom_message }),
}

import axios from 'axios'

// ── API base URL resolution ───────────────────────────────────────────────────
// Priority:
//   1. VITE_API_URL build-time env var  (set in Render frontend env vars)
//   2. window.SSTG_API_URL              (injectable at runtime via index.html)
//   3. Auto-detect: if frontend is on *.onrender.com, swap "frontend" for
//      "backend" in the hostname to find the sibling backend service
//   4. Same-origin /api fallback        (works only in local dev with Vite proxy)

function resolveBaseURL() {
  // 1. Build-time env var (most reliable — set VITE_API_URL in Render)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  // 2. Runtime override (useful for testing without a rebuild)
  if (typeof window !== 'undefined' && window.SSTG_API_URL) {
    return window.SSTG_API_URL
  }

  // 3. Auto-detect sibling Render service
  // Render names services like: sstg-frontend.onrender.com / sstg-backend.onrender.com
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host.endsWith('.onrender.com')) {
      // Replace "frontend" with "backend" in the subdomain
      const backendHost = host.replace('frontend', 'backend')
      if (backendHost !== host) {
        return `https://${backendHost}`
      }
      // Fallback: replace last segment before .onrender.com
      // e.g. smartadmin.onrender.com → smartadmin-api.onrender.com
      const parts = host.split('.')
      parts[0] = parts[0] + '-api'
      return `https://${parts.join('.')}`
    }
  }

  // 4. Same-origin /api — works in local dev (Vite proxy) only
  return '/api'
}

const BASE = resolveBaseURL()

// Log in dev so you can confirm which URL is being used
if (import.meta.env.DEV) {
  console.log('[SSTG] API base URL:', BASE)
}

const api = axios.create({ baseURL: BASE })

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

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login', new URLSearchParams({ username, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}

// ── Teachers ──────────────────────────────────────────────────────────────────
export const teachersAPI = {
  list:           ()            => api.get('/teachers'),
  get:            (id)          => api.get(`/teachers/${id}`),
  create:         (data)        => api.post('/teachers', data),
  update:         (id, data)    => api.put(`/teachers/${id}`, data),
  delete:         (id)          => api.delete(`/teachers/${id}`),
  assignSubjects: (id, ids)     => api.post(`/teachers/${id}/subjects`, { subject_ids: ids }),
  schedule:       (id, draft)   => api.get(`/teachers/${id}/schedule?draft_id=${draft}`),
}

// ── Subjects ──────────────────────────────────────────────────────────────────
export const subjectsAPI = {
  list:   ()         => api.get('/subjects'),
  create: (data)     => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id)       => api.delete(`/subjects/${id}`),
}

// ── Classes ───────────────────────────────────────────────────────────────────
export const classesAPI = {
  list:   ()         => api.get('/classes'),
  create: (data)     => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id)       => api.delete(`/classes/${id}`),
}

// ── Schedules ─────────────────────────────────────────────────────────────────
export const schedulesAPI = {
  generate:    (draft_count = 3, seeds = null) =>
                 api.post('/schedule/generate', { draft_count, seeds }),
  reshuffle:   (draft_id, class_ids = null, keep_locked = true) =>
                 api.post('/schedule/reshuffle', { draft_id, class_ids, keep_locked }),
  drafts:      ()               => api.get('/schedule/drafts'),
  getDraft:    (id)             => api.get(`/schedule/drafts/${id}`),
  lockSlot:    (slot_id, locked)=> api.post('/schedule/lock', { slot_id, locked }),
  activate:    (id)             => api.put(`/schedule/drafts/${id}/activate`),
  deleteDraft: (id)             => api.delete(`/schedule/drafts/${id}`),
  validate:    (id)             => api.get(`/schedule/drafts/${id}/validate`),
  moveSlot:    (slot_id, new_day, new_period) =>
                 api.post('/schedule/move', { slot_id, new_day, new_period }),
  swapSlots:   (slot_a_id, slot_b_id) =>
                 api.post('/schedule/swap', { slot_a_id, slot_b_id }),
}

// ── Export ────────────────────────────────────────────────────────────────────
export const exportAPI = {
  draftPdf:    (draft_id) =>
                 api.get(`/export/draft/${draft_id}/pdf`, { responseType: 'blob' }),
  teacherPdf:  (teacher_id, draft_id) =>
                 api.get(`/export/teacher/${teacher_id}/pdf?draft_id=${draft_id}`, { responseType: 'blob' }),
  emailTeacher:(teacher_id, draft_id, custom_message = '') =>
                 api.post('/export/email/teacher', { teacher_id, draft_id, custom_message }),
}

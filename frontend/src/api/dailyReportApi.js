import api from './axios'

export const getMyReports = () => api.get('/reports').then(r => r.data)
export const submitReport = (data) => api.post('/reports', data).then(r => r.data)
export const getStreak = () => api.get('/reports/streak').then(r => r.data)
export const getAdminReports = (userId, from, to) => {
  const params = {}
  if (userId) params.userId = userId
  if (from) params.from = from
  if (to) params.to = to
  return api.get('/reports/admin', { params }).then(r => r.data)
}

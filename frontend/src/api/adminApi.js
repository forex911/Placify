import api from './axios'

export const getAdminStats = () => api.get('/admin/stats').then(r => r.data)
export const getAdminUsers = () => api.get('/admin/users').then(r => r.data)
export const getAdminAnalytics = () => api.get('/admin/analytics').then(r => r.data)
export const getAdminReports = (userId) => {
  const params = userId ? { userId } : {}
  return api.get('/admin/reports', { params }).then(r => r.data)
}
export const getAdminSubjects = () => api.get('/admin/subjects').then(r => r.data)
export const enableUser = (id) => api.put(`/admin/users/${id}/enable`).then(r => r.data)
export const disableUser = (id) => api.put(`/admin/users/${id}/disable`).then(r => r.data)
export const deleteUser = (id) => api.delete(`/admin/users/${id}`).then(r => r.data)

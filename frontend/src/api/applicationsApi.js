import api from './axios'

export const getApplications = (status) => {
  const params = status ? { status } : {}
  return api.get('/applications', { params }).then(r => r.data)
}
export const getApplication = (id) => api.get(`/applications/${id}`).then(r => r.data)
export const createApplication = (data) => api.post('/applications', data).then(r => r.data)
export const updateApplication = (id, data) => api.put(`/applications/${id}`, data).then(r => r.data)
export const deleteApplication = (id) => api.delete(`/applications/${id}`).then(r => r.data)

import api from './axios'

export const getSubjects = () => api.get('/subjects').then(r => r.data)
export const updateSubject = (subject, data) => api.put(`/subjects/${subject}`, data).then(r => r.data)
export const getAdminSubjects = () => api.get('/subjects/admin/all').then(r => r.data)

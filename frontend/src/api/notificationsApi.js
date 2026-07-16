import api from './axios'

export const getNotifications = () => api.get('/notifications').then(r => r.data)
export const getNotificationCount = () => api.get('/notifications/count').then(r => r.data)
export const markAsRead = (id) => api.put(`/notifications/${id}/read`).then(r => r.data)
export const markAllAsRead = () => api.put('/notifications/read-all').then(r => r.data)
export const generateNotifications = () => api.post('/notifications/generate').then(r => r.data)

import api from './axios'

export const getLeetCodeProfile = () => api.get('/leetcode').then(r => r.data)
export const upsertLeetCodeProfile = (data) => api.put('/leetcode', data).then(r => r.data)

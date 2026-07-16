import api from './axios'

export const getNotes = () =>
  api.get('/notes').then(r => r.data)

export const getNoteById = (id) =>
  api.get(`/notes/${id}`).then(r => r.data)

export const createNote = (data) =>
  api.post('/notes', data).then(r => r.data)

export const updateNote = (id, data) =>
  api.put(`/notes/${id}`, data).then(r => r.data)

export const deleteNote = (id) =>
  api.delete(`/notes/${id}`)

import api from './axios'

export const getCalendarEvents = () =>
  api.get('/calendar').then(r => r.data)

export const getCalendarEventsInRange = (from, to) =>
  api.get('/calendar/range', { params: { from, to } }).then(r => r.data)

export const createCalendarEvent = (dto) =>
  api.post('/calendar', dto).then(r => r.data)

export const updateCalendarEvent = (id, dto) =>
  api.put(`/calendar/${id}`, dto).then(r => r.data)

export const deleteCalendarEvent = (id) =>
  api.delete(`/calendar/${id}`).then(r => r.data)

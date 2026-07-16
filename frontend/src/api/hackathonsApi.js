import api from './axios'

export const getHackathons = async () => {
  const response = await api.get('/hackathons')
  return response.data
}

export const createHackathon = async (hackathonData) => {
  const response = await api.post('/hackathons', hackathonData)
  return response.data
}

export const updateHackathon = async (id, hackathonData) => {
  const response = await api.put(`/hackathons/${id}`, hackathonData)
  return response.data
}

export const deleteHackathon = async (id) => {
  const response = await api.delete(`/hackathons/${id}`)
  return response.data
}

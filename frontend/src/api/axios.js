import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies as backup auth
})

// —— Request interceptor: attach JWT Bearer token ——————————————————————————
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('placify_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// —— Response interceptor: handle errors with debounced 401 redirect ——————
let isRedirecting = false

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Auto-logout on 401 Unauthorized or 403 Forbidden (token expired, invalid, or user disabled)
    const isAuthError = error.response?.status === 401 || error.response?.status === 403
    if (isAuthError && window.location.pathname !== '/login' && !isRedirecting) {
      isRedirecting = true
      localStorage.removeItem('placify_token')
      localStorage.removeItem('placify_user')
      // Debounce: wait briefly before redirecting so parallel auth errors don't cause chaos
      setTimeout(() => {
        window.location.href = '/login'
        setTimeout(() => { isRedirecting = false }, 2000)
      }, 100)
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

export default api

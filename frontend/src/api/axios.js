import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with every request
})

// —— Response interceptor: handle errors with debounced 401 redirect ——————
let isRedirecting = false

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Auto-logout on 401 Unauthorized (token expired, invalid, or user disabled)
    if (error.response?.status === 401 && window.location.pathname !== '/login' && !isRedirecting) {
      isRedirecting = true
      localStorage.removeItem('placify_user')
      // Debounce: wait briefly before redirecting so parallel 401s don't cause chaos
      setTimeout(() => {
        window.location.href = '/login'
        // Reset flag after redirect starts
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

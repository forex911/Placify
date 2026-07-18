import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount: restore user profile from localStorage (for UI state only)
  // The actual authentication is handled by the HttpOnly cookie
  useEffect(() => {
    const savedUser = localStorage.getItem('placify_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('placify_user')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    // Server sets HttpOnly cookie automatically — we only store user data for UI
    const { userId, username, role } = res.data
    const userObj = { userId, username, email, role }
    localStorage.setItem('placify_user', JSON.stringify(userObj))
    setUser(userObj)
    return userObj
  }, [])

  const register = useCallback(async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password })
    // Server sets HttpOnly cookie automatically — we only store user data for UI
    const { userId, role } = res.data
    const userObj = { userId, username, email, role }
    localStorage.setItem('placify_user', JSON.stringify(userObj))
    setUser(userObj)
    return userObj
  }, [])

  const logout = useCallback(async () => {
    try {
      // Clear the HttpOnly cookie on the server
      await api.post('/auth/logout')
    } catch (e) {
      // Even if the server call fails, clear local state
      console.warn('Logout API call failed', e)
    }
    localStorage.removeItem('placify_user')
    setUser(null)
  }, [])

  const isAdmin = useCallback(() => user?.role === 'ADMIN', [user])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

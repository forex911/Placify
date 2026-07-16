import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount: restore user from localStorage
  useEffect(() => {
    const token = localStorage.getItem('placify_token')
    const savedUser = localStorage.getItem('placify_user')
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('placify_token')
        localStorage.removeItem('placify_user')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, userId, username, role } = res.data
    const userObj = { userId, username, email, role, token }
    localStorage.setItem('placify_token', token)
    localStorage.setItem('placify_user', JSON.stringify(userObj))
    setUser(userObj)
    return userObj
  }, [])

  const register = useCallback(async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password })
    const { token, userId, role } = res.data
    const userObj = { userId, username, email, role, token }
    localStorage.setItem('placify_token', token)
    localStorage.setItem('placify_user', JSON.stringify(userObj))
    setUser(userObj)
    return userObj
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('placify_token')
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

import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Sidebar from './components/Sidebar'
import NotificationBell from './components/NotificationBell'
import Dashboard from './pages/Dashboard'
import Applications from './pages/Applications'
import DsaTracker from './pages/DsaTracker'
import StudyTasks from './pages/StudyTasks'
import Notes from './pages/Notes'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import UserProfile from './pages/UserProfile'
import SubjectProgress from './pages/SubjectProgress'
import Hackathons from './pages/Hackathons'
import LeetCode from './pages/LeetCode'

function HeaderProfileAvatar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  if (!user) return null
  const initials = user.username ? user.username.slice(0, 2).toUpperCase() : '??'
  return (
    <button
      className="header-avatar"
      onClick={() => navigate('/profile')}
      title="Profile"
      style={{ padding: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {user.profilePicture ? (
        <img src={user.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        initials
      )}
    </button>
  )
}

function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true'
  })

  const toggleCollapse = () => {
    setCollapsed(c => {
      localStorage.setItem('sidebar-collapsed', String(!c))
      return !c
    })
  }

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-is-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />
      <main className="main-content">
        <header className="top-header">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <NotificationBell />
            <HeaderProfileAvatar />
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}

function SetupRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.setupCompleted) return <Navigate to="/dashboard" replace />
  return children
}

function FullySetupRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!user.setupCompleted) return <Navigate to="/complete-setup" replace />
  return children
}

import { GoogleOAuthProvider } from '@react-oauth/google'

import CompleteSetup from './pages/CompleteSetup'

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--card-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/complete-setup" element={<SetupRoute><CompleteSetup /></SetupRoute>} />

            {/* Protected user routes */}
            <Route path="/dashboard" element={<FullySetupRoute><AppLayout><Dashboard /></AppLayout></FullySetupRoute>} />
            <Route path="/applications" element={<FullySetupRoute><AppLayout><Applications /></AppLayout></FullySetupRoute>} />
            <Route path="/dsa" element={<FullySetupRoute><AppLayout><DsaTracker /></AppLayout></FullySetupRoute>} />
            <Route path="/subjects" element={<FullySetupRoute><AppLayout><SubjectProgress /></AppLayout></FullySetupRoute>} />
            <Route path="/tasks" element={<FullySetupRoute><AppLayout><StudyTasks /></AppLayout></FullySetupRoute>} />
            <Route path="/hackathons" element={<FullySetupRoute><AppLayout><Hackathons /></AppLayout></FullySetupRoute>} />
            <Route path="/leetcode" element={<FullySetupRoute><AppLayout><LeetCode /></AppLayout></FullySetupRoute>} />
            <Route path="/notes" element={<FullySetupRoute><AppLayout><Notes /></AppLayout></FullySetupRoute>} />
            <Route path="/profile" element={<FullySetupRoute><AppLayout><UserProfile /></AppLayout></FullySetupRoute>} />

            {/* Admin-only route */}
            <Route path="/admin" element={<AdminRoute><AppLayout><AdminDashboard /></AppLayout></AdminRoute>} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}

export default App

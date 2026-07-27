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
    >
      {initials}
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

function App() {
  return (
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

          {/* Protected user routes */}
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/applications" element={<ProtectedRoute><AppLayout><Applications /></AppLayout></ProtectedRoute>} />
          <Route path="/dsa" element={<ProtectedRoute><AppLayout><DsaTracker /></AppLayout></ProtectedRoute>} />
          <Route path="/subjects" element={<ProtectedRoute><AppLayout><SubjectProgress /></AppLayout></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><AppLayout><StudyTasks /></AppLayout></ProtectedRoute>} />
          <Route path="/hackathons" element={<ProtectedRoute><AppLayout><Hackathons /></AppLayout></ProtectedRoute>} />
          <Route path="/leetcode" element={<ProtectedRoute><AppLayout><LeetCode /></AppLayout></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute><AppLayout><Notes /></AppLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><AppLayout><UserProfile /></AppLayout></ProtectedRoute>} />

          {/* Admin-only route */}
          <Route path="/admin" element={<AdminRoute><AppLayout><AdminDashboard /></AppLayout></AdminRoute>} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

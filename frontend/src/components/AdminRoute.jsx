import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loader from './Loader'
import { Ban } from 'lucide-react'

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) return <div className="page-container"><Loader message="Checking permissions..." /></div>

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin()) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><Ban size={64} color="#ef4444" /></div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)' }}>You need admin privileges to access this page.</p>
        </div>
      </div>
    )
  }

  return children
}

export default AdminRoute

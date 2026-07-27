import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { LogIn, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CompleteSetup() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { user, completeSetupContext } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (username.length < 3) {
      toast.error('Username must be at least 3 characters long')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/auth/complete-setup', { username, password })
      const { userId, email, role, profilePicture, setupCompleted } = res.data
      
      // Update local storage and context
      completeSetupContext({
        userId,
        username: res.data.username,
        email,
        role,
        profilePicture,
        setupCompleted
      })
      
      toast.success('Account setup complete!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete setup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <LogIn size={28} />
          </div>
          <h1>Complete Setup</h1>
          <p>Welcome, {user?.email}! Choose a username and password to finish your account setup.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Choose Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. johndoe"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Create Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Complete Setup'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { Sparkles, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CompleteSetup() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const { user, completeSetupContext } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters long')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/auth/complete-setup', { username, password })
      const { userId, email, role, profilePicture, setupCompleted } = res.data
      
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
      setError(err.response?.data?.message || 'Failed to complete setup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-split">
      {/* Left — Form */}
      <div className="auth-split-left">
        <div className="auth-split-form">
          <div className="auth-split-logo">
            <div className="auth-split-logo-icon"><img src="/faviconblacked-32x32.png" alt="Placify" style={{ width: 28, height: 28, objectFit: 'contain' }} /></div>
            <span className="auth-split-logo-text">Placify</span>
          </div>

          <h1 className="auth-split-title">Complete Setup</h1>
          <p className="auth-split-subtitle">
            Welcome, {user?.email}! Choose a username and password to finish setting up your account.
          </p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px', fontSize: '0.8rem' }}>
              <AlertCircle size={16} style={{ marginRight: '8px' }} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} id="complete-setup-form">
            <div className="auth-split-field">
              <label htmlFor="setup-username">Username</label>
              <input
                id="setup-username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="auth-split-field">
              <label htmlFor="setup-password">Password</label>
              <input
                id="setup-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <button
              id="setup-submit-btn"
              type="submit"
              className="auth-split-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner-sm" />
                  Setting up...
                </span>
              ) : (
                'Complete Setup'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right — Hero */}
      <div className="auth-split-right">
        <div className="auth-split-hero">
          <img src="/login.png" alt="Setup illustration" className="auth-hero-img" draggable="false" />
          <div className="auth-hero-content">
            <h2>Almost there!</h2>
            <h2>Finish setting up your</h2>
            <h2><span className="auth-hero-underline">Placify</span> account</h2>
            <p className="auth-hero-desc">
              Pick a username and create a password so you can log in anytime — even without Google.
            </p>
          </div>
          <div className="auth-hero-badge">
            <Sparkles size={14} />
            <span>Placement Management Platform</span>
          </div>
        </div>
      </div>
    </div>
  )
}

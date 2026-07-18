import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sparkles, AlertCircle } from 'lucide-react'

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await register(form.username, form.email, form.password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
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
            <div className="auth-split-logo-icon"><Sparkles size={22} /></div>
            <span className="auth-split-logo-text">Placify</span>
          </div>

          <h1 className="auth-split-title">Create Account</h1>
          <p className="auth-split-subtitle">Start tracking your placement journey</p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px', fontSize: '0.8rem' }}>
              <AlertCircle size={16} style={{ marginRight: '8px' }} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} id="register-form">
            <div className="auth-split-field">
              <label htmlFor="reg-username">Username</label>
              <input
                id="reg-username"
                type="text"
                placeholder="Enter your username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
                minLength={3}
              />
            </div>

            <div className="auth-split-field">
              <label htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div className="auth-split-field">
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>

            <div className="auth-split-field">
              <label htmlFor="reg-confirm">Confirm Password</label>
              <input
                id="reg-confirm"
                type="password"
                placeholder="Repeat your password"
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                required
              />
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              className="auth-split-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner-sm" />
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="auth-split-footer">
            Already have an account?{' '}
            <Link to="/login" className="auth-split-link">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right — Hero */}
      <div className="auth-split-right">
        <div className="auth-split-hero">
          <img src="/signup.png" alt="Signup illustration" className="auth-hero-img" draggable="false" />
          <div className="auth-hero-content">
            <h2>Get started with</h2>
            <h2>your <span className="auth-hero-underline">Placify</span></h2>
            <h2>account today</h2>
            <p className="auth-hero-desc">
              Join thousands of students tracking their placements, hackathons, and career progress.
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

export default Register


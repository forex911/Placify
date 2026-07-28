import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GoogleLogin } from '@react-oauth/google'
import { Sparkles, AlertCircle, ArrowRight } from 'lucide-react'

function Login() {
  const { login, googleLogin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setError(null)
    setLoading(true)
    try {
      const user = await googleLogin(credentialResponse.credential)
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Google Login failed')
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

          <h1 className="auth-split-title">Sign In</h1>
          <p className="auth-split-subtitle">Welcome back! Please enter your details</p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px', fontSize: '0.8rem' }}>
              <AlertCircle size={16} style={{ marginRight: '8px' }} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} id="login-form">
            <div className="auth-split-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-split-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="auth-split-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner-sm" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            <span style={{ padding: '0 12px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Login Failed')}
              theme="filled_black"
              text="signin_with"
              shape="pill"
            />
          </div>

          <p className="auth-split-footer" style={{ marginTop: '24px' }}>
            Don't have an account?{' '}
            <Link to="/register" className="auth-split-link">Sign up</Link>
          </p>
        </div>
      </div>

      {/* Right — Hero */}
      <div className="auth-split-right">
        <div className="auth-split-hero">
          <img src="/login.png" alt="Login illustration" className="auth-hero-img" draggable="false" />
          <div className="auth-hero-content">
            <h2>Welcome back!</h2>
            <h2>Please sign in to your</h2>
            <h2><span className="auth-hero-underline">Placify</span> account</h2>
            <p className="auth-hero-desc">
              Track your placements, manage applications, and stay ahead in your career journey.
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

export default Login


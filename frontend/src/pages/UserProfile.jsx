import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'
import { User, AlertTriangle, Shield, Calendar, LogOut, BarChart3, FileText, Monitor, CheckSquare, PenTool, Code2, Edit2, Check, X, Download, Globe, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

function UserProfile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [editUsernameVal, setEditUsernameVal] = useState('')
  const [savingUsername, setSavingUsername] = useState(false)
  const { updateProfileContext } = useAuth()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile')
        setProfile(res.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const formatDate = (str) => {
    if (!str) return '—'
    return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const handleSaveUsername = async () => {
    if (!editUsernameVal || editUsernameVal.trim() === '') return
    if (editUsernameVal === profile.username) {
      setIsEditingUsername(false)
      return
    }

    setSavingUsername(true)
    try {
      const res = await api.put('/profile', { username: editUsernameVal })
      setProfile(prev => ({ ...prev, username: res.data.username }))
      updateProfileContext(res.data.username)
      setIsEditingUsername(false)
      toast.success(res.data.message || 'Username updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update username')
    } finally {
      setSavingUsername(false)
    }
  }

  const getInitials = (name) => name ? name.slice(0, 2).toUpperCase() : '??'

  if (loading) return <div className="page-container"><Loader message="Loading profile..." /></div>

  if (error) return (
    <div className="page-container">
      <div className="alert alert-error"><AlertTriangle size={16} /> {error}</div>
    </div>
  )

  const stats = profile?.stats || {}

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title"><User size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />My Profile</h1>
          <p className="page-subtitle">Your account details and personal stats</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Profile Card */}
        <div className="card profile-card">
          {profile?.profilePicture ? (
            <img src={profile.profilePicture} alt="Profile" className="profile-avatar-lg-img" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 16px', display: 'block', border: '3px solid var(--border)' }} />
          ) : (
            <div className="profile-avatar-lg">
              {getInitials(profile?.username)}
            </div>
          )}
          
          {isEditingUsername ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
              <input
                autoFocus
                type="text"
                className="input"
                value={editUsernameVal}
                onChange={(e) => setEditUsernameVal(e.target.value)}
                style={{ padding: '6px 12px', width: '150px', textAlign: 'center' }}
                disabled={savingUsername}
              />
              <button className="btn btn-primary" onClick={handleSaveUsername} disabled={savingUsername} style={{ padding: '6px', borderRadius: '50%' }}>
                <Check size={16} />
              </button>
              <button className="btn btn-secondary" onClick={() => setIsEditingUsername(false)} disabled={savingUsername} style={{ padding: '6px', borderRadius: '50%' }}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="profile-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {profile?.username}
              <button 
                onClick={() => {
                  setEditUsernameVal(profile?.username || '')
                  setIsEditingUsername(true)
                }} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                title="Edit Username"
              >
                <Edit2 size={16} />
              </button>
            </div>
          )}

          <div className="profile-email">{profile?.email}</div>
          <div className={`sidebar-role-badge ${profile?.role === 'ADMIN' ? 'admin' : 'user'}`} style={{ marginTop: '12px', display: 'inline-block' }}>
            {profile?.role === 'ADMIN' ? <><Shield size={12} style={{marginRight: 4}} /> Admin</> : <><User size={12} style={{marginRight: 4}} /> User</>}
          </div>
          <div className="profile-joined">
            <Calendar size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Joined {formatDate(profile?.createdAt)}
          </div>

          <div style={{ marginTop: '32px', width: '100%', padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', textAlign: 'left', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Extension API Key</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <input 
                type="text" 
                value={profile?.apiKey || ''} 
                readOnly 
                className="input" 
                style={{ flex: 1, minWidth: 0, padding: '10px 12px', fontSize: '0.9rem', background: 'var(--card-bg)', fontFamily: 'monospace', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(profile?.apiKey || '');
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="btn btn-primary" 
                style={{ padding: '10px 16px', fontSize: '0.9rem', width: '80px' }}
                title="Copy to clipboard"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button 
              onClick={async () => {
                if (window.confirm("Regenerate API Key? This will break any existing extensions using the old key.")) {
                  try {
                    const res = await api.post('/profile/api-key/regenerate');
                    setProfile(prev => ({ ...prev, apiKey: res.data.apiKey }));
                  } catch (e) {
                    console.error("Failed to regenerate API Key", e);
                  }
                }
              }}
              className="btn btn-secondary" 
              style={{ width: '100%', padding: '10px', fontSize: '0.85rem', color: 'var(--accent-rose)', borderColor: 'var(--border-color)', backgroundColor: 'transparent' }}
            >
              Regenerate Key
            </button>
          </div>

          <div style={{ marginTop: '20px', width: '100%', padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', textAlign: 'left', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Browser Extension</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
              Save job applications directly from any job board with our Chrome extension.
            </p>
            <Link
              to="/extension"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none' }}
            >
              <Chrome size={16} /> Get Extension <ArrowRight size={14} />
            </Link>
          </div>

          <button
            id="profile-logout-btn"
            className="btn btn-secondary"
            onClick={handleLogout}
            style={{ marginTop: '24px', width: '100%' }}
          >
            <LogOut size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Logout
          </button>
        </div>

        {/* Personal Stats */}
        <div className="profile-stats-panel">
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <h2 className="card-title"><BarChart3 size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Your Stats</h2>
            </div>
            <div className="profile-stats-grid">
              {[
                { icon: <FileText size={20} />, value: stats.applicationCount ?? 0, label: 'Applications', color: '#6366f1' },
                { icon: <Monitor size={20} />, value: stats.dsaTopicCount ?? 0, label: 'DSA Topics', color: '#10b981' },
                { icon: <Code2 size={20} />, value: `${stats.averageDsaProgress ?? 0}%`, label: 'Avg DSA Progress', color: '#f59e0b', isText: true },
                { icon: <CheckSquare size={20} />, value: stats.taskCount ?? 0, label: 'Study Tasks', color: '#06b6d4' },
                { icon: <PenTool size={20} />, value: stats.noteCount ?? 0, label: 'Notes', color: '#8b5cf6' },
              ].map((s, i) => (
                <div key={i} className="profile-stat-item" style={{ '--stat-color': s.color }}>
                  <div className="profile-stat-icon">{s.icon}</div>
                  <div className="profile-stat-value">
                    {s.isText ? s.value : s.value}
                  </div>
                  <div className="profile-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* DSA Progress breakdown */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title"><Code2 size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />DSA Progress</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Avg: {stats.averageDsaProgress ?? 0}%
              </span>
            </div>
            <div className="profile-dsa-bar">
              <div className="profile-dsa-fill" style={{ width: `${stats.averageDsaProgress ?? 0}%` }} />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px' }}>
              {stats.dsaTopicCount > 0
                ? `You're tracking ${stats.dsaTopicCount} DSA topics with an average progress of ${stats.averageDsaProgress}%.`
                : 'Start tracking DSA topics to see your progress here!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile

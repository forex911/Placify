import { useEffect, useState } from 'react'
import { getAdminStats, getAdminUsers, getAdminAnalytics, getAdminReports, enableUser, disableUser, deleteUser } from '../api/adminApi'
import { getAdminSubjects } from '../api/subjectApi'
import Loader from '../components/Loader'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import toast from 'react-hot-toast'

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
const TABS = ['Overview', 'Users', 'Reports', 'Subjects']

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [reports, setReports] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [userSearch, setUserSearch] = useState('')

  const loadAll = async () => {
    try {
      setLoading(true)
      const [s, u, a, r, sub] = await Promise.all([
        getAdminStats(), getAdminUsers(), getAdminAnalytics(),
        getAdminReports(), getAdminSubjects()
      ])
      setStats(s); setUsers(u); setAnalytics(a); setReports(r); setSubjects(sub)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [])

  const handleEnable = async (id) => {
    try { await enableUser(id); toast.success('User enabled'); loadAll() }
    catch (e) { toast.error(e.message) }
  }

  const handleDisable = async (id) => {
    if (!window.confirm('Disable this user?')) return
    try { await disableUser(id); toast.success('User disabled'); loadAll() }
    catch (e) { toast.error(e.message) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this user and ALL their data?')) return
    try { await deleteUser(id); toast.success('User deleted'); loadAll() }
    catch (e) { toast.error(e.message) }
  }

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  )

  const activityData = analytics?.userActivity?.slice(0, 8).map(u => ({
    name: u.username,
    Reports: u.reportCount || 0,
    DSA: u.dsaTopics || 0,
    Apps: u.applications || 0,
  })) || []

  const userStatusPie = stats ? [
    { name: 'Active', value: Number(stats.activeUsers || 0) },
    { name: 'Disabled', value: Number(stats.inactiveUsers || 0) },
  ] : []

  if (loading) return <div className="page-container"><Loader message="Loading admin dashboard..." /></div>

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Admin Dashboard</h1>
          <p className="page-subtitle">System overview and user management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="dsa-filter-tabs" style={{ marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t} className={`dsa-filter-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'Overview' && stats && (
        <>
          {/* Stat Cards */}
          <div className="stats-grid">
            {[
              { icon: '👥', label: 'Total Users',       value: stats.totalUsers,           grad: 'linear-gradient(90deg,#6366f1,#8b5cf6)' },
              { icon: '✅', label: 'Active Users',       value: stats.activeUsers,           grad: 'linear-gradient(90deg,#10b981,#34d399)' },
              { icon: '📋', label: 'Total Applications', value: stats.totalApplications,     grad: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },
              { icon: '📝', label: 'Daily Reports',      value: stats.totalDailyReports,     grad: 'linear-gradient(90deg,#06b6d4,#6366f1)' },
              { icon: '💻', label: 'Avg DSA Progress',   value: `${stats.averageDsaProgress}%`, grad: 'linear-gradient(90deg,#8b5cf6,#a78bfa)' },
              { icon: '🧩', label: 'Questions Solved',   value: stats.totalDsaQuestionsSolved, grad: 'linear-gradient(90deg,#ec4899,#f43f5e)' },
            ].map(c => (
              <div key={c.label} className="card" style={{ textAlign: 'center', padding: '20px 12px' }}>
                <div style={{ fontSize: '2rem' }}>{c.icon}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, background: c.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '8px 0' }}>{c.value}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="dashboard-grid" style={{ marginTop: 24 }}>
            <div className="card">
              <div className="card-header"><h2 className="card-title">👥 User Status</h2></div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={userStatusPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value"
                       label={({ name, value }) => `${name}: ${value}`}>
                    {userStatusPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <div className="card-header"><h2 className="card-title">📊 User Activity (Top 8)</h2></div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={activityData} margin={{ left: -25, right: 5, top: 5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 9 }} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 9 }} />
                  <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="Reports" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="DSA" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Apps" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ── USERS TAB ─────────────────────────────────────────────────────────── */}
      {activeTab === 'Users' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">👥 All Users ({users.length})</h2>
            <input className="form-input" style={{ width: 220, padding: '6px 12px' }}
                   placeholder="Search users..." value={userSearch}
                   onChange={e => setUserSearch(e.target.value)} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['User', 'Email', 'Role', 'Status', 'Last Login', 'Apps', 'DSA', 'Reports', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>
                          {u.username?.slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.username}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '0.83rem' }}>{u.email}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className={`dsa-status-badge ${u.role === 'ADMIN' ? 'completed' : 'in-progress'}`}>{u.role}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: u.enabled ? '#10b981' : '#ef4444', fontWeight: 600, fontSize: '0.82rem' }}>
                        {u.enabled ? '🟢 Active' : '🔴 Disabled'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{u.applicationCount}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{u.dsaTopicCount}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{u.reportCount}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {u.role !== 'ADMIN' && (u.enabled ? (
                          <button className="btn" style={{ fontSize: '0.72rem', padding: '4px 10px', background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b44', borderRadius: 6 }}
                                  onClick={() => handleDisable(u.id)}>Disable</button>
                        ) : (
                          <button className="btn" style={{ fontSize: '0.72rem', padding: '4px 10px', background: '#10b98122', color: '#10b981', border: '1px solid #10b98144', borderRadius: 6 }}
                                  onClick={() => handleEnable(u.id)}>Enable</button>
                        ))}
                        {u.role !== 'ADMIN' && (
                          <button className="btn btn-danger" style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                                  onClick={() => handleDelete(u.id)}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── REPORTS TAB ───────────────────────────────────────────────────────── */}
      {activeTab === 'Reports' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📝 All Daily Reports ({reports.length})</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['User', 'Date', 'Hours', 'DSA', 'Aptitude', 'Verbal', 'Rating', 'Topics'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.username || `User ${r.userId}`}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--primary)', fontWeight: 600 }}>{r.reportDate}</td>
                    <td style={{ padding: '10px 12px' }}>{r.hoursStudied}h</td>
                    <td style={{ padding: '10px 12px' }}>{r.dsaQuestionsSolved}</td>
                    <td style={{ padding: '10px 12px' }}>{r.aptitudeQuestionsSolved}</td>
                    <td style={{ padding: '10px 12px' }}>{r.verbalPracticeDone ? '✅' : '❌'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: r.productivityRating >= 8 ? '#10b981' : r.productivityRating >= 5 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>{r.productivityRating}/10</span>
                    </td>
                    <td style={{ padding: '10px 12px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{r.topicsLearned || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SUBJECTS TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'Subjects' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📚 All Subject Progress</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['User', 'Subject', 'Level', 'Progress', 'Topics', 'Last Updated'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{s.username || `User ${s.userId}`}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>{s.subjectDisplayName}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className="dsa-status-badge">{s.level}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar-container" style={{ flex: 1, margin: 0 }}>
                          <div className="progress-bar-fill" style={{ width: `${s.progressPercentage}%` }} />
                        </div>
                        <span style={{ minWidth: 36, fontWeight: 600, color: 'var(--primary)', fontSize: '0.82rem' }}>{s.progressPercentage}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{s.topicsCompleted}/{s.totalTopics}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{s.lastUpdatedDate || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard

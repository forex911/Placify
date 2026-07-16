import { useEffect, useState } from 'react'
import { getLeetCodeProfile, upsertLeetCodeProfile } from '../api/leetcodeApi'
import Loader from '../components/Loader'
import Modal from '../components/Modal'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const DIFFICULTY_COLORS = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444' }

const EMPTY_FORM = {
  username: '',
  totalSolved: 0,
  easySolved: 0,
  mediumSolved: 0,
  hardSolved: 0,
  ranking: '',
}

function LeetCode() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const data = await getLeetCodeProfile()
      setProfile(data?.exists === false ? null : data)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openEdit = () => {
    if (profile) {
      setForm({
        username: profile.username || '',
        totalSolved: profile.totalSolved || 0,
        easySolved: profile.easySolved || 0,
        mediumSolved: profile.mediumSolved || 0,
        hardSolved: profile.hardSolved || 0,
        ranking: profile.ranking || '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = {
        ...form,
        totalSolved: parseInt(form.totalSolved) || 0,
        easySolved: parseInt(form.easySolved) || 0,
        mediumSolved: parseInt(form.mediumSolved) || 0,
        hardSolved: parseInt(form.hardSolved) || 0,
        ranking: form.ranking ? parseInt(form.ranking) : null,
      }
      const updated = await upsertLeetCodeProfile(data)
      setProfile(updated)
      toast.success('LeetCode profile synced!')
      setModalOpen(false)
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const pieData = profile ? [
    { name: 'Easy', value: profile.easySolved || 0 },
    { name: 'Medium', value: profile.mediumSolved || 0 },
    { name: 'Hard', value: profile.hardSolved || 0 },
  ] : []

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">LeetCode Profile 💡</h1>
          <p className="page-subtitle">Track your competitive programming progress</p>
        </div>
        <button className="btn btn-primary" onClick={openEdit}>
          {profile ? '🔄 Update / Sync' : '+ Connect Profile'}
        </button>
      </div>

      {loading ? <Loader message="Loading profile..." /> : !profile ? (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-state-icon">💡</div>
          <div className="empty-state-text">No LeetCode profile connected yet.<br />Click "Connect Profile" to get started!</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openEdit}>Connect Profile</button>
        </div>
      ) : (
        <>
          {/* Profile Header */}
          <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--surface) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>
                💻
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {profile.username}
                </div>
                {profile.ranking && (
                  <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                    🏆 Rank #{profile.ranking?.toLocaleString()}
                  </div>
                )}
                {profile.lastSyncTime && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4 }}>
                    Last synced: {format(new Date(profile.lastSyncTime), 'dd MMM yyyy, HH:mm')}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary)' }}>{profile.totalSolved}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Solved</div>
              </div>
            </div>
          </div>

          {/* Difficulty breakdown + Pie */}
          <div className="dashboard-grid">
            <div className="card">
              <div className="card-header"><h2 className="card-title">📊 Difficulty Breakdown</h2></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                {[
                  { label: 'Easy', value: profile.easySolved, color: '#10b981' },
                  { label: 'Medium', value: profile.mediumSolved, color: '#f59e0b' },
                  { label: 'Hard', value: profile.hardSolved, color: '#ef4444' },
                ].map(d => (
                  <div key={d.label}>
                    <div className="progress-label">
                      <span style={{ color: d.color, fontWeight: 600 }}>{d.label}</span>
                      <span className="progress-percent" style={{ color: d.color }}>{d.value}</span>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{
                        width: `${profile.totalSolved > 0 ? Math.round((d.value / profile.totalSolved) * 100) : 0}%`,
                        background: d.color
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h2 className="card-title">🥧 Distribution</h2></div>
              {profile.totalSolved > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                         paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                         labelLine={false}>
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={DIFFICULTY_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state"><div className="empty-state-text">No solved problems yet</div></div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Edit / Sync Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="LeetCode Profile">
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">LeetCode Username *</label>
            <input className="form-input" type="text" placeholder="your-leetcode-username"
                   value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label" style={{ color: '#10b981' }}>Easy Solved</label>
              <input className="form-input" type="number" min="0" value={form.easySolved}
                     onChange={e => setForm(f => ({ ...f, easySolved: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ color: '#f59e0b' }}>Medium Solved</label>
              <input className="form-input" type="number" min="0" value={form.mediumSolved}
                     onChange={e => setForm(f => ({ ...f, mediumSolved: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ color: '#ef4444' }}>Hard Solved</label>
              <input className="form-input" type="number" min="0" value={form.hardSolved}
                     onChange={e => setForm(f => ({ ...f, hardSolved: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Total Solved</label>
              <input className="form-input" type="number" min="0" value={form.totalSolved}
                     onChange={e => setForm(f => ({ ...f, totalSolved: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Global Ranking (optional)</label>
            <input className="form-input" type="number" min="1" placeholder="e.g. 152000"
                   value={form.ranking} onChange={e => setForm(f => ({ ...f, ranking: e.target.value }))} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Syncing...' : '🔄 Sync Profile'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default LeetCode

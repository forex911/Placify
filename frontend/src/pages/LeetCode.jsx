import { useEffect, useState } from 'react'
import api from '../api/axios'
import { getLeetCodeProfile, upsertLeetCodeProfile } from '../api/leetcodeApi'
import Loader from '../components/Loader'
import Modal from '../components/Modal'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import ActivityCalendar from 'react-activity-calendar'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Lightbulb, RefreshCw, Plus, Terminal, Trophy, BarChart3, PieChart as PieChartIcon, Info } from 'lucide-react'

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
  const [fetching, setFetching] = useState(false)
  const [calendarData, setCalendarData] = useState(null)
  const [calendarLoading, setCalendarLoading] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const data = await getLeetCodeProfile()
      setProfile(data?.exists === false ? null : data)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (profile?.username) {
      fetchCalendar(profile.username)
    } else {
      setCalendarData(null)
    }
  }, [profile?.username])

  const fetchCalendar = async (username) => {
    try {
      setCalendarLoading(true)
      const res = await api.get(`/leetcode/fetch/${username}/calendar`)
      if (!res.data.error) {
        const rawObj = JSON.parse(res.data.submissionCalendar || '{}')
        const days = []
        const today = new Date()
        for (let i = 364; i >= 0; i--) {
          const d = new Date(today)
          d.setDate(today.getDate() - i)
          const dateStr = format(d, 'yyyy-MM-dd')
          days.push({ date: dateStr, count: 0, level: 0 })
        }
        
        for (const [unixSec, count] of Object.entries(rawObj)) {
          const dateStr = format(new Date(unixSec * 1000), 'yyyy-MM-dd')
          const day = days.find(d => d.date === dateStr)
          if (day) {
            day.count += count
            if (day.count > 0 && day.count <= 2) day.level = 1
            else if (day.count > 2 && day.count <= 5) day.level = 2
            else if (day.count > 5 && day.count <= 8) day.level = 3
            else if (day.count > 8) day.level = 4
          }
        }
        setCalendarData({
          streak: res.data.streak,
          totalActiveDays: res.data.totalActiveDays,
          data: days,
          totalSubmissions: Object.values(rawObj).reduce((a, b) => a + b, 0)
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCalendarLoading(false)
    }
  }

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

  const handleFetch = async () => {
    let username = form.username;
    if (!username) return toast.error('Please enter a username');
    
    // Handle URLs like https://leetcode.com/u/username or https://leetcode.com/username
    username = username.replace(/.*leetcode\.com\/(u\/)?/, '').replace(/\/.*/, '').trim();
    setForm(f => ({ ...f, username }));
    
    setFetching(true);
    try {
      const res = await api.get(`/leetcode/fetch/${username}`);
      const data = res.data;
      if (data.error) throw new Error(data.message || 'Failed to fetch');
      
      setForm(f => ({
        ...f,
        totalSolved: data.totalSolved || 0,
        easySolved: data.easySolved || 0,
        mediumSolved: data.mediumSolved || 0,
        hardSolved: data.hardSolved || 0,
        ranking: data.ranking || '',
      }));
      toast.success('Stats fetched from LeetCode!');
    } catch (err) {
      toast.error(err.message || 'Could not fetch data. Check username or try again.');
    } finally {
      setFetching(false);
    }
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
          <h1 className="page-title"><Lightbulb size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />LeetCode Profile</h1>
          <p className="page-subtitle">Track your competitive programming progress</p>
        </div>
        <button className="btn btn-primary" onClick={openEdit}>
          {profile ? <><RefreshCw size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Update / Sync</> : <><Plus size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Connect Profile</>}
        </button>
      </div>

      {loading ? <Loader message="Loading profile..." /> : !profile ? (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-state-icon"><Lightbulb size={32} /></div>
          <div className="empty-state-text">No LeetCode profile connected yet.<br />Click "Connect Profile" to get started!</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openEdit}>Connect Profile</button>
        </div>
      ) : (
        <>
          {/* Profile Header */}
          <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--surface) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>
                <Terminal size={32} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {profile.username}
                </div>
                {profile.ranking && (
                  <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                    <Trophy size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Rank #{profile.ranking?.toLocaleString()}
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
              <div className="card-header"><h2 className="card-title"><BarChart3 size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Difficulty Breakdown</h2></div>
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
              <div className="card-header"><h2 className="card-title"><PieChartIcon size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Distribution</h2></div>
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

          {/* Submission Heatmap */}
          <div className="card" style={{ marginTop: 24, padding: '24px', background: '#232323', border: 'none', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: '1.2rem' }}>
                <span style={{ fontWeight: 700 }}>{calendarData?.totalSubmissions || 0}</span> submissions in the past one year <Info size={14} style={{ color: '#888' }} />
              </div>
              <div style={{ fontSize: '0.9rem', color: '#aaa', display: 'flex', gap: 16 }}>
                <span>Total active days: <span style={{ color: '#fff', fontWeight: 600 }}>{calendarData?.totalActiveDays || 0}</span></span>
                <span>Max streak: <span style={{ color: '#fff', fontWeight: 600 }}>{calendarData?.streak || 0}</span></span>
              </div>
            </div>
            {calendarLoading ? (
              <Loader message="Loading calendar..." />
            ) : calendarData ? (
              <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
                <ActivityCalendar
                  data={calendarData.data}
                  theme={{
                    light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
                    dark: ['#383838', '#10b98144', '#10b98188', '#10b981cc', '#10b981'],
                  }}
                  colorScheme="dark"
                  labels={{
                    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                    totalCount: '{{count}} submissions in the past one year',
                    legend: { less: 'Less', more: 'More' }
                  }}
                  hideColorLegend
                  blockSize={12}
                  blockMargin={4}
                  blockRadius={2}
                />
              </div>
            ) : (
              <div style={{ color: '#888', textAlign: 'center', padding: '20px 0' }}>No calendar data available</div>
            )}
          </div>
        </>
      )}

      {/* Edit / Sync Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="LeetCode Profile">
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">LeetCode Username or URL *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" style={{ flex: 1 }} type="text" placeholder="Enter your LeetCode username"
                     value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
              <button type="button" className="btn btn-secondary" onClick={handleFetch} disabled={fetching}>
                {fetching ? 'Fetching...' : 'Fetch Stats'}
              </button>
            </div>
          </div>
          <div className="form-row">
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
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Syncing...' : <><RefreshCw size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Sync Profile</>}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default LeetCode

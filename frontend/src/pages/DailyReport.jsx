import { useEffect, useState } from 'react'
import { getMyReports, submitReport, getStreak } from '../api/dailyReportApi'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'
import Modal from '../components/Modal'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const EMPTY_FORM = {
  reportDate: format(new Date(), 'yyyy-MM-dd'),
  hoursStudied: 0,
  dsaQuestionsSolved: 0,
  topicsLearned: '',
  aptitudeQuestionsSolved: 0,
  verbalPracticeDone: false,
  notes: '',
  productivityRating: 7,
}

function DailyReport() {
  const { user, isAdmin } = useAuth()
  const [reports, setReports] = useState([])
  const [streakData, setStreakData] = useState({ streak: 0, weeklyStudyHours: 0 })
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const [data, sd] = await Promise.all([getMyReports(), getStreak()])
      setReports(data)
      setStreakData(sd)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await submitReport({
        ...form,
        hoursStudied: parseFloat(form.hoursStudied) || 0,
        dsaQuestionsSolved: parseInt(form.dsaQuestionsSolved) || 0,
        aptitudeQuestionsSolved: parseInt(form.aptitudeQuestionsSolved) || 0,
        productivityRating: parseInt(form.productivityRating) || 5,
      })
      toast.success('Report submitted!')
      setModalOpen(false)
      load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const last7 = reports.slice(0, 7).reverse()
  const chartData = last7.map(r => ({
    date: format(new Date(r.reportDate), 'dd MMM'),
    Hours: r.hoursStudied || 0,
    DSA: r.dsaQuestionsSolved || 0,
    Rating: r.productivityRating || 0,
  }))

  const ratingColor = (r) => r >= 8 ? '#10b981' : r >= 5 ? '#f59e0b' : '#ef4444'

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Daily Reports 📝</h1>
          <p className="page-subtitle">Track your daily study progress and maintain consistency</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setModalOpen(true) }}>
          + Today's Report
        </button>
      </div>

      {/* Stat cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
        <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div style={{ fontSize: '2.5rem' }}>🔥</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', margin: '8px 0' }}>{streakData.streak}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Day Streak</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div style={{ fontSize: '2.5rem' }}>⏱️</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', margin: '8px 0' }}>{streakData.weeklyStudyHours}h</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>This Week</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div style={{ fontSize: '2.5rem' }}>📋</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', margin: '8px 0' }}>{reports.length}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Reports</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div style={{ fontSize: '2.5rem' }}>💻</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#8b5cf6', margin: '8px 0' }}>
            {reports.reduce((a, r) => a + (r.dsaQuestionsSolved || 0), 0)}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>DSA Solved Total</div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h2 className="card-title">📊 Last 7 Days Activity</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="Hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="DSA" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Reports Table */}
      {loading ? <Loader message="Loading reports..." /> : reports.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-text">No reports yet. Submit your first daily report!</div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📋 Report History</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Date','Hours','DSA','Aptitude','Verbal','Rating','Topics'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{r.reportDate}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--primary)', fontWeight: 600 }}>{r.hoursStudied}h</td>
                    <td style={{ padding: '10px 12px' }}>{r.dsaQuestionsSolved}</td>
                    <td style={{ padding: '10px 12px' }}>{r.aptitudeQuestionsSolved}</td>
                    <td style={{ padding: '10px 12px' }}>{r.verbalPracticeDone ? '✅' : '❌'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: ratingColor(r.productivityRating), fontWeight: 700 }}>{r.productivityRating}/10</span>
                    </td>
                    <td style={{ padding: '10px 12px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {r.topicsLearned || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="📝 Daily Report">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input className="form-input" type="date" value={form.reportDate}
                   onChange={e => setForm(f => ({ ...f, reportDate: e.target.value }))} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Hours Studied</label>
              <input className="form-input" type="number" min="0" max="24" step="0.5"
                     value={form.hoursStudied}
                     onChange={e => setForm(f => ({ ...f, hoursStudied: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">DSA Questions Solved</label>
              <input className="form-input" type="number" min="0"
                     value={form.dsaQuestionsSolved}
                     onChange={e => setForm(f => ({ ...f, dsaQuestionsSolved: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Aptitude Questions Solved</label>
              <input className="form-input" type="number" min="0"
                     value={form.aptitudeQuestionsSolved}
                     onChange={e => setForm(f => ({ ...f, aptitudeQuestionsSolved: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Productivity Rating: {form.productivityRating}/10</label>
              <input type="range" min="1" max="10" style={{ width: '100%', accentColor: 'var(--primary)' }}
                     value={form.productivityRating}
                     onChange={e => setForm(f => ({ ...f, productivityRating: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Topics Learned</label>
            <input className="form-input" type="text" placeholder="e.g. BFS/DFS, SQL Joins..."
                   value={form.topicsLearned}
                   onChange={e => setForm(f => ({ ...f, topicsLearned: e.target.value }))} />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="checkbox" id="verbal" checked={form.verbalPracticeDone}
                   onChange={e => setForm(f => ({ ...f, verbalPracticeDone: e.target.checked }))}
                   style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
            <label htmlFor="verbal" className="form-label" style={{ margin: 0 }}>✅ Verbal Practice Done</label>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={3} style={{ resize: 'vertical' }}
                      placeholder="What did you accomplish today?"
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Submit Report'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default DailyReport

import { useEffect, useState } from 'react'
import { getDsaTopics, createDsaTopic, updateDsaTopic, deleteDsaTopic, getDsaStats } from '../api/dsaApi'
import Modal from '../components/Modal'
import Loader from '../components/Loader'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import toast from 'react-hot-toast'

const DSA_STANDARD_TOPICS = [
  { name: 'Arrays',                          emoji: '🔢', difficulty: 'EASY',   total: 100 },
  { name: 'Strings',                         emoji: '📝', difficulty: 'EASY',   total: 80 },
  { name: 'Hashing',                         emoji: '🗂️', difficulty: 'MEDIUM', total: 60 },
  { name: 'Linked Lists',                    emoji: '🔗', difficulty: 'MEDIUM', total: 70 },
  { name: 'Stack & Queue',                   emoji: '📚', difficulty: 'MEDIUM', total: 60 },
  { name: 'Binary Search',                   emoji: '🔍', difficulty: 'MEDIUM', total: 60 },
  { name: 'Trees & BST',                     emoji: '🌳', difficulty: 'MEDIUM', total: 80 },
  { name: 'Heaps',                           emoji: '⛏️', difficulty: 'HARD',   total: 50 },
  { name: 'Graphs',                          emoji: '🔮', difficulty: 'HARD',   total: 100 },
  { name: 'Greedy',                          emoji: '💰', difficulty: 'MEDIUM', total: 60 },
  { name: 'Dynamic Programming',             emoji: '⚡', difficulty: 'HARD',   total: 100 },
  { name: 'Tries',                           emoji: '🌿', difficulty: 'HARD',   total: 40 },
  { name: 'Segment Trees & Advanced Topics', emoji: '📊', difficulty: 'HARD',   total: 30 },
]

const DIFFICULTY_COLORS = { EASY: '#10b981', MEDIUM: '#f59e0b', HARD: '#ef4444', MIXED: '#6366f1' }
const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444']
const FILTER_OPTIONS = ['All', 'Not Started', 'In Progress', 'Completed']

const EMPTY_FORM = { topicName: '', totalQuestions: 100, solvedQuestions: 0, difficultyLevel: 'MIXED', lastUpdatedDate: '', notes: '' }

function getStatusLabel(pct) {
  if (pct === 100) return 'Completed'
  if (pct > 0) return 'In Progress'
  return 'Not Started'
}

function DsaTracker() {
  const [topics, setTopics] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('All')
  const [sortBy, setSortBy] = useState('name')

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [data, s] = await Promise.all([getDsaTopics(), getDsaStats()])
      setTopics(data)
      setStats(s)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const openCreate = () => { setEditingTopic(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (t) => {
    setEditingTopic(t)
    setForm({
      topicName: t.topicName,
      totalQuestions: t.totalQuestions || 100,
      solvedQuestions: t.solvedQuestions || 0,
      difficultyLevel: t.difficultyLevel || 'MIXED',
      lastUpdatedDate: t.lastUpdatedDate || t.lastPracticedDate || '',
      notes: t.notes || '',
    })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this topic?')) return
    try { await deleteDsaTopic(id); fetchAll(); toast.success('Topic deleted') }
    catch (err) { toast.error(err.message) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        totalQuestions: Number(form.totalQuestions),
        solvedQuestions: Number(form.solvedQuestions),
        lastUpdatedDate: form.lastUpdatedDate || null,
      }
      if (editingTopic) await updateDsaTopic(editingTopic.id, payload)
      else await createDsaTopic(payload)
      setModalOpen(false)
      fetchAll()
      toast.success(editingTopic ? 'Topic updated!' : 'Topic added!')
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const getProgressColor = (pct) => {
    if (pct >= 80) return 'linear-gradient(90deg,#10b981,#34d399)'
    if (pct >= 50) return 'linear-gradient(90deg,#6366f1,#8b5cf6)'
    if (pct >= 25) return 'linear-gradient(90deg,#f59e0b,#fbbf24)'
    return 'linear-gradient(90deg,#f43f5e,#fb7185)'
  }

  const filteredSorted = [...topics]
    .filter(t => filter === 'All' || getStatusLabel(t.progressPercentage) === filter)
    .sort((a, b) => {
      if (sortBy === 'progress') return b.progressPercentage - a.progressPercentage
      if (sortBy === 'solved') return (b.solvedQuestions || 0) - (a.solvedQuestions || 0)
      return a.topicName.localeCompare(b.topicName)
    })

  const existingNames = new Set(topics.map(t => t.topicName))
  const avgProgress = topics.length > 0
    ? Math.round(topics.reduce((a, t) => a + (t.progressPercentage || 0), 0) / topics.length) : 0

  // Pie chart data: status distribution
  const pieData = [
    { name: 'Completed', value: topics.filter(t => t.progressPercentage === 100).length },
    { name: 'In Progress', value: topics.filter(t => t.progressPercentage > 0 && t.progressPercentage < 100).length },
    { name: 'Not Started', value: topics.filter(t => t.progressPercentage === 0).length },
  ].filter(d => d.value > 0)

  // Bar chart data: top 6 topics by solved
  const barData = [...topics]
    .sort((a, b) => (b.solvedQuestions || 0) - (a.solvedQuestions || 0))
    .slice(0, 6)
    .map(t => ({ name: t.topicName.split(' ')[0], Solved: t.solvedQuestions || 0, Total: t.totalQuestions || 100 }))

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">DSA Tracker 💻</h1>
          <p className="page-subtitle">
            Data Structures & Algorithms progress
            {topics.length > 0 && <span style={{ marginLeft: 12, color: 'var(--primary-light)', fontWeight: 600 }}>· Overall: {avgProgress}%</span>}
          </p>
        </div>
        <button id="add-dsa-btn" className="btn btn-primary" onClick={openCreate}>+ Add Topic</button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', marginBottom: 24 }}>
          {[
            { icon: '💻', label: 'Avg Progress', value: `${stats.averageProgress || avgProgress}%`, grad: 'linear-gradient(90deg,#6366f1,#8b5cf6)' },
            { icon: '✅', label: 'Questions Solved', value: stats.totalQuestionsSolved ?? topics.reduce((a, t) => a + (t.solvedQuestions || 0), 0), grad: 'linear-gradient(90deg,#10b981,#34d399)' },
            { icon: '🏆', label: 'Topics Done', value: stats.completedTopics ?? topics.filter(t => t.progressPercentage === 100).length, grad: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },
            { icon: '📋', label: 'Total Topics', value: topics.length, grad: 'linear-gradient(90deg,#06b6d4,#6366f1)' },
          ].map(c => (
            <div key={c.label} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
              <div style={{ fontSize: '1.8rem' }}>{c.icon}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, background: c.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '6px 0' }}>{c.value}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {topics.length > 0 && (
        <div className="dashboard-grid" style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="card-header"><h2 className="card-title">🥧 Status Distribution</h2></div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                     label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div className="card-header"><h2 className="card-title">📊 Top Topics — Solved</h2></div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ left: -20, right: 10, top: 5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Bar dataKey="Solved" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Total" fill="#1e1b4b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter + Sort */}
      <div className="dsa-controls">
        <div className="dsa-filter-tabs">
          {FILTER_OPTIONS.map(f => (
            <button key={f} className={`dsa-filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f}
              {f !== 'All' && <span className="dsa-filter-count">{topics.filter(t => getStatusLabel(t.progressPercentage) === f).length}</span>}
            </button>
          ))}
        </div>
        <select className="dsa-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="name">Sort: Name</option>
          <option value="progress">Sort: Progress ↓</option>
          <option value="solved">Sort: Solved ↓</option>
        </select>
      </div>

      {loading ? <Loader message="Loading topics..." /> : filteredSorted.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 48 }}>
          <div className="empty-state-icon">🧠</div>
          <div className="empty-state-text">{filter !== 'All' ? `No "${filter}" topics.` : 'No topics yet. Click "+ Add Topic" to get started!'}</div>
        </div>
      ) : (
        <div className="dsa-grid">
          {filteredSorted.map(topic => {
            const pct = topic.progressPercentage || 0
            const statusLabel = getStatusLabel(pct)
            const diff = topic.difficultyLevel || 'MIXED'
            return (
              <div key={topic.id} className="dsa-card" style={{ borderTop: `3px solid ${DIFFICULTY_COLORS[diff]}` }}>
                <div className="dsa-card-header">
                  <div>
                    <div className="dsa-card-name">{topic.topicName}</div>
                    <div style={{ marginTop: 4, display: 'flex', gap: 6 }}>
                      <span className="dsa-status-badge" style={{ background: DIFFICULTY_COLORS[diff] + '22', color: DIFFICULTY_COLORS[diff], border: `1px solid ${DIFFICULTY_COLORS[diff]}44`, fontSize: '0.7rem' }}>
                        {diff}
                      </span>
                    </div>
                  </div>
                  <div className="dsa-card-actions">
                    <button className="btn-icon edit" onClick={() => openEdit(topic)} title="Edit" aria-label={`Edit ${topic.topicName}`}>✏️</button>
                    <button className="btn-icon danger" onClick={() => handleDelete(topic.id)} title="Delete" aria-label={`Delete ${topic.topicName}`}>🗑️</button>
                  </div>
                </div>

                {/* Circular progress */}
                <div className="dsa-progress-ring-wrap">
                  <svg className="dsa-progress-ring" viewBox="0 0 60 60">
                    <circle className="dsa-ring-bg" cx="30" cy="30" r="24" />
                    <circle className="dsa-ring-fill" cx="30" cy="30" r="24"
                      style={{ strokeDashoffset: `${151 - (151 * pct / 100)}`, stroke: pct >= 80 ? '#10b981' : pct >= 50 ? '#6366f1' : pct >= 25 ? '#f59e0b' : '#f43f5e' }} />
                    <text x="30" y="35" className="dsa-ring-text" textAnchor="middle">{pct}%</text>
                  </svg>
                </div>

                {/* Solved / Total */}
                <div style={{ textAlign: 'center', margin: '8px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{topic.solvedQuestions || 0}</span>
                  <span style={{ margin: '0 4px' }}>/</span>
                  <span>{topic.totalQuestions || 100}</span>
                </div>

                <div className="progress-label">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Progress</span>
                  <span className="progress-percent">{pct}%</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${pct}%`, background: getProgressColor(pct) }} />
                </div>

                <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                  <span className={`dsa-status-badge ${statusLabel.toLowerCase().replace(' ', '-')}`}>
                    {statusLabel === 'Completed' ? '✅' : statusLabel === 'In Progress' ? '🔄' : '⏳'} {statusLabel}
                  </span>
                </div>

                {topic.notes && (
                  <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    📝 {topic.notes}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingTopic ? 'Edit DSA Topic' : 'Add DSA Topic'}>
        <form onSubmit={handleSubmit} id="dsa-form">
          {/* Quick-select */}
          {!editingTopic && (
            <div className="form-group">
              <label className="form-label">Quick Select Standard Topic</label>
              <div className="dsa-topic-chips">
                {DSA_STANDARD_TOPICS.map(t => {
                  const isSel = form.topicName === t.name
                  const isExisting = existingNames.has(t.name)
                  return (
                    <button key={t.name} type="button"
                      className={`dsa-chip ${isSel ? 'selected' : ''} ${isExisting ? 'existing' : ''}`}
                      disabled={isExisting}
                      onClick={() => !isExisting && setForm(f => ({
                        ...f, topicName: t.name, totalQuestions: t.total, difficultyLevel: t.difficulty
                      }))}>
                      <span>{t.emoji}</span><span>{t.name}</span>
                      {isExisting && <span className="chip-done">✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="topicName">Topic Name *</label>
            <input id="topicName" className="form-input" type="text" value={form.topicName}
                   onChange={e => setForm(f => ({ ...f, topicName: e.target.value }))} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Solved Questions</label>
              <input className="form-input" type="number" min="0" value={form.solvedQuestions}
                     onChange={e => setForm(f => ({ ...f, solvedQuestions: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Total Questions</label>
              <input className="form-input" type="number" min="1" value={form.totalQuestions}
                     onChange={e => setForm(f => ({ ...f, totalQuestions: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Difficulty Level</label>
            <select className="form-input" value={form.difficultyLevel}
                    onChange={e => setForm(f => ({ ...f, difficultyLevel: e.target.value }))}>
              <option value="EASY">🟢 Easy</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="HARD">🔴 Hard</option>
              <option value="MIXED">🔵 Mixed</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Last Updated Date</label>
            <input className="form-input" type="date" value={form.lastUpdatedDate}
                   onChange={e => setForm(f => ({ ...f, lastUpdatedDate: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-input" rows={2} style={{ resize: 'vertical' }}
                      placeholder="Tips, resources, strategies..."
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editingTopic ? 'Update' : 'Add Topic'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default DsaTracker

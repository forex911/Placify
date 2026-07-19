import { useEffect, useState } from 'react'
import api from '../api/axios'
import { getDsaTopics, createDsaTopic, updateDsaTopic, deleteDsaTopic, getDsaStats } from '../api/dsaApi'
import { getLeetCodeProfile } from '../api/leetcodeApi'
import Modal from '../components/Modal'
import Loader from '../components/Loader'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import toast from 'react-hot-toast'
import {
  Terminal, CheckCircle, Trophy, FileText, PieChart as PieChartIcon,
  BarChart3, Brain, Pencil, Trash2, Clock, RefreshCw, Plus, Check,
  Hash, Folder, Link, Book, Search, TreePine, Pickaxe, CircleDot, Coins, Zap, Leaf,
  Lightbulb, ExternalLink
} from 'lucide-react'

const DSA_STANDARD_TOPICS = [
  { name: 'Arrays',                          icon: <Hash size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />, difficulty: 'EASY',   total: 100 },
  { name: 'Strings',                         icon: <FileText size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />, difficulty: 'EASY',   total: 80 },
  { name: 'Hashing',                         icon: <Folder size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />, difficulty: 'MEDIUM', total: 60 },
  { name: 'Linked Lists',                    icon: <Link size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />, difficulty: 'MEDIUM', total: 70 },
  { name: 'Stack & Queue',                   icon: <Book size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />, difficulty: 'MEDIUM', total: 60 },
  { name: 'Binary Search',                   icon: <Search size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />, difficulty: 'MEDIUM', total: 60 },
  { name: 'Trees & BST',                     icon: <TreePine size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />, difficulty: 'MEDIUM', total: 80 },
  { name: 'Heaps',                           icon: <Pickaxe size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />, difficulty: 'HARD',   total: 50 },
  { name: 'Graphs',                          icon: <CircleDot size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />, difficulty: 'HARD',   total: 100 },
  { name: 'Greedy',                          icon: <Coins size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />, difficulty: 'MEDIUM', total: 60 },
  { name: 'Dynamic Programming',             icon: <Zap size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />, difficulty: 'HARD',   total: 100 },
  { name: 'Tries',                           icon: <Leaf size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />, difficulty: 'HARD',   total: 40 },
  { name: 'Segment Trees & Advanced Topics', icon: <BarChart3 size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />, difficulty: 'HARD',   total: 30 },
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
  const [leetcode, setLeetcode] = useState(null)
  const [syncing, setSyncing] = useState(false)

  // Map LeetCode tag names to our DSA tracker topic names
  const TAG_TO_TOPIC = {
    'Array': 'Arrays', 'Matrix': 'Arrays', 'Prefix Sum': 'Arrays',
    'String': 'Strings', 'String Matching': 'Strings',
    'Hash Table': 'Hashing', 'Hash Function': 'Hashing',
    'Linked List': 'Linked Lists', 'Doubly-Linked List': 'Linked Lists',
    'Stack': 'Stack & Queue', 'Queue': 'Stack & Queue', 'Monotonic Stack': 'Stack & Queue', 'Monotonic Queue': 'Stack & Queue',
    'Binary Search': 'Binary Search', 'Binary Search Tree': 'Binary Search',
    'Tree': 'Trees & BST', 'Binary Tree': 'Trees & BST', 'Depth-First Search': 'Trees & BST', 'Breadth-First Search': 'Trees & BST',
    'Heap (Priority Queue)': 'Heaps',
    'Graph': 'Graphs', 'Shortest Path': 'Graphs', 'Topological Sort': 'Graphs', 'Minimum Spanning Tree': 'Graphs', 'Union Find': 'Graphs',
    'Greedy': 'Greedy',
    'Dynamic Programming': 'Dynamic Programming', 'Memoization': 'Dynamic Programming',
    'Trie': 'Tries',
    'Segment Tree': 'Segment Trees & Advanced Topics', 'Binary Indexed Tree': 'Segment Trees & Advanced Topics',
  }

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [data, s] = await Promise.all([getDsaTopics(), getDsaStats()])
      setTopics(data)
      setStats(s)
      try {
        const lc = await getLeetCodeProfile()
        if (lc && lc.exists !== false && lc.username) setLeetcode(lc)
      } catch (_) {}
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

  const handleSyncFromLeetCode = async () => {
    if (!leetcode?.username) return toast.error('Connect your LeetCode profile first (go to LeetCode page)')
    setSyncing(true)
    try {
      const res = await api.get(`/leetcode/fetch/${leetcode.username}/skills`)
      const data = res.data
      if (data.error) throw new Error(data.message)

      // Aggregate LeetCode tags into our topic buckets
      const topicSolved = {}
      for (const skill of data.skills || []) {
        const mapped = TAG_TO_TOPIC[skill.tagName]
        if (mapped) {
          topicSolved[mapped] = (topicSolved[mapped] || 0) + skill.problemsSolved
        }
      }

      // Update each matching DSA topic
      let updated = 0
      for (const topic of topics) {
        const lcSolved = topicSolved[topic.topicName]
        if (lcSolved && lcSolved > (topic.solvedQuestions || 0)) {
          await updateDsaTopic(topic.id, {
            ...topic,
            solvedQuestions: Math.min(lcSolved, topic.totalQuestions),
            lastUpdatedDate: new Date().toISOString().split('T')[0],
          })
          updated++
        }
      }

      await fetchAll()
      toast.success(`Synced! ${updated} topic${updated !== 1 ? 's' : ''} updated from LeetCode`)
    } catch (err) {
      toast.error(err.message || 'Failed to sync from LeetCode')
    } finally {
      setSyncing(false)
    }
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
          <h1 className="page-title"><Terminal size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />DSA Tracker</h1>
          <p className="page-subtitle">
            Data Structures & Algorithms progress
            {topics.length > 0 && <span style={{ marginLeft: 12, color: 'var(--primary-light)', fontWeight: 600 }}>· Overall: {avgProgress}%</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginRight: 90 }}>
          <button id="add-dsa-btn" className="btn btn-primary" onClick={openCreate}><Plus size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Add Topic</button>
          {leetcode && (
            <button className="btn btn-secondary" onClick={handleSyncFromLeetCode} disabled={syncing}>
              <RefreshCw size={16} style={{ marginRight: 4, verticalAlign: 'middle', animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
              {syncing ? 'Syncing...' : 'Sync from LeetCode'}
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', marginBottom: 24 }}>
          {[
            { icon: <Terminal size={28} />, label: 'Avg Progress', value: `${stats.averageProgress || avgProgress}%`, grad: 'linear-gradient(90deg,#6366f1,#8b5cf6)' },
            { icon: <CheckCircle size={28} />, label: 'Questions Solved', value: stats.totalQuestionsSolved ?? topics.reduce((a, t) => a + (t.solvedQuestions || 0), 0), grad: 'linear-gradient(90deg,#10b981,#34d399)' },
            { icon: <Trophy size={28} />, label: 'Topics Done', value: stats.completedTopics ?? topics.filter(t => t.progressPercentage === 100).length, grad: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },
            { icon: <FileText size={28} />, label: 'Total Topics', value: topics.length, grad: 'linear-gradient(90deg,#06b6d4,#6366f1)' },
          ].map(c => (
            <div key={c.label} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
              <div style={{ fontSize: '1.8rem' }}>{c.icon}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, background: c.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '6px 0' }}>{c.value}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* LeetCode Stats Banner */}
      {leetcode && (
        <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(245,158,11,0.08) 50%, rgba(239,68,68,0.08) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lightbulb size={18} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>LeetCode — {leetcode.username}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {leetcode.ranking ? `Rank #${leetcode.ranking.toLocaleString()}` : 'Competitive Programming'}
                </div>
              </div>
            </div>
            <a href={`https://leetcode.com/u/${leetcode.username}`} target="_blank" rel="noopener noreferrer"
               style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontSize: '0.8rem', textDecoration: 'none' }}>
              View Profile <ExternalLink size={12} />
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))', gap: 12 }}>
            {[
              { label: 'Total Solved', value: leetcode.totalSolved || 0, color: '#6366f1' },
              { label: 'Easy', value: leetcode.easySolved || 0, color: '#10b981' },
              { label: 'Medium', value: leetcode.mediumSolved || 0, color: '#f59e0b' },
              { label: 'Hard', value: leetcode.hardSolved || 0, color: '#ef4444' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: '10px 8px', background: 'var(--card-bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {leetcode.totalSolved > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', height: 8, borderRadius: 6, overflow: 'hidden', background: 'var(--surface)' }}>
                <div style={{ width: `${((leetcode.easySolved || 0) / leetcode.totalSolved * 100)}%`, background: '#10b981', transition: 'width 0.6s ease' }} />
                <div style={{ width: `${((leetcode.mediumSolved || 0) / leetcode.totalSolved * 100)}%`, background: '#f59e0b', transition: 'width 0.6s ease' }} />
                <div style={{ width: `${((leetcode.hardSolved || 0) / leetcode.totalSolved * 100)}%`, background: '#ef4444', transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#10b981', marginRight: 4 }} />Easy {((leetcode.easySolved || 0) / leetcode.totalSolved * 100).toFixed(0)}%</span>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#f59e0b', marginRight: 4 }} />Medium {((leetcode.mediumSolved || 0) / leetcode.totalSolved * 100).toFixed(0)}%</span>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#ef4444', marginRight: 4 }} />Hard {((leetcode.hardSolved || 0) / leetcode.totalSolved * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      {topics.length > 0 && (
        <div className="dashboard-grid" style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="card-header"><h2 className="card-title"><PieChartIcon size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Status Distribution</h2></div>
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
            <div className="card-header"><h2 className="card-title"><BarChart3 size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Top Topics — Solved</h2></div>
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
          <div className="empty-state-icon"><Brain size={32} /></div>
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
                    <button className="btn-icon edit" onClick={() => openEdit(topic)} title="Edit" aria-label={`Edit ${topic.topicName}`}><Pencil size={14} /></button>
                    <button className="btn-icon danger" onClick={() => handleDelete(topic.id)} title="Delete" aria-label={`Delete ${topic.topicName}`}><Trash2 size={14} /></button>
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
                    {statusLabel === 'Completed' ? <CheckCircle size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> : statusLabel === 'In Progress' ? <RefreshCw size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> : <Clock size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />} {statusLabel}
                  </span>
                </div>

                {topic.notes && (
                  <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    <FileText size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {topic.notes}
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
                      <span>{t.icon}</span><span>{t.name}</span>
                      {isExisting && <span className="chip-done"><Check size={12} /></span>}
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

          <div className="form-row">
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
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
              <option value="MIXED">Mixed</option>
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

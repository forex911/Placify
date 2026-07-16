import { useEffect, useState } from 'react'
import { getSubjects, updateSubject } from '../api/subjectApi'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'
import Modal from '../components/Modal'
import { RadialBarChart, RadialBar, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

const SUBJECT_META = {
  OPERATING_SYSTEMS:  { label: 'Operating Systems', icon: '🖥️', color: '#6366f1' },
  DBMS:              { label: 'DBMS',               icon: '🗄️', color: '#10b981' },
  COMPUTER_NETWORKS: { label: 'Computer Networks',  icon: '🌐', color: '#f59e0b' },
  OOP:               { label: 'OOP',                icon: '📦', color: '#8b5cf6' },
  APTITUDE:          { label: 'Aptitude',            icon: '🧮', color: '#ec4899' },
  VERBAL_ABILITY:    { label: 'Verbal Ability',      icon: '📖', color: '#06b6d4' },
}

const LEVEL_COLORS = { BEGINNER: 'var(--success)', INTERMEDIATE: 'var(--warning)', ADVANCED: 'var(--primary)' }

const EMPTY_FORM = { level: 'BEGINNER', topicsCompleted: 0, totalTopics: 30, notes: '' }

function SubjectProgress() {
  const { isAdmin } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const data = await getSubjects()
      setSubjects(data)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openEdit = (subj) => {
    setEditing(subj)
    setForm({
      level: subj.level || 'BEGINNER',
      topicsCompleted: subj.topicsCompleted || 0,
      totalTopics: subj.totalTopics || 30,
      notes: subj.notes || '',
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateSubject(editing.subject, {
        level: form.level,
        topicsCompleted: Number(form.topicsCompleted),
        totalTopics: Number(form.totalTopics),
        notes: form.notes,
      })
      toast.success('Progress updated!')
      setModalOpen(false)
      load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const overall = subjects.length > 0
    ? Math.round(subjects.reduce((a, s) => a + (s.progressPercentage || 0), 0) / subjects.length)
    : 0

  const chartData = subjects.map(s => {
    const meta = SUBJECT_META[s.subject] || {}
    return { name: meta.label || s.subject, value: s.progressPercentage || 0, fill: meta.color }
  })

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Core Subjects 📚</h1>
          <p className="page-subtitle">
            Track your core CS subject knowledge
            {subjects.length > 0 && (
              <span style={{ marginLeft: 12, color: 'var(--primary-light)', fontWeight: 600 }}>
                · Overall {overall}%
              </span>
            )}
          </p>
        </div>
      </div>

      {loading ? <Loader message="Loading subjects..." /> : (
        <>
          {/* Radial chart overview */}
          {subjects.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header">
                <h2 className="card-title">📊 Subject Progress Overview</h2>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%"
                                data={chartData} startAngle={90} endAngle={-270}>
                  <RadialBar background dataKey="value" label={{ position: 'insideStart', fill: '#fff', fontSize: 11 }} />
                  <Legend iconSize={10} layout="horizontal" verticalAlign="bottom"
                          formatter={(val) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{val}</span>} />
                  <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8 }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Subject Cards */}
          <div className="dsa-grid">
            {subjects.map(subj => {
              const meta = SUBJECT_META[subj.subject] || { label: subj.subject, icon: '📚', color: '#6366f1' }
              const pct = subj.progressPercentage || 0
              const remaining = (subj.totalTopics || 30) - (subj.topicsCompleted || 0)
              return (
                <div key={subj.id} className="dsa-card" style={{ borderTop: `3px solid ${meta.color}` }}>
                  <div className="dsa-card-header">
                    <div>
                      <div className="dsa-card-name">{meta.icon} {meta.label}</div>
                      <div className="dsa-card-date" style={{ marginTop: 4 }}>
                        {subj.lastUpdatedDate ? `Updated: ${subj.lastUpdatedDate}` : 'Not started yet'}
                      </div>
                    </div>
                    <button className="btn-icon edit" onClick={() => openEdit(subj)} title="Update">✏️</button>
                  </div>

                  <div style={{ margin: '12px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="dsa-status-badge" style={{ background: LEVEL_COLORS[subj.level] + '22', color: LEVEL_COLORS[subj.level], border: `1px solid ${LEVEL_COLORS[subj.level]}44` }}>
                      {subj.level || 'BEGINNER'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Topics: <strong style={{ color: 'var(--text-primary)' }}>{subj.topicsCompleted || 0}</strong> / {subj.totalTopics || 30}
                    &nbsp;·&nbsp;Remaining: <strong style={{ color: 'var(--danger)' }}>{remaining}</strong>
                  </div>

                  <div className="progress-label">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Progress</span>
                    <span className="progress-percent">{pct}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}88)` }} />
                  </div>

                  {subj.notes && (
                    <div style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                      📝 {subj.notes}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
             title={editing ? `Update ${SUBJECT_META[editing?.subject]?.label || editing?.subject}` : 'Update Subject'}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Current Level</label>
            <select className="form-input" value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
              <option value="BEGINNER">🟢 Beginner</option>
              <option value="INTERMEDIATE">🟡 Intermediate</option>
              <option value="ADVANCED">🔴 Advanced</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Topics Completed</label>
              <input className="form-input" type="number" min="0" max={form.totalTopics}
                     value={form.topicsCompleted}
                     onChange={e => setForm(f => ({ ...f, topicsCompleted: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Total Topics</label>
              <input className="form-input" type="number" min="1"
                     value={form.totalTopics}
                     onChange={e => setForm(f => ({ ...f, totalTopics: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-input" rows={3} style={{ resize: 'vertical' }}
                      placeholder="Your notes about this subject..."
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Update'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default SubjectProgress

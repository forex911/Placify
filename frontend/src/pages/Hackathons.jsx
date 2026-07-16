import { useEffect, useState } from 'react'
import {
  getHackathons,
  createHackathon,
  updateHackathon,
  deleteHackathon,
} from '../api/hackathonsApi'
import Modal from '../components/Modal'
import Loader from '../components/Loader'
import { Trophy, AlertTriangle, Inbox, Pencil, Trash2, Plus, ExternalLink } from 'lucide-react'

const STATUS_OPTIONS = ['Registered', 'Participated', 'Finalist', 'Winner']

const STATUS_BADGE_CLASS = {
  Registered:          'badge-applied',
  Participated:        'badge-oa',
  Finalist:            'badge-interview',
  Winner:              'badge-selected',
}

const EMPTY_FORM = {
  hackathonName: '',
  projectTitle: '',
  teamSize: '',
  techStack: '',
  projectLink: '',
  date: '',
  status: 'Registered',
}

function Hackathons() {
  const [hackathons, setHackathons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingHackathon, setEditingHackathon] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const fetchHackathons = async () => {
    try {
      setLoading(true)
      const data = await getHackathons()
      setHackathons(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHackathons() }, [])

  const openCreate = () => {
    setEditingHackathon(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (h) => {
    setEditingHackathon(h)
    setForm({
      hackathonName: h.hackathonName,
      projectTitle: h.projectTitle || '',
      teamSize: h.teamSize || '',
      techStack: h.techStack || '',
      projectLink: h.projectLink || '',
      date: h.date || '',
      status: h.status,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this hackathon?')) return
    try {
      await deleteHackathon(id)
      fetchHackathons()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)
    setSaving(true)
    try {
      if (editingHackathon) {
        await updateHackathon(editingHackathon.id, form)
      } else {
        await createHackathon(form)
      }
      setModalOpen(false)
      fetchHackathons()
    } catch (err) {
      setFormError(err.response?.data?.message || err.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredHackathons = filter 
    ? hackathons.filter(h => h.status === filter)
    : hackathons

  if (loading) return <div className="page-container"><Loader message="Loading Hackathons..." /></div>
  if (error) return <div className="page-container"><div className="alert alert-error"><AlertTriangle size={16} /> {error}</div></div>

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Trophy size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />Hackathons</h1>
          <p className="page-subtitle">Track your hackathons and project building progress</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Add Hackathon
        </button>
      </div>

      <div className="dsa-filter-tabs">
        <button className={`dsa-filter-tab ${filter === '' ? 'active' : ''}`} onClick={() => setFilter('')}>All Hackathons</button>
        {STATUS_OPTIONS.map(status => (
          <button key={status} className={`dsa-filter-tab ${filter === status ? 'active' : ''}`} onClick={() => setFilter(status)}>
            {status}
          </button>
        ))}
      </div>

      <div className="card">
        {filteredHackathons.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Inbox size={32} /></div>
            <div className="empty-state-text">No hackathons found.</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Add your first hackathon to get started!</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Hackathon Name</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Project Title</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Tech Stack</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Date</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Status</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHackathons.map(h => (
                  <tr key={h.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 12px', fontWeight: 600 }}>
                      {h.projectLink ? (
                        <a href={h.projectLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                          {h.hackathonName} <ExternalLink size={12} style={{ marginLeft: 6 }} />
                        </a>
                      ) : h.hackathonName}
                    </td>
                    <td style={{ padding: '14px 12px' }}>{h.projectTitle || '—'}</td>
                    <td style={{ padding: '14px 12px', color: 'var(--text-secondary)' }}>{h.techStack || '—'}</td>
                    <td style={{ padding: '14px 12px', fontSize: '0.85rem' }}>{h.date ? new Date(h.date).toLocaleDateString('en-IN') : '—'}</td>
                    <td style={{ padding: '14px 12px' }}>
                      <span className={`status-badge ${STATUS_BADGE_CLASS[h.status] || ''}`}>{h.status}</span>
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                      <button className="btn" style={{ padding: '4px 8px', marginRight: 8 }} onClick={() => openEdit(h)}><Pencil size={14} /></button>
                      <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleDelete(h.id)}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingHackathon ? 'Edit Hackathon' : 'Add Hackathon'}>
        {formError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{formError}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Hackathon Name</label>
            <input type="text" className="form-input" value={form.hackathonName} onChange={e => setForm({ ...form, hackathonName: e.target.value })} required />
          </div>
          
          <div className="form-group">
            <label className="form-label">Project Title</label>
            <input type="text" className="form-input" value={form.projectTitle} onChange={e => setForm({ ...form, projectTitle: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Team Size</label>
              <input type="number" min="1" className="form-input" value={form.teamSize} onChange={e => setForm({ ...form, teamSize: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tech Stack</label>
            <input type="text" className="form-input" value={form.techStack} onChange={e => setForm({ ...form, techStack: e.target.value })} placeholder="React, Spring Boot, etc." />
          </div>
          
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Project Link (Devpost / GitHub)</label>
            <input type="url" className="form-input" value={form.projectLink} onChange={e => setForm({ ...form, projectLink: e.target.value })} placeholder="https://..." />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Hackathon'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Hackathons

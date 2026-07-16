import { useEffect, useState } from 'react'
import {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
} from '../api/applicationsApi'
import Modal from '../components/Modal'
import Loader from '../components/Loader'

const STATUS_OPTIONS = ['Applied', 'OA_Cleared', 'Interview_Scheduled', 'HR_Round', 'Selected', 'Rejected']

const STATUS_LABELS = {
  Applied:             '📩 Applied',
  OA_Cleared:          '✅ OA Cleared',
  Interview_Scheduled: '🎤 Interview',
  HR_Round:            '🤝 HR Round',
  Selected:            '🎉 Selected',
  Rejected:            '❌ Rejected',
}

const STATUS_BADGE_CLASS = {
  Applied:             'badge-applied',
  OA_Cleared:          'badge-oa',
  Interview_Scheduled: 'badge-interview',
  HR_Round:            'badge-interview',
  Selected:            'badge-selected',
  Rejected:            'badge-rejected',
}

const EMPTY_FORM = {
  companyName: '',
  role: '',
  appliedDate: '',
  deadline: '',
  status: 'Applied',
  location: '',
}

function Applications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingApp, setEditingApp] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const fetchApps = async (status = '') => {
    try {
      setLoading(true)
      const data = await getApplications(status)
      setApplications(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchApps(filter) }, [filter])

  const openCreate = () => {
    setEditingApp(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (app) => {
    setEditingApp(app)
    setForm({
      companyName: app.companyName,
      role: app.role,
      appliedDate: app.appliedDate,
      deadline: app.deadline || '',
      status: app.status,
      location: app.location || '',
    })
    setFormError(null)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this application?')) return
    try {
      await deleteApplication(id)
      fetchApps(filter)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)
    setSaving(true)
    try {
      const payload = {
        ...form,
        deadline: form.deadline || null,
      }
      if (editingApp) {
        await updateApplication(editingApp.id, payload)
      } else {
        await createApplication(payload)
      }
      setModalOpen(false)
      fetchApps(filter)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Applications 📋</h1>
          <p className="page-subtitle">Track your job and internship applications</p>
        </div>
        <button id="add-application-btn" className="btn btn-primary" onClick={openCreate}>
          + Add Application
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <button
          className={`filter-btn ${filter === '' ? 'active' : ''}`}
          onClick={() => setFilter('')}
        >All</button>
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            className={`filter-btn ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {loading ? (
        <Loader message="Loading applications..." />
      ) : applications.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '48px' }}>
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-text">No applications found.<br />Click "Add Application" to get started!</div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Company</th>
                <th>Role</th>
                <th>Applied Date</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app, idx) => (
                <tr key={app.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{app.companyName}</td>
                  <td>{app.role}</td>
                  <td>{formatDate(app.appliedDate)}</td>
                  <td style={{ color: app.deadline && new Date(app.deadline) < new Date() ? 'var(--accent-rose)' : 'inherit' }}>
                    {formatDate(app.deadline)}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE_CLASS[app.status]}`}>
                      {STATUS_LABELS[app.status]}
                    </span>
                  </td>
                  <td>{app.location || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="btn-icon edit"
                        onClick={() => openEdit(app)}
                        title="Edit"
                        aria-label={`Edit ${app.companyName}`}
                      >✏️</button>
                      <button
                        className="btn-icon danger"
                        onClick={() => handleDelete(app.id)}
                        title="Delete"
                        aria-label={`Delete ${app.companyName}`}
                      >🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingApp ? 'Edit Application' : 'Add Application'}
      >
        <form onSubmit={handleSubmit} id="application-form">
          {formError && <div className="alert alert-error">⚠️ {formError}</div>}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="companyName">Company Name *</label>
              <input
                id="companyName"
                className="form-input"
                type="text"
                placeholder="e.g. Google"
                value={form.companyName}
                onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="role">Role *</label>
              <input
                id="role"
                className="form-input"
                type="text"
                placeholder="e.g. SDE Intern"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="appliedDate">Applied Date *</label>
              <input
                id="appliedDate"
                className="form-input"
                type="date"
                value={form.appliedDate}
                onChange={e => setForm(f => ({ ...f, appliedDate: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="deadline">Deadline</label>
              <input
                id="deadline"
                className="form-input"
                type="date"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="app-status">Status *</label>
              <select
                id="app-status"
                className="form-select"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                required
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="location">Location</label>
              <input
                id="location"
                className="form-input"
                type="text"
                placeholder="e.g. Bengaluru"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingApp ? 'Update' : 'Add Application'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Applications

import { useEffect, useState } from 'react'
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../api/tasksApi'
import Modal from '../components/Modal'
import Loader from '../components/Loader'

const STATUS_OPTIONS = ['Pending', 'In_Progress', 'Completed']

const STATUS_LABEL = {
  Pending: 'Pending',
  In_Progress: 'In Progress',
  Completed: 'Completed',
}

const STATUS_BADGE = {
  Pending: 'badge-pending',
  In_Progress: 'badge-in-progress',
  Completed: 'badge-completed',
}

const EMPTY_FORM = {
  taskName: '',
  dueDate: '',
  status: 'Pending',
}

function StudyTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const data = await getTasks()
      setTasks(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTasks() }, [])

  const openCreate = () => {
    setEditingTask(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (task) => {
    setEditingTask(task)
    setForm({
      taskName: task.taskName,
      dueDate: task.dueDate || '',
      status: task.status,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return
    try {
      await deleteTask(id)
      fetchTasks()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleQuickStatus = async (task, newStatus) => {
    try {
      await updateTask(task.id, { ...task, status: newStatus })
      fetchTasks()
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
        dueDate: form.dueDate || null,
      }
      if (editingTask) {
        await updateTask(editingTask.id, payload)
      } else {
        await createTask(payload)
      }
      setModalOpen(false)
      fetchTasks()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter(t => t.status === filter)

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    : null

  const isOverdue = (task) =>
    task.dueDate && task.status !== 'Completed' && new Date(task.dueDate) < new Date()

  const counts = {
    Pending: tasks.filter(t => t.status === 'Pending').length,
    In_Progress: tasks.filter(t => t.status === 'In_Progress').length,
    Completed: tasks.filter(t => t.status === 'Completed').length,
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Study Tasks ✅</h1>
          <p className="page-subtitle">Manage your preparation to-do list</p>
        </div>
        <button id="add-task-btn" className="btn btn-primary" onClick={openCreate}>
          + Add Task
        </button>
      </div>

      {/* Summary mini-cards */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '⏳' },
          { key: 'In_Progress', color: '#818cf8', bg: 'rgba(99,102,241,0.1)', icon: '🔄' },
          { key: 'Completed', color: '#34d399', bg: 'rgba(16,185,129,0.1)', icon: '✅' },
        ].map(({ key, color, bg, icon }) => (
          <div
            key={key}
            style={{
              background: bg,
              border: `1px solid ${color}30`,
              borderRadius: '10px',
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
            onClick={() => setFilter(filter === key ? 'all' : key)}
          >
            <span>{icon}</span>
            <span style={{ fontWeight: 700, color, fontSize: '1.1rem' }}>{counts[key]}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 500 }}>
              {STATUS_LABEL[key]}
            </span>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="filter-bar">
        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
        {STATUS_OPTIONS.map(s => (
          <button key={s} className={`filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {loading ? (
        <Loader message="Loading tasks..." />
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '48px' }}>
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-text">No tasks found.<br />Add your first study task!</div>
        </div>
      ) : (
        <div className="task-list">
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className={`task-item ${task.status === 'Completed' ? 'completed' : ''}`}
            >
              {/* Quick status toggle */}
              <button
                style={{
                  background: 'none',
                  border: `2px solid ${task.status === 'Completed' ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  flexShrink: 0,
                  color: task.status === 'Completed' ? 'var(--accent-emerald)' : 'transparent',
                  transition: 'all 0.2s',
                }}
                onClick={() => handleQuickStatus(task, task.status === 'Completed' ? 'Pending' : 'Completed')}
                title="Toggle complete"
                aria-label="Toggle task completion"
              >
                ✓
              </button>

              <div style={{ flex: 1 }}>
                <div className="task-name">{task.taskName}</div>
                {task.dueDate && (
                  <div
                    className="task-due"
                    style={{ color: isOverdue(task) ? 'var(--accent-rose)' : 'var(--text-muted)' }}
                  >
                    {isOverdue(task) ? '⚠️ Due: ' : '📅 Due: '}{formatDate(task.dueDate)}
                  </div>
                )}
              </div>

              <span className={`badge ${STATUS_BADGE[task.status]}`}>
                {STATUS_LABEL[task.status]}
              </span>

              <div className="task-actions">
                <button
                  className="btn-icon edit"
                  onClick={() => openEdit(task)}
                  title="Edit"
                  aria-label={`Edit task ${task.taskName}`}
                >✏️</button>
                <button
                  className="btn-icon danger"
                  onClick={() => handleDelete(task.id)}
                  title="Delete"
                  aria-label={`Delete task ${task.taskName}`}
                >🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Add Study Task'}
      >
        <form onSubmit={handleSubmit} id="task-form">
          {formError && <div className="alert alert-error">⚠️ {formError}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="taskName">Task Name *</label>
            <input
              id="taskName"
              className="form-input"
              type="text"
              placeholder="e.g. Revise System Design concepts"
              value={form.taskName}
              onChange={e => setForm(f => ({ ...f, taskName: e.target.value }))}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="dueDate">Due Date</label>
              <input
                id="dueDate"
                className="form-input"
                type="date"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="task-status">Status *</label>
              <select
                id="task-status"
                className="form-select"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                required
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingTask ? 'Update' : 'Add Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default StudyTasks

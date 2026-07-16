import { useEffect, useState } from 'react'
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} from '../api/notesApi'
import Modal from '../components/Modal'
import Loader from '../components/Loader'

const EMPTY_FORM = { title: '', content: '' }

function Notes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [viewingNote, setViewingNote] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [search, setSearch] = useState('')

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const data = await getNotes()
      setNotes(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotes() }, [])

  const openCreate = () => {
    setEditingNote(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (note) => {
    setEditingNote(note)
    setForm({ title: note.title, content: note.content || '' })
    setFormError(null)
    setModalOpen(true)
  }

  const openView = (note) => {
    setViewingNote(note)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note?')) return
    try {
      await deleteNote(id)
      fetchNotes()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)
    setSaving(true)
    try {
      if (editingNote) {
        await updateNote(editingNote.id, form)
      } else {
        await createNote(form)
      }
      setModalOpen(false)
      fetchNotes()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const formatDateTime = (dt) => {
    if (!dt) return ''
    return new Date(dt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    (n.content || '').toLowerCase().includes(search.toLowerCase())
  )

  const noteColors = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #06b6d4, #6366f1)',
    'linear-gradient(135deg, #10b981, #06b6d4)',
    'linear-gradient(135deg, #f59e0b, #f43f5e)',
    'linear-gradient(135deg, #8b5cf6, #ec4899)',
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notes 📝</h1>
          <p className="page-subtitle">Capture your ideas, interview notes, and references</p>
        </div>
        <button id="add-note-btn" className="btn btn-primary" onClick={openCreate}>
          + New Note
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '20px' }}>
        <input
          id="note-search"
          className="form-input"
          type="text"
          placeholder="🔍 Search notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {loading ? (
        <Loader message="Loading notes..." />
      ) : filteredNotes.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '48px' }}>
          <div className="empty-state-icon">📓</div>
          <div className="empty-state-text">
            {search ? 'No notes match your search.' : 'No notes yet.\nCreate your first note!'}
          </div>
        </div>
      ) : (
        <div className="notes-grid">
          {filteredNotes.map((note, idx) => (
            <div
              key={note.id}
              className="note-card"
              style={{ '--note-accent': noteColors[idx % noteColors.length] }}
              onClick={() => openView(note)}
            >
              <div className="note-card-header" onClick={e => e.stopPropagation()}>
                <h3 className="note-card-title">{note.title}</h3>
                <div className="note-card-actions">
                  <button
                    className="btn-icon edit"
                    onClick={(e) => { e.stopPropagation(); openEdit(note) }}
                    title="Edit"
                    aria-label={`Edit note ${note.title}`}
                  >✏️</button>
                  <button
                    className="btn-icon danger"
                    onClick={(e) => { e.stopPropagation(); handleDelete(note.id) }}
                    title="Delete"
                    aria-label={`Delete note ${note.title}`}
                  >🗑️</button>
                </div>
              </div>

              {note.content && (
                <p className="note-card-content">{note.content}</p>
              )}

              <div className="note-card-date">
                🕐 {formatDateTime(note.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={!!viewingNote}
        onClose={() => setViewingNote(null)}
        title={viewingNote?.title || ''}
      >
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
          {viewingNote?.content || <em style={{ color: 'var(--text-muted)' }}>No content.</em>}
        </div>
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Created: {formatDateTime(viewingNote?.createdAt)}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setViewingNote(null); openEdit(viewingNote) }}
            >
              ✏️ Edit
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setViewingNote(null)}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingNote ? 'Edit Note' : 'New Note'}
      >
        <form onSubmit={handleSubmit} id="note-form">
          {formError && <div className="alert alert-error">⚠️ {formError}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="noteTitle">Title *</label>
            <input
              id="noteTitle"
              className="form-input"
              type="text"
              placeholder="Note title..."
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="noteContent">Content</label>
            <textarea
              id="noteContent"
              className="form-textarea"
              placeholder="Write your note here..."
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={8}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingNote ? 'Update Note' : 'Save Note'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Notes

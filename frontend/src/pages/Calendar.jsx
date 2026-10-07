import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import {
  Calendar as CalIcon, Plus, ChevronLeft, ChevronRight,
  Trash2, Edit2, X, Save, Bell, Clock, Tag
} from 'lucide-react'
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../api/calendarApi'

// ── Helpers ────────────────────────────────────────────────────────────
const EVENT_TYPES = ['INTERVIEW', 'DEADLINE', 'EXAM', 'HACKATHON', 'REMINDER', 'OTHER']

const TYPE_META = {
  INTERVIEW:  { label: 'Interview',  color: '#000000', bg: 'rgba(0,0,0,0.08)' },
  DEADLINE:   { label: 'Deadline',   color: '#c00000', bg: 'rgba(192,0,0,0.08)' },
  EXAM:       { label: 'Exam',       color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
  HACKATHON:  { label: 'Hackathon',  color: '#0369a1', bg: 'rgba(3,105,161,0.08)' },
  REMINDER:   { label: 'Reminder',   color: '#b45309', bg: 'rgba(180,83,9,0.08)' },
  OTHER:      { label: 'Other',      color: '#555555', bg: 'rgba(85,85,85,0.08)' },
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

function toLocalDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const today = toLocalDateStr(new Date())

// ── Empty form ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  title: '',
  description: '',
  eventDate: today,
  type: 'REMINDER',
  notifyDaysBefore: 1,
}

// ── Main Component ─────────────────────────────────────────────────────
export default function CalendarPage() {
  const now = new Date()
  const [viewYear, setViewYear]   = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [events, setEvents]       = useState([])
  const [loading, setLoading]     = useState(true)

  const [modalOpen, setModalOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState(null)   // null = create
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)

  const [selectedDate, setSelectedDate] = useState(null)  // clicked day
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // ── Fetch ────────────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getCalendarEvents()
      setEvents(data)
    } catch (err) {
      toast.error(err.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  // ── Derived: events keyed by date string ─────────────────────────────
  const eventsByDate = events.reduce((acc, ev) => {
    const key = ev.eventDate
    if (!acc[key]) acc[key] = []
    acc[key].push(ev)
    return acc
  }, {})

  // ── Navigation ───────────────────────────────────────────────────────
  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  // ── Modal helpers ─────────────────────────────────────────────────────
  const openCreate = (dateStr) => {
    setEditTarget(null)
    setForm({ ...EMPTY_FORM, eventDate: dateStr || today })
    setModalOpen(true)
  }

  const openEdit = (ev) => {
    setEditTarget(ev)
    setForm({
      title: ev.title,
      description: ev.description || '',
      eventDate: ev.eventDate,
      type: ev.type,
      notifyDaysBefore: ev.notifyDaysBefore,
    })
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditTarget(null) }

  const handleFormChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.eventDate)    { toast.error('Date is required'); return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        notifyDaysBefore: Number(form.notifyDaysBefore) || 1,
      }
      if (editTarget) {
        const updated = await updateCalendarEvent(editTarget.id, payload)
        setEvents(evs => evs.map(e => e.id === updated.id ? updated : e))
        toast.success('Event updated!')
      } else {
        const created = await createCalendarEvent(payload)
        setEvents(evs => [...evs, created])
        toast.success('Event added to calendar!')
      }
      closeModal()
    } catch (err) {
      toast.error(err.message || 'Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteCalendarEvent(id)
      setEvents(evs => evs.filter(e => e.id !== id))
      setDeleteConfirm(null)
      toast.success('Event deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete event')
    }
  }

  // ── Calendar grid ─────────────────────────────────────────────────────
  const daysInMonth  = getDaysInMonth(viewYear, viewMonth)
  const firstDayOfMonth = getFirstDayOfMonth(viewYear, viewMonth)
  const totalCells   = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7

  const cells = []
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - firstDayOfMonth + 1
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push(null)
    } else {
      const y = String(viewYear)
      const m = String(viewMonth + 1).padStart(2, '0')
      const d = String(dayNum).padStart(2, '0')
      cells.push({ dayNum, dateStr: `${y}-${m}-${d}` })
    }
  }

  // Events for selected date
  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : []

  // Upcoming events (next 30 days)
  const upcoming = events
    .filter(ev => ev.eventDate >= today)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    .slice(0, 5)

  return (
    <div className="page-container">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">Track important dates and get notified via the extension</p>
        </div>
        <button
          id="add-calendar-event-btn"
          className="btn btn-primary"
          onClick={() => openCreate(null)}
        >
          <Plus size={16} /> Add Event
        </button>
      </div>

      <div className="calendar-layout">
        {/* ── Left: Calendar Grid ──────────────────────────────────── */}
        <div className="calendar-main">
          <div className="calendar-nav">
            <button className="cal-nav-btn" onClick={prevMonth} id="cal-prev-month">
              <ChevronLeft size={18} />
            </button>
            <h2 className="cal-month-title">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            <button className="cal-nav-btn" onClick={nextMonth} id="cal-next-month">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div className="cal-grid cal-day-headers">
            {DAY_NAMES.map(d => (
              <div key={d} className="cal-day-header">{d}</div>
            ))}
          </div>

          {/* Date cells */}
          {loading ? (
            <div className="cal-loading">Loading events…</div>
          ) : (
            <div className="cal-grid cal-days">
              {cells.map((cell, idx) => {
                if (!cell) return <div key={idx} className="cal-cell cal-cell-empty" />
                const isToday = cell.dateStr === today
                const isSelected = cell.dateStr === selectedDate
                const dayEvents = eventsByDate[cell.dateStr] || []
                return (
                  <div
                    key={cell.dateStr}
                    className={`cal-cell ${isToday ? 'cal-cell-today' : ''} ${isSelected ? 'cal-cell-selected' : ''}`}
                    onClick={() => setSelectedDate(prev => prev === cell.dateStr ? null : cell.dateStr)}
                  >
                    <span className="cal-day-num">{cell.dayNum}</span>
                    <div className="cal-event-dots">
                      {dayEvents.slice(0, 3).map(ev => (
                        <span
                          key={ev.id}
                          className="cal-event-dot"
                          style={{ background: TYPE_META[ev.type]?.color || '#555' }}
                          title={ev.title}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="cal-event-dot-more">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                    {/* Quick-add on hover */}
                    <button
                      className="cal-quick-add"
                      onClick={(e) => { e.stopPropagation(); openCreate(cell.dateStr) }}
                      title="Add event"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Selected day panel */}
          {selectedDate && (
            <div className="cal-day-panel">
              <div className="cal-day-panel-header">
                <span className="cal-day-panel-title">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-primary" onClick={() => openCreate(selectedDate)}>
                    <Plus size={13} /> Add
                  </button>
                  <button className="icon-btn" onClick={() => setSelectedDate(null)}><X size={16} /></button>
                </div>
              </div>
              {selectedEvents.length === 0 ? (
                <p className="cal-empty-day">No events. Click "Add" to create one.</p>
              ) : (
                <div className="cal-event-list">
                  {selectedEvents.map(ev => (
                    <CalEventCard
                      key={ev.id} ev={ev}
                      onEdit={() => openEdit(ev)}
                      onDelete={() => setDeleteConfirm(ev.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right sidebar: Upcoming ───────────────────────────────── */}
        <div className="calendar-sidebar">
          <div className="cal-sidebar-section">
            <h3 className="cal-sidebar-title"><Clock size={14} /> Upcoming</h3>
            {upcoming.length === 0 ? (
              <p className="cal-sidebar-empty">No upcoming events</p>
            ) : (
              upcoming.map(ev => (
                <div
                  key={ev.id}
                  className="cal-upcoming-item"
                  onClick={() => {
                    const [y, m, d] = ev.eventDate.split('-')
                    setViewYear(Number(y)); setViewMonth(Number(m) - 1)
                    setSelectedDate(ev.eventDate)
                  }}
                >
                  <div className="cal-upcoming-dot" style={{ background: TYPE_META[ev.type]?.color }} />
                  <div className="cal-upcoming-info">
                    <span className="cal-upcoming-title">{ev.title}</span>
                    <span className="cal-upcoming-date">{ev.eventDate}</span>
                  </div>
                  <span
                    className="cal-upcoming-type"
                    style={{ color: TYPE_META[ev.type]?.color, background: TYPE_META[ev.type]?.bg }}
                  >
                    {TYPE_META[ev.type]?.label}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="cal-sidebar-section">
            <h3 className="cal-sidebar-title"><Tag size={14} /> Legend</h3>
            <div className="cal-legend">
              {EVENT_TYPES.map(t => (
                <div key={t} className="cal-legend-item">
                  <span className="cal-legend-dot" style={{ background: TYPE_META[t].color }} />
                  <span>{TYPE_META[t].label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="cal-sidebar-section cal-tip-box">
            <Bell size={14} />
            <p>Events notify you via the <strong>Placify Extension</strong> bell based on your "Notify X days before" setting.</p>
          </div>
        </div>
      </div>

      {/* ── Add/Edit Modal ─────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 className="modal-title">
                <CalIcon size={18} style={{ marginRight: 8 }} />
                {editTarget ? 'Edit Event' : 'Add Calendar Event'}
              </h2>
              <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label className="form-label">Title <span className="required">*</span></label>
                <input
                  id="cal-event-title"
                  className="form-input"
                  type="text"
                  placeholder="e.g. Google Interview Round 2"
                  value={form.title}
                  onChange={e => handleFormChange('title', e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date <span className="required">*</span></label>
                  <input
                    id="cal-event-date"
                    className="form-input"
                    type="date"
                    value={form.eventDate}
                    onChange={e => handleFormChange('eventDate', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Type <span className="required">*</span></label>
                  <select
                    id="cal-event-type"
                    className="form-input"
                    value={form.type}
                    onChange={e => handleFormChange('type', e.target.value)}
                  >
                    {EVENT_TYPES.map(t => (
                      <option key={t} value={t}>{TYPE_META[t].label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  id="cal-event-desc"
                  className="form-input"
                  rows={3}
                  placeholder="Optional notes about this event…"
                  value={form.description}
                  onChange={e => handleFormChange('description', e.target.value)}
                  style={{ resize: 'vertical', minHeight: 72 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Bell size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  Notify X days before
                </label>
                <input
                  id="cal-event-notify"
                  className="form-input"
                  type="number"
                  min={0}
                  max={30}
                  value={form.notifyDaysBefore}
                  onChange={e => handleFormChange('notifyDaysBefore', e.target.value)}
                  style={{ maxWidth: 120 }}
                />
                <p className="form-hint">
                  The extension will show a notification this many days before the event.
                </p>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  id="cal-save-btn"
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  <Save size={14} />
                  {saving ? 'Saving…' : editTarget ? 'Update Event' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ─────────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <h2 className="modal-title">Delete Event?</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '16px 0' }}>
              This event will be permanently removed.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                id="cal-confirm-delete-btn"
                className="btn btn-danger"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Event Card ─────────────────────────────────────────────────────────
function CalEventCard({ ev, onEdit, onDelete }) {
  const meta = TYPE_META[ev.type] || TYPE_META.OTHER
  return (
    <div className="cal-event-card">
      <div className="cal-event-card-left" style={{ borderLeftColor: meta.color }} />
      <div className="cal-event-card-body">
        <div className="cal-event-card-header">
          <span className="cal-event-card-title">{ev.title}</span>
          <span
            className="badge"
            style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.color}22` }}
          >
            {meta.label}
          </span>
        </div>
        {ev.description && (
          <p className="cal-event-card-desc">{ev.description}</p>
        )}
        <div className="cal-event-card-footer">
          <span className="cal-event-notify-tag">
            <Bell size={11} /> {ev.notifyDaysBefore}d before
          </span>
          <div className="cal-event-actions">
            <button className="icon-btn" onClick={onEdit} title="Edit"><Edit2 size={14} /></button>
            <button className="icon-btn icon-btn-danger" onClick={onDelete} title="Delete"><Trash2 size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}

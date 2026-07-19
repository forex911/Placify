import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import { useState, useRef } from 'react'
import { 
  Sparkles, LayoutDashboard, FileText, Zap, BookOpen, 
  CheckSquare, LineChart, Code2, PenTool, Settings, 
  Shield, User, LogOut, X, Menu, Trophy
} from 'lucide-react'

const defaultNavItems = [
  { to: '/dashboard',  icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/applications', icon: <FileText size={18} />, label: 'Applications' },
  { to: '/dsa',        icon: <Zap size={18} />, label: 'DSA Tracker' },
  { to: '/subjects',   icon: <BookOpen size={18} />, label: 'Core Subjects' },
  { to: '/tasks',      icon: <CheckSquare size={18} />, label: 'Study Tasks' },
  { to: '/hackathons', icon: <Trophy size={18} />, label: 'Hackathons' },
  { to: '/leetcode',   icon: <Code2 size={18} />, label: 'LeetCode' },
  { to: '/notes',      icon: <PenTool size={18} />, label: 'Notes' },
]

function Sidebar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('sidebar-order')
    if (saved) {
      const order = JSON.parse(saved)
      return [...defaultNavItems].sort((a, b) => {
        const idxA = order.indexOf(a.to)
        const idxB = order.indexOf(b.to)
        return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999)
      })
    }
    return defaultNavItems
  })

  const dragItem = useRef(null)
  const dragOverItem = useRef(null)

  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    const _items = [...items]
    const draggedItemContent = _items.splice(dragItem.current, 1)[0]
    _items.splice(dragOverItem.current, 0, draggedItemContent)
    dragItem.current = null
    dragOverItem.current = null
    setItems(_items)
    localStorage.setItem('sidebar-order', JSON.stringify(_items.map(i => i.to)))
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const getInitials = (name) => name ? name.slice(0, 2).toUpperCase() : '??'

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(o => !o)}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
             style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999 }} />
      )}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><Sparkles size={28} /></div>
          <div>
            <div className="sidebar-logo-text">Placify</div>
            <div className="sidebar-logo-sub">Placement Management</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {items.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              draggable
              onDragStart={(e) => { dragItem.current = index; e.dataTransfer.effectAllowed = 'move' }}
              onDragEnter={(e) => { dragOverItem.current = index }}
              onDragOver={(e) => { e.preventDefault() }}
              onDragEnd={handleSort}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
              style={{ cursor: 'default' }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}

          {isAdmin && isAdmin() && (
            <>
              <div className="sidebar-section-label" style={{ marginTop: 16 }}>Admin</div>
              <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                       onClick={() => setMobileOpen(false)}>
                <span className="nav-icon"><Settings size={18} /></span>
                <span className="nav-label">Admin Dashboard</span>
              </NavLink>
            </>
          )}
        </nav>

        {user && (
          <div className="sidebar-user">
            <NavLink to="/profile" className="sidebar-user-info" style={{ textDecoration: 'none' }}>
              <div className="sidebar-avatar">{getInitials(user.username)}</div>
              <div className="sidebar-user-details">
                <div className="sidebar-username">{user.username}</div>
                <div className={`sidebar-role-badge ${user.role === 'ADMIN' ? 'admin' : 'user'}`}>
                  {user.role === 'ADMIN' ? <><Shield size={12} style={{marginRight: 4}}/> Admin</> : <><User size={12} style={{marginRight: 4}}/> User</>}
                </div>
              </div>
            </NavLink>
            <button id="logout-btn" className="sidebar-logout-btn" onClick={handleLogout} title="Logout"><LogOut size={18} /></button>
          </div>
        )}

        <div className="sidebar-footer">
          <div className="sidebar-footer-text">Placify v2.0.0 · Enterprise Edition</div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

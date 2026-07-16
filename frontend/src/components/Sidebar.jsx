import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import DarkModeToggle from './DarkModeToggle'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard',  icon: 'ðŸ ', label: 'Dashboard' },
  { to: '/applications', icon: 'ðŸ“‹', label: 'Applications' },
  { to: '/dsa',        icon: 'ðŸ’»', label: 'DSA Tracker' },
  { to: '/subjects',   icon: 'ðŸ“š', label: 'Core Subjects' },
  { to: '/tasks',      icon: 'âœ…', label: 'Study Tasks' },
  { to: '/reports',    icon: 'ðŸ“', label: 'Daily Reports' },
  { to: '/leetcode',   icon: 'ðŸ’¡', label: 'LeetCode' },
  { to: '/notes',      icon: 'ðŸ—’ï¸', label: 'Notes' },
]

function Sidebar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = (name) => name ? name.slice(0, 2).toUpperCase() : '??'

  const SidebarContent = () => (
    <aside className="sidebar" style={mobileOpen ? { transform: 'translateX(0)' } : {}}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">ðŸš€</div>
        <div>
          <div className="sidebar-logo-text">Placify</div>
          <div className="sidebar-logo-sub">Placement Management</div>
        </div>
      </div>

      {/* Top actions */}
      <div style={{ display: 'flex', gap: 8, padding: '0 12px 12px', justifyContent: 'flex-end' }}>
        <NotificationBell />
        <DarkModeToggle />
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
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
              <span className="nav-icon">âš™ï¸</span>
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
                {user.role === 'ADMIN' ? 'ðŸ”´ Admin' : 'ðŸ”µ User'}
              </div>
            </div>
          </NavLink>
          <button id="logout-btn" className="sidebar-logout-btn" onClick={handleLogout} title="Logout">ðŸšª</button>
        </div>
      )}

      <div className="sidebar-footer">
        <div className="sidebar-footer-text">Placify v2.0.0 Â· Enterprise Edition</div>
      </div>
    </aside>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(o => !o)}
        style={{
          display: 'none', // shown via CSS on mobile
          position: 'fixed', top: 12, left: 12, zIndex: 1001,
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontSize: '1.2rem',
        }}
      >
        {mobileOpen ? 'âœ•' : 'â˜°'}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
             style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999 }} />
      )}

      <SidebarContent />
    </>
  )
}

export default Sidebar

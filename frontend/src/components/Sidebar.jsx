import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import { useState } from 'react'
import { 
  Sparkles, LayoutDashboard, FileText, Zap, BookOpen, 
  CheckSquare, LineChart, Code2, PenTool, Settings, 
  Shield, User, LogOut, X, Menu, Trophy
} from 'lucide-react'

const navItems = [
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

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = (name) => name ? name.slice(0, 2).toUpperCase() : '??'

  const SidebarContent = () => (
    <aside className="sidebar" style={mobileOpen ? { transform: 'translateX(0)' } : {}}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon"><Sparkles size={28} /></div>
        <div>
          <div className="sidebar-logo-text">Placify</div>
          <div className="sidebar-logo-sub">Placement Management</div>
        </div>
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
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
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

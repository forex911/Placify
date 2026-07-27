import { useEffect, useState, useRef } from 'react'
import { Sun, Moon, Monitor, Palette, ChevronUp } from 'lucide-react'

const THEMES = [
  { key: 'light', label: 'Light', icon: Sun },
  { key: 'dark', label: 'Dark', icon: Moon },
  { key: 'system', label: 'System', icon: Monitor },
]

function applyTheme(theme) {
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

function DarkModeToggle({ collapsed }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('placify_theme') || 'dark')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Apply on mount + listen for system changes
  useEffect(() => {
    const saved = localStorage.getItem('placify_theme') || 'dark'
    setTheme(saved)
    applyTheme(saved)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (localStorage.getItem('placify_theme') === 'system') {
        applyTheme('system')
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Apply when theme changes
  useEffect(() => {
    localStorage.setItem('placify_theme', theme)
    applyTheme(theme)
  }, [theme])

  // Close popup on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentTheme = THEMES.find(t => t.key === theme) || THEMES[1]
  const CurrentIcon = currentTheme.icon

  return (
    <div className="theme-picker" ref={ref}>
      <button
        className="theme-picker-trigger"
        onClick={() => setOpen(o => !o)}
        title="Theme"
      >
        <span className="nav-icon"><Palette size={18} /></span>
        {!collapsed && <span className="nav-label">Theme</span>}
        {!collapsed && <ChevronUp size={14} className={`theme-picker-chevron ${open ? 'open' : ''}`} />}
      </button>

      {open && (
        <div className="theme-picker-popup">
          {THEMES.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                className={`theme-picker-option ${theme === t.key ? 'active' : ''}`}
                onClick={() => { setTheme(t.key); setOpen(false) }}
              >
                {theme === t.key && <span className="theme-picker-dot" />}
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DarkModeToggle

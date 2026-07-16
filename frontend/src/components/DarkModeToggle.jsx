import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

function DarkModeToggle() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('placify_theme') === 'dark'
  })

  useEffect(() => {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('placify_theme', 'dark')
    } else {
      document.documentElement.setAttribute('data-theme', 'light')
      localStorage.setItem('placify_theme', 'light')
    }
  }, [dark])

  // Apply on mount
  useEffect(() => {
    const saved = localStorage.getItem('placify_theme')
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved)
      setDark(saved === 'dark')
    }
  }, [])

  return (
    <button
      onClick={() => setDark(d => !d)}
      title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle dark mode"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        width: 38, height: 38,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: '1.1rem',
        transition: 'all 0.2s',
        color: 'var(--text-primary)',
      }}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

export default DarkModeToggle

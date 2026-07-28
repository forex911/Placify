import { Download, Chrome, Puzzle, Zap, Globe, Shield, Settings, CheckCircle, ArrowRight, Copy } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

const features = [
  {
    icon: <Zap size={22} />,
    title: 'One-Click Save',
    desc: 'Save job applications and hackathons directly from any webpage with a single click.'
  },
  {
    icon: <Globe size={22} />,
    title: 'Auto-Detect',
    desc: 'Automatically detects the current page URL and fills it into the form for you.'
  },
  {
    icon: <Puzzle size={22} />,
    title: 'Job & Hackathon Tabs',
    desc: 'Switch between saving job applications and hackathon entries with built-in tabs.'
  },
  {
    icon: <Shield size={22} />,
    title: 'Secure API Key Auth',
    desc: 'Connects securely to your Placify account using your personal API key.'
  },
  {
    icon: <Settings size={22} />,
    title: 'Customizable Backend',
    desc: 'Configure your own backend URL in the extension settings for self-hosted setups.'
  },
  {
    icon: <Chrome size={22} />,
    title: 'Lightweight & Fast',
    desc: 'Minimal permissions, no background scripts — just a clean, fast popup interface.'
  },
]

const steps = [
  { step: '01', title: 'Download', desc: 'Click the download button below to get the extension zip file.' },
  { step: '02', title: 'Extract', desc: 'Unzip the downloaded file to a folder on your computer.' },
  { step: '03', title: 'Open Chrome Extensions', desc: 'Navigate to chrome://extensions/ and enable Developer Mode (top-right toggle).' },
  { step: '04', title: 'Load Extension', desc: 'Click "Load unpacked" and select the extracted extension folder.' },
  { step: '05', title: 'Configure', desc: 'Click the Placify icon in your toolbar, open Settings, and paste your API key.' },
  { step: '06', title: 'Start Saving', desc: 'Browse any job board and save applications instantly!' },
]

function Extension() {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  const handleCopyKey = () => {
    if (user?.apiKey) {
      navigator.clipboard.writeText(user.apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="ext-page">
      {/* Hero Section */}
      <section className="ext-hero">
        <div className="ext-hero-badge">
          <Chrome size={14} /> Chrome Extension
        </div>
        <h1 className="ext-hero-title">Placify Browser Extension</h1>
        <p className="ext-hero-subtitle">
          Save job applications and hackathon entries directly from any webpage — right into your Placify dashboard.
        </p>
        <a
          href="https://github.com/forex911/Placify/releases/download/v1.0.0/Placify-v1.0.0.zip"
          download
          className="ext-download-btn"
        >
          <Download size={18} /> Download Extension v1.0
        </a>
        <p className="ext-hero-note">Works with Chrome, Edge, Brave, and other Chromium browsers</p>
      </section>

      {/* Features Grid */}
      <section className="ext-section">
        <h2 className="ext-section-title">Features</h2>
        <div className="ext-features-grid">
          {features.map((f, i) => (
            <div key={i} className="ext-feature-card">
              <div className="ext-feature-icon">{f.icon}</div>
              <h3 className="ext-feature-title">{f.title}</h3>
              <p className="ext-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Installation Steps */}
      <section className="ext-section">
        <h2 className="ext-section-title">Installation Guide</h2>
        <div className="ext-steps">
          {steps.map((s, i) => (
            <div key={i} className="ext-step">
              <div className="ext-step-num">{s.step}</div>
              <div className="ext-step-content">
                <h3 className="ext-step-title">{s.title}</h3>
                <p className="ext-step-desc">{s.desc}</p>
              </div>
              {i < steps.length - 1 && <div className="ext-step-connector" />}
            </div>
          ))}
        </div>
      </section>

      {/* API Key Quick Copy */}
      {user?.apiKey && (
        <section className="ext-section">
          <h2 className="ext-section-title">Your API Key</h2>
          <div className="ext-apikey-box">
            <p className="ext-apikey-hint">
              Paste this key into the extension settings to connect your account.
            </p>
            <div className="ext-apikey-row">
              <code className="ext-apikey-code">{user.apiKey}</code>
              <button onClick={handleCopyKey} className="ext-copy-btn">
                {copied ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="ext-bottom-cta">
        <a
          href="https://github.com/forex911/Placify/releases/download/v1.0.0/Placify-v1.0.0.zip"
          download
          className="ext-download-btn"
        >
          <Download size={18} /> Download Extension
        </a>
      </section>
    </div>
  )
}

export default Extension

import { useState, useEffect } from 'react'
import Modal from './Modal'
import { Sparkles, ArrowRight, X, Map, Briefcase, BookOpen, CheckCircle } from 'lucide-react'

function OnboardingGuide() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Check if user has already seen the guide
    const hasSeenGuide = localStorage.getItem('placify_onboarding_done')
    if (!hasSeenGuide) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsOpen(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem('placify_onboarding_done', 'true')
  }

  const steps = [
    {
      title: "Welcome to Placify!",
      icon: <Sparkles size={48} style={{ color: 'var(--text-primary)' }} />,
      desc: "Your ultimate placement tracker. Let's take a quick tour to help you get the most out of the platform."
    },
    {
      title: "The Dashboard",
      icon: <Map size={48} style={{ color: 'var(--text-primary)' }} />,
      desc: "Get a bird's-eye view of your placement journey. Track total applications, upcoming deadlines, and recent activities at a glance."
    },
    {
      title: "Track Applications",
      icon: <Briefcase size={48} style={{ color: 'var(--text-primary)' }} />,
      desc: "Never lose track of a job application again. Add companies, roles, and update statuses as you progress through interviews."
    },
    {
      title: "Study Plan & Hackathons",
      icon: <BookOpen size={48} style={{ color: 'var(--text-primary)' }} />,
      desc: "Organize your preparation with a personalized study plan and keep track of hackathons you're participating in."
    },
    {
      title: "You're all set!",
      icon: <CheckCircle size={48} style={{ color: 'var(--text-primary)' }} />,
      desc: "Start tracking your journey and land your dream job. Good luck!"
    }
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleClose()
    }
  }

  if (!isOpen) return null

  const step = steps[currentStep]

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Startup Guide">
      <div className="onboarding-content" style={{ textAlign: 'center', padding: '20px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '50%', display: 'inline-flex' }}>
            {step.icon}
          </div>
        </div>
        
        <h3 style={{ fontSize: '1.5rem', marginBottom: '12px', fontFamily: 'var(--font-brand)' }}>{step.title}</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '32px' }}>
          {step.desc}
        </p>

        {/* Dots indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
          {steps.map((_, i) => (
            <div 
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: i === currentStep ? 'var(--text-primary)' : 'var(--border-color)',
                transition: 'background 0.3s'
              }}
            />
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary" 
            style={{ flex: 1 }}
            onClick={handleClose}
          >
            Skip
          </button>
          <button 
            className="btn btn-primary" 
            style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            onClick={nextStep}
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            {currentStep < steps.length - 1 && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default OnboardingGuide

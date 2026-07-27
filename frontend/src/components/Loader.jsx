import { Sparkles } from 'lucide-react'

function Loader({ message = 'Loading...' }) {
  return (
    <div className="loader-container">
      <div className="loader-placify">
        {/* Orbiting rings */}
        <div className="loader-orbit loader-orbit-1">
          <div className="loader-dot" />
        </div>
        <div className="loader-orbit loader-orbit-2">
          <div className="loader-dot" />
        </div>
        <div className="loader-orbit loader-orbit-3">
          <div className="loader-dot" />
        </div>
        {/* Center icon */}
        <div className="loader-center">
          <Sparkles size={20} />
        </div>
      </div>
      <p className="loader-message">{message}</p>
    </div>
  )
}

export default Loader

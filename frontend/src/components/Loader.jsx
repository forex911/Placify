
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
          <img src="/favicon-32x32.png" alt="Loading" style={{ width: 24, height: 24, objectFit: 'contain' }} />
        </div>
      </div>
      <p className="loader-message">{message}</p>
    </div>
  )
}

export default Loader

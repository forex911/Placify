function Loader({ message = 'Loading...' }) {
  return (
    <div className="loader-container">
      <div style={{ textAlign: 'center' }}>
        <div className="loader" role="status" aria-label="Loading" />
        <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          {message}
        </p>
      </div>
    </div>
  )
}

export default Loader

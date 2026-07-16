function StatCard({ icon, value, label, gradient, change, changeType }) {
  return (
    <div
      className="stat-card"
      style={{ '--card-gradient': gradient }}
    >
      <span className="stat-card-icon">{icon}</span>
      <div className="stat-card-value">{value ?? '—'}</div>
      <div className="stat-card-label">{label}</div>
      {change !== undefined && (
        <div
          className="stat-card-change"
          style={{ color: changeType === 'positive' ? 'var(--accent-emerald)' : changeType === 'negative' ? 'var(--accent-rose)' : 'var(--text-muted)' }}
        >
          {change}
        </div>
      )}
    </div>
  )
}

export default StatCard

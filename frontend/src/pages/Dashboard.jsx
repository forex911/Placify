import { useEffect, useState } from 'react'
import { getDashboardStats } from '../api/dashboardApi'
import { getApplications } from '../api/applicationsApi'
import { getHackathons } from '../api/hackathonsApi'
import { generateNotifications } from '../api/notificationsApi'
import StatCard from '../components/StatCard'
import Loader from '../components/Loader'
import { useAuth } from '../context/AuthContext'
import {
  Home, FileText, Clock, Trophy,
  AlertTriangle, Sparkles, Briefcase, CheckSquare
} from 'lucide-react'

function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [appliedJobs, setAppliedJobs] = useState([])
  const [ongoingHackathons, setOngoingHackathons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)
        generateNotifications().catch(() => {})
        const [statsData, apps, hackathons] = await Promise.all([
          getDashboardStats(),
          getApplications(),
          getHackathons().catch(() => [])
        ])
        setStats(statsData)
        
        // Filter for ONLY 'Applied' status
        setAppliedJobs(
          apps
            .filter(a => a.status === 'Applied')
            .sort((a,b) => new Date(b.appliedDate) - new Date(a.appliedDate))
            .slice(0, 10)
        )
        
        // Filter for 'Registered' (ongoing) hackathons
        setOngoingHackathons(
          hackathons
            .filter(h => h.status === 'Registered')
            .sort((a,b) => new Date(a.date || 0) - new Date(b.date || 0)) // Sort upcoming first
            .slice(0, 10)
        )
      } catch (err) { setError(err.message) }
      finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  if (loading) return <div className="page-container"><Loader message="Loading dashboard..." /></div>
  if (error) return <div className="page-container"><div className="alert alert-error"><AlertTriangle size={16} /> {error}</div></div>

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Home size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, <strong>{user?.username}</strong>! Your placement journey at a glance.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard icon={<FileText size={22} />} value={stats?.totalApplications ?? 0} label="Total Applications" />
        <StatCard icon={<Clock size={22} />} value={stats?.upcomingDeadlines ?? 0} label="Upcoming Deadlines"
          change={stats?.upcomingDeadlines > 0 ? 'In next 7 days' : 'No urgent deadlines'}
          changeType={stats?.upcomingDeadlines > 0 ? 'negative' : 'neutral'} />
        <StatCard icon={<CheckSquare size={22} />} value={stats?.pendingStudyTasks ?? 0} label="Pending Tasks" />
        <StatCard icon={<Trophy size={22} />} value={stats?.totalHackathons ?? 0} label="Hackathons" />
      </div>

      {/* Bottom Panels */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
        
        {/* Applied Jobs */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title"><Briefcase size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Applied Jobs</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recent 10</span>
          </div>
          {appliedJobs.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon"><Sparkles size={32} /></div><div className="empty-state-text">No applied jobs</div></div>
          ) : (
            appliedJobs.map(app => (
              <div key={app.id} className="deadline-item">
                <div>
                  <div className="deadline-company">{app.companyName}</div>
                  <div className="deadline-role">{app.role}</div>
                </div>
                <div className="deadline-date">{formatDate(app.appliedDate)}</div>
              </div>
            ))
          )}
        </div>

        {/* Ongoing Hackathons */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title"><Trophy size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Ongoing Hackathons</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered</span>
          </div>
          {ongoingHackathons.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon"><Sparkles size={32} /></div><div className="empty-state-text">No ongoing hackathons</div></div>
          ) : (
            ongoingHackathons.map(h => (
              <div key={h.id} className="deadline-item">
                <div>
                  <div className="deadline-company">{h.hackathonName}</div>
                  <div className="deadline-role">{h.projectTitle || 'No project'}</div>
                </div>
                <div className="deadline-date">{formatDate(h.date)}</div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}

export default Dashboard


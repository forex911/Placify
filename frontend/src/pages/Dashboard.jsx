import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats } from '../api/dashboardApi'
import { getApplications } from '../api/applicationsApi'
import { getHackathons } from '../api/hackathonsApi'
import { generateNotifications } from '../api/notificationsApi'
import Loader from '../components/Loader'
import { useAuth } from '../context/AuthContext'
import {
  AlertTriangle, FileText, Zap, Trophy, CheckSquare,
  Briefcase, Code2, Award, Star,
  TrendingUp, ArrowRight
} from 'lucide-react'
import OnboardingGuide from '../components/OnboardingGuide'

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentApplied, setRecentApplied] = useState([])
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
          getApplications().catch(() => []),
          getHackathons().catch(() => [])
        ])
        setStats(statsData)

        // Recent applied jobs (last 5)
        setRecentApplied(
          apps
            .filter(a => a.status === 'Applied')
            .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate))
            .slice(0, 5)
        )

        // Ongoing hackathons (registered, upcoming first)
        setOngoingHackathons(
          hackathons
            .filter(h => h.status === 'Registered')
            .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
            .slice(0, 5)
        )
      } catch (err) { setError(err.message) }
      finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  if (loading) return <div className="page-container"><Loader message="Loading dashboard..." /></div>
  if (error) return <div className="page-container"><div className="alert alert-error"><AlertTriangle size={16} /> {error}</div></div>

  const getInitials = (name) => name ? name.slice(0, 2).toUpperCase() : '??'
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'

  // Use real fields from DashboardStatsDTO
  const totalDsaSolved = stats?.totalDsaQuestionsSolved ?? 0
  const dsaTopicsSolved = stats?.dsaTopicsSolved ?? 0
  const avgDsaProgress = stats?.averageDsaProgress ?? 0

  return (
    <div className="page-container">
      <OnboardingGuide />

      <div className="db-layout">
        {/* ── Main Content ── */}
        <div className="db-main">

          {/* Welcome Banner */}
          <div className="db-welcome-banner">
            <div className="db-welcome-content">
              <h1 className="db-welcome-title">
                Welcome back, {user?.username}!
              </h1>
              <p className="db-welcome-subtitle">
                Let's dive into today's preparation and keep your placement momentum going!
              </p>
              <div className="db-welcome-badge">
                <Award size={14} />
                <span>
                  {(stats?.totalApplications ?? 0) > 0
                    ? `${stats.totalApplications} applications tracked so far`
                    : 'Start tracking your first application'}
                </span>
              </div>
            </div>
            <div className="db-welcome-art">
              <div className="db-welcome-orb db-welcome-orb-1"></div>
              <div className="db-welcome-orb db-welcome-orb-2"></div>
              <div className="db-welcome-icon-float">
                <TrendingUp size={48} strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="db-stats-row">
            <div className="db-stat-card" onClick={() => navigate('/applications')}>
              <div className="db-stat-icon db-stat-icon-blue">
                <FileText size={20} />
              </div>
              <div className="db-stat-value">{stats?.totalApplications ?? 0}</div>
              <div className="db-stat-label">Applications</div>
            </div>

            <div className="db-stat-card" onClick={() => navigate('/dsa')}>
              <div className="db-stat-icon db-stat-icon-green">
                <Code2 size={20} />
              </div>
              <div className="db-stat-value">
                {totalDsaSolved}
              </div>
              <div className="db-stat-label">DSA Solved</div>
            </div>

            <div className="db-stat-card" onClick={() => navigate('/hackathons')}>
              <div className="db-stat-icon db-stat-icon-amber">
                <Trophy size={20} />
              </div>
              <div className="db-stat-value">{stats?.totalHackathons ?? 0}</div>
              <div className="db-stat-label">Hackathons</div>
            </div>

            <div className="db-stat-card" onClick={() => navigate('/tasks')}>
              <div className="db-stat-icon db-stat-icon-rose">
                <CheckSquare size={20} />
              </div>
              <div className="db-stat-value">{stats?.pendingStudyTasks ?? 0}</div>
              <div className="db-stat-label">Pending Tasks</div>
            </div>
          </div>

          {/* Track your Progress */}
          <div className="db-progress-section">
            <h2 className="db-section-title">Track your Progress</h2>
            <div className="db-feature-cards">

              <div className="db-feature-card db-feature-applications" onClick={() => navigate('/applications')}>
                <span className="db-feature-tag">Applications</span>
                <div className="db-feature-card-icon">
                  <Briefcase size={36} strokeWidth={1.5} />
                </div>
                <div className="db-feature-card-info">
                  <div className="db-feature-card-name">Job Applications</div>
                  <div className="db-feature-card-desc">Track every step of your placement journey</div>
                </div>
                <div className="db-feature-card-arrow"><ArrowRight size={16} /></div>
              </div>

              <div className="db-feature-card db-feature-dsa" onClick={() => navigate('/dsa')}>
                <span className="db-feature-tag">Practice</span>
                <div className="db-feature-card-icon">
                  <Zap size={36} strokeWidth={1.5} />
                </div>
                <div className="db-feature-card-info">
                  <div className="db-feature-card-name">DSA Tracker</div>
                  <div className="db-feature-card-desc">Solve problems & master data structures</div>
                </div>
                <div className="db-feature-card-arrow"><ArrowRight size={16} /></div>
              </div>

              <div className="db-feature-card db-feature-hackathons" onClick={() => navigate('/hackathons')}>
                <span className="db-feature-tag">Compete</span>
                <div className="db-feature-card-icon">
                  <Trophy size={36} strokeWidth={1.5} />
                </div>
                <div className="db-feature-card-info">
                  <div className="db-feature-card-name">Hackathons</div>
                  <div className="db-feature-card-desc">Register & manage your hackathon entries</div>
                </div>
                <div className="db-feature-card-arrow"><ArrowRight size={16} /></div>
              </div>

            </div>
          </div>

          {/* Recent Activity Lists */}
          <div className="db-activity-grid">
            {/* Applied Jobs */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title"><Briefcase size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Applied Jobs</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recent</span>
              </div>
              {recentApplied.length === 0 ? (
                <div className="db-empty-state">
                  <FileText size={28} strokeWidth={1.5} />
                  <span>No applied jobs yet</span>
                </div>
              ) : (
                recentApplied.map(app => (
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
                <div className="db-empty-state">
                  <Trophy size={28} strokeWidth={1.5} />
                  <span>No ongoing hackathons</span>
                </div>
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

        {/* ── Right Profile Panel ── */}
        <aside className="db-profile-panel">
          {/* User Card */}
          <div className="db-profile-card">
            <div className="db-profile-avatar">{getInitials(user?.username)}</div>
            <div className="db-profile-name">{user?.username}</div>
            <div className="db-profile-role">
              {user?.role === 'ADMIN' ? 'Administrator' : 'Student'}
            </div>
          </div>

          {/* Stats List */}
          <div className="db-profile-stats">
            <div className="db-profile-stat-row">
              <span className="db-profile-stat-icon"><Star size={14} /></span>
              <span className="db-profile-stat-label">Applications</span>
              <span className="db-profile-stat-val">{stats?.totalApplications ?? 0}</span>
            </div>
            <div className="db-profile-stat-row">
              <span className="db-profile-stat-icon"><Code2 size={14} /></span>
              <span className="db-profile-stat-label">DSA Solved</span>
              <span className="db-profile-stat-val">{totalDsaSolved}</span>
            </div>
            <div className="db-profile-stat-row">
              <span className="db-profile-stat-icon"><Trophy size={14} /></span>
              <span className="db-profile-stat-label">Hackathons</span>
              <span className="db-profile-stat-val">{stats?.totalHackathons ?? 0}</span>
            </div>
            <div className="db-profile-stat-row">
              <span className="db-profile-stat-icon"><CheckSquare size={14} /></span>
              <span className="db-profile-stat-label">Pending Tasks</span>
              <span className="db-profile-stat-val">{stats?.pendingStudyTasks ?? 0}</span>
            </div>
          </div>

          {/* Streak-like Items */}
          <div className="db-profile-streaks">
            <div className="db-streak-item db-streak-deadlines">
              <div className="db-streak-title">Upcoming Deadlines</div>
              <div className="db-streak-value">{stats?.upcomingDeadlines ?? 0}</div>
              <div className="db-streak-sub">
                {stats?.upcomingDeadlines > 0 ? 'Due within 7 days' : 'No urgent deadlines'}
              </div>
            </div>

            <div className="db-streak-item">
              <div className="db-streak-title">DSA Progress</div>
              <div className="db-streak-value">
                {Math.round(avgDsaProgress)}%
              </div>
              <div className="db-streak-sub">
                {dsaTopicsSolved} topics completed · {totalDsaSolved} questions solved
              </div>
            </div>

            <div className="db-streak-item">
              <div className="db-streak-title">Interview Pipeline</div>
              <div className="db-streak-value">{stats?.interviewApplications ?? 0} scheduled</div>
              <div className="db-streak-sub">
                {stats?.selectedApplications ?? 0} selected · {stats?.rejectedApplications ?? 0} rejected
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Dashboard

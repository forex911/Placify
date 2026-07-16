import { useEffect, useState } from 'react'
import { getDashboardStats } from '../api/dashboardApi'
import { getApplications } from '../api/applicationsApi'
import { getTasks } from '../api/tasksApi'
import { getDsaTopics } from '../api/dsaApi'
import { getLeetCodeProfile } from '../api/leetcodeApi'
import { generateNotifications } from '../api/notificationsApi'
import StatCard from '../components/StatCard'
import Loader from '../components/Loader'
import { useAuth } from '../context/AuthContext'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import {
  Home, FileText, Clock, CheckSquare, Monitor, Trophy, Timer,
  AlertTriangle, PartyPopper, Sparkles, Pin, BookOpen, Brain, Code2
} from 'lucide-react'

function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [deadlines, setDeadlines] = useState([])
  const [pendingTasks, setPendingTasks] = useState([])
  const [dsaTopics, setDsaTopics] = useState([])
  const [leetcodeProfile, setLeetCodeProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)
        // Generate notifications on dashboard load
        generateNotifications().catch(() => {})
        const [statsData, apps, tasks, topics, lcProfile] = await Promise.all([
          getDashboardStats(),
          getApplications(),
          getTasks(),
          getDsaTopics(),
          getLeetCodeProfile().catch(() => null)
        ])
        setStats(statsData)
        const upcoming = apps
          .filter(a => a.deadline && new Date(a.deadline) >= new Date())
          .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
          .slice(0, 5)
        setDeadlines(upcoming)
        setPendingTasks(tasks.filter(t => t.status === 'Pending').slice(0, 5))
        setDsaTopics(topics.slice(0, 6))
        setLeetCodeProfile(lcProfile?.exists === false ? null : lcProfile)
      } catch (err) { setError(err.message) }
      finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  if (loading) return <div className="page-container"><Loader message="Loading dashboard..." /></div>
  if (error) return <div className="page-container"><div className="alert alert-error"><AlertTriangle size={16} /> {error}</div></div>

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'
  const daysUntil = (d) => {
    const diff = Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24))
    if (diff <= 0) return 'Today!'
    if (diff === 1) return 'Tomorrow'
    return `${diff} days`
  }

  const subjectProgress = stats?.subjectProgress || []
  const avgSubjectPct = subjectProgress.length > 0
    ? Math.round(subjectProgress.reduce((a, s) => a + (s.progressPercentage || 0), 0) / subjectProgress.length)
    : 0

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
        <StatCard icon={<Monitor size={22} />} value={`${Math.round(stats?.averageDsaProgress ?? 0)}%`} label="Avg DSA Progress" />
        <StatCard icon={<Trophy size={22} />} value={stats?.selectedApplications ?? 0} label="Selected"
          change={stats?.selectedApplications > 0 ? 'Congratulations!' : 'Keep applying!'}
          changeType={stats?.selectedApplications > 0 ? 'positive' : 'neutral'} />
        <StatCard icon={<Trophy size={22} />} value={stats?.totalHackathons ?? 0} label="Hackathons" />
      </div>

      {/* Bottom Panels */}
      <div className="dashboard-grid">
        {/* Upcoming Deadlines */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title"><Clock size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Upcoming Deadlines</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Next 7 days</span>
          </div>
          {deadlines.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon"><Sparkles size={32} /></div><div className="empty-state-text">No upcoming deadlines</div></div>
          ) : (
            deadlines.map(app => (
              <div key={app.id} className="deadline-item">
                <div>
                  <div className="deadline-company">{app.companyName}</div>
                  <div className="deadline-role">{app.role}</div>
                </div>
                <div className="deadline-date">{daysUntil(app.deadline)}</div>
              </div>
            ))
          )}
        </div>

        {/* Pending Tasks */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title"><BookOpen size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Pending Study Tasks</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Top 5</span>
          </div>
          {pendingTasks.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon"><Sparkles size={32} /></div><div className="empty-state-text">All tasks completed!</div></div>
          ) : (
            <div className="task-list">
              {pendingTasks.map(task => (
                <div key={task.id} className="task-item">
                  <Pin size={14} />
                  <div className="task-name">{task.taskName}</div>
                  {task.dueDate && <div className="task-due">{formatDate(task.dueDate)}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subject Progress */}
        {subjectProgress.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title"><BookOpen size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Core Subjects</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg: {avgSubjectPct}%</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {subjectProgress.map(s => (
                <div key={s.id}>
                  <div className="progress-label">
                    <span className="progress-topic">{s.subjectDisplayName}</span>
                    <span className="progress-percent">{s.progressPercentage}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${s.progressPercentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DSA Progress */}
        <div className="card" style={{ gridColumn: subjectProgress.length > 0 ? 'auto' : '1 / -1' }}>
          <div className="card-header">
            <h2 className="card-title"><Code2 size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />DSA Progress</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg: {Math.round(stats?.averageDsaProgress ?? 0)}%</span>
          </div>
          {dsaTopics.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon"><Brain size={32} /></div><div className="empty-state-text">Start tracking your DSA progress!</div></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {dsaTopics.map(topic => (
                <div key={topic.id}>
                  <div className="progress-label">
                    <span className="progress-topic">{topic.topicName}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{topic.solvedQuestions || 0}/{topic.totalQuestions || 100}</span>
                    <span className="progress-percent">{topic.progressPercentage}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${topic.progressPercentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LeetCode Stats */}
        {leetcodeProfile && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title"><Trophy size={18} style={{ marginRight: 8, verticalAlign: 'middle', color: '#f59e0b' }} />LeetCode Stats</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{leetcodeProfile.username}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Solved</span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{leetcodeProfile.totalSolved}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.85rem', color: '#10b981' }}>Easy</span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{leetcodeProfile.easySolved}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.85rem', color: '#f59e0b' }}>Medium</span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{leetcodeProfile.mediumSolved}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                <span style={{ fontSize: '0.85rem', color: '#ef4444' }}>Hard</span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{leetcodeProfile.hardSolved}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard

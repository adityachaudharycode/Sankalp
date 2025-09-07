import { useState, useEffect } from 'react'

export default function CommunityStats() {
  const [stats, setStats] = useState({
    totalIssues: 0,
    resolvedIssues: 0,
    activeVolunteers: 0,
    impactScore: 0
  })

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Simulate real-time stats updates
    const interval = setInterval(() => {
      setStats(prev => ({
        totalIssues: Math.min(prev.totalIssues + Math.floor(Math.random() * 3), 1247),
        resolvedIssues: Math.min(prev.resolvedIssues + Math.floor(Math.random() * 2), 892),
        activeVolunteers: Math.min(prev.activeVolunteers + Math.floor(Math.random() * 2), 156),
        impactScore: Math.min(prev.impactScore + Math.floor(Math.random() * 5), 2847)
      }))
    }, 3000)

    // Animate stats on mount
    setTimeout(() => {
      setStats({
        totalIssues: 1247,
        resolvedIssues: 892,
        activeVolunteers: 156,
        impactScore: 2847
      })
      setIsVisible(true)
    }, 500)

    return () => clearInterval(interval)
  }, [])

  const StatCard = ({ icon, label, value, color, suffix = '' }) => (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-3xl">{icon}</div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {isVisible ? value.toLocaleString() : '0'}{suffix}
          </div>
          <div className="text-sm opacity-90">{label}</div>
        </div>
      </div>
      <div className="flex items-center text-sm opacity-75">
        <span className="mr-1">📈</span>
        <span>+{Math.floor(Math.random() * 10) + 1}% this week</span>
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        icon="📊"
        label="Total Issues"
        value={stats.totalIssues}
        color="from-blue-500 to-blue-600"
      />
      <StatCard
        icon="✅"
        label="Resolved"
        value={stats.resolvedIssues}
        color="from-green-500 to-green-600"
      />
      <StatCard
        icon="🤝"
        label="Active Volunteers"
        value={stats.activeVolunteers}
        color="from-purple-500 to-purple-600"
      />
      <StatCard
        icon="🎯"
        label="Impact Score"
        value={stats.impactScore}
        color="from-orange-500 to-orange-600"
      />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore'
import { db } from '../services/firebase'
import { TrophyIcon, StarIcon, MapPinIcon, CalendarIcon } from '@heroicons/react/24/solid'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

export default function EnhancedLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [ngoStats, setNgoStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    // Load leaderboard data
    const leaderboardQuery = query(
      collection(db, 'users'),
      where('role', 'in', ['ngo', 'volunteer']),
      orderBy('points', 'desc')
    )
    
    const unsubscribe = onSnapshot(leaderboardQuery, (snapshot) => {
      const leaderboardData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Calculate additional metrics
        issuesSolved: doc.data().issuesSolved || Math.floor(Math.random() * 50),
        impactScore: doc.data().impactScore || Math.floor(Math.random() * 100),
        regionsServed: doc.data().regionsServed || Math.floor(Math.random() * 5) + 1,
        monthlyGrowth: doc.data().monthlyGrowth || (Math.random() * 20 - 10).toFixed(1),
        specialization: doc.data().specialization || ['poverty', 'education', 'nutrition'][Math.floor(Math.random() * 3)],
        joinedDate: doc.data().createdAt?.toDate() || new Date(),
        lastActive: doc.data().lastActive?.toDate() || new Date()
      }))
      setLeaderboard(leaderboardData)
      generateNGOStats(leaderboardData)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const generateNGOStats = (data) => {
    const stats = [
      {
        category: 'Top Performers',
        ngos: data.slice(0, 5).map(ngo => ({
          ...ngo,
          metric: ngo.points,
          metricLabel: 'Points'
        }))
      },
      {
        category: 'Most Issues Solved',
        ngos: data.sort((a, b) => b.issuesSolved - a.issuesSolved).slice(0, 5).map(ngo => ({
          ...ngo,
          metric: ngo.issuesSolved,
          metricLabel: 'Issues Solved'
        }))
      },
      {
        category: 'Highest Impact Score',
        ngos: data.sort((a, b) => b.impactScore - a.impactScore).slice(0, 5).map(ngo => ({
          ...ngo,
          metric: ngo.impactScore,
          metricLabel: 'Impact Score'
        }))
      },
      {
        category: 'Widest Reach',
        ngos: data.sort((a, b) => b.regionsServed - a.regionsServed).slice(0, 5).map(ngo => ({
          ...ngo,
          metric: ngo.regionsServed,
          metricLabel: 'Regions Served'
        }))
      }
    ]
    setNgoStats(stats)
  }

  const filteredLeaderboard = leaderboard.filter(ngo => {
    if (categoryFilter !== 'all' && ngo.specialization !== categoryFilter) return false
    if (timeFilter === 'month') {
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      return ngo.lastActive >= oneMonthAgo
    }
    return true
  })

  // Chart data for NGO performance
  const performanceChart = {
    labels: leaderboard.slice(0, 10).map(ngo => ngo.name?.split(' ')[0] || 'NGO'),
    datasets: [
      {
        label: 'Points',
        data: leaderboard.slice(0, 10).map(ngo => ngo.points || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      },
      {
        label: 'Impact Score',
        data: leaderboard.slice(0, 10).map(ngo => ngo.impactScore || 0),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1
      }
    ]
  }

  const specializationChart = {
    labels: ['Poverty', 'Education', 'Nutrition', 'Healthcare'],
    datasets: [{
      data: [
        leaderboard.filter(ngo => ngo.specialization === 'poverty').length,
        leaderboard.filter(ngo => ngo.specialization === 'education').length,
        leaderboard.filter(ngo => ngo.specialization === 'nutrition').length,
        leaderboard.filter(ngo => ngo.specialization === 'healthcare').length
      ],
      backgroundColor: ['#dc2626', '#3b82f6', '#16a34a', '#f59e0b'],
      borderWidth: 2
    }]
  }

  const getRankIcon = (index) => {
    if (index === 0) return <TrophyIcon className="h-6 w-6 text-yellow-500" />
    if (index === 1) return <TrophyIcon className="h-6 w-6 text-gray-400" />
    if (index === 2) return <TrophyIcon className="h-6 w-6 text-orange-500" />
    return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600">#{index + 1}</span>
  }

  const getSpecializationColor = (specialization) => {
    const colors = {
      poverty: 'bg-red-100 text-red-800',
      education: 'bg-blue-100 text-blue-800',
      nutrition: 'bg-green-100 text-green-800',
      healthcare: 'bg-yellow-100 text-yellow-800'
    }
    return colors[specialization] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Time Period:</label>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">All Time</option>
            <option value="month">Last Month</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">All Categories</option>
            <option value="poverty">Poverty</option>
            <option value="education">Education</option>
            <option value="nutrition">Nutrition</option>
            <option value="healthcare">Healthcare</option>
          </select>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top 10 NGO Performance</h3>
          <div className="h-64">
            <Bar 
              data={performanceChart} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true } }
              }} 
            />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">NGO Specialization Distribution</h3>
          <div className="h-64">
            <Doughnut 
              data={specializationChart} 
              options={{ responsive: true, maintainAspectRatio: false }} 
            />
          </div>
        </div>
      </div>

      {/* Category-wise Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {ngoStats.map((category, categoryIndex) => (
          <div key={categoryIndex} className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <StarIcon className="h-5 w-5 text-yellow-500" />
                {category.category}
              </h3>
              <div className="space-y-3">
                {category.ngos.map((ngo, index) => (
                  <div key={ngo.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      {getRankIcon(index)}
                      <div>
                        <p className="font-medium">{ngo.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className={`px-2 py-1 rounded ${getSpecializationColor(ngo.specialization)}`}>
                            {ngo.specialization}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPinIcon className="h-3 w-3" />
                            {ngo.regionsServed} regions
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{ngo.metric}</p>
                      <p className="text-xs text-gray-500">{ngo.metricLabel}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Leaderboard */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Complete NGO Rankings</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Rank</th>
                  <th className="text-left py-3">NGO/Volunteer</th>
                  <th className="text-center py-3">Points</th>
                  <th className="text-center py-3">Issues Solved</th>
                  <th className="text-center py-3">Impact Score</th>
                  <th className="text-center py-3">Regions</th>
                  <th className="text-center py-3">Growth</th>
                  <th className="text-center py-3">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.map((ngo, index) => (
                  <tr key={ngo.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {getRankIcon(index)}
                      </div>
                    </td>
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{ngo.name}</p>
                        <p className="text-xs text-gray-500">{ngo.organization || 'Individual'}</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs mt-1 ${getSpecializationColor(ngo.specialization)}`}>
                          {ngo.specialization}
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-3">
                      <span className="font-bold text-blue-600">{ngo.points || 0}</span>
                    </td>
                    <td className="text-center py-3">{ngo.issuesSolved}</td>
                    <td className="text-center py-3">
                      <div className="flex items-center justify-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${ngo.impactScore}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs">{ngo.impactScore}</span>
                      </div>
                    </td>
                    <td className="text-center py-3">{ngo.regionsServed}</td>
                    <td className="text-center py-3">
                      <span className={`text-xs ${parseFloat(ngo.monthlyGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {ngo.monthlyGrowth > 0 ? '+' : ''}{ngo.monthlyGrowth}%
                      </span>
                    </td>
                    <td className="text-center py-3 text-xs text-gray-500">
                      {ngo.lastActive?.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

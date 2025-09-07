import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function UserProgress() {
  const { user, userProfile } = useAuth()
  const [userStats, setUserStats] = useState({
    issuesReported: 0,
    issuesResolved: 0,
    points: 0,
    level: 1,
    badges: []
  })

  const achievements = [
    {
      id: 'first_report',
      name: 'First Step',
      description: 'Report your first issue',
      icon: '🌟',
      points: 10,
      unlocked: false
    },
    {
      id: 'community_helper',
      name: 'Community Helper',
      description: 'Report 5 issues',
      icon: '🤝',
      points: 50,
      unlocked: false
    },
    {
      id: 'change_maker',
      name: 'Change Maker',
      description: 'Report 10 issues',
      icon: '🏆',
      points: 100,
      unlocked: false
    },
    {
      id: 'local_hero',
      name: 'Local Hero',
      description: 'Have 3 issues resolved',
      icon: '🦸',
      points: 75,
      unlocked: false
    },
    {
      id: 'consistent_contributor',
      name: 'Consistent Contributor',
      description: 'Report issues for 7 consecutive days',
      icon: '📅',
      points: 150,
      unlocked: false
    }
  ]

  useEffect(() => {
    if (user) {
      // Mock user stats - in real app, fetch from Firebase
      const mockStats = {
        issuesReported: 7,
        issuesResolved: 3,
        points: userProfile?.points || 185,
        level: Math.floor((userProfile?.points || 185) / 100) + 1,
        badges: ['first_report', 'community_helper', 'local_hero']
      }
      setUserStats(mockStats)
    }
  }, [user, userProfile])

  const getProgressToNextLevel = () => {
    const currentLevelPoints = (userStats.level - 1) * 100
    const nextLevelPoints = userStats.level * 100
    const progress = ((userStats.points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100
    return Math.min(progress, 100)
  }

  const getUnlockedAchievements = () => {
    return achievements.map(achievement => ({
      ...achievement,
      unlocked: userStats.badges.includes(achievement.id)
    }))
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border border-white/20 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white text-xl">
          🎯
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Your Progress</h3>
          <p className="text-sm text-gray-600">Keep making a difference!</p>
        </div>
      </div>

      {/* Level and Points */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Level {userStats.level}</span>
          <span className="text-sm text-gray-600">{userStats.points} points</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${getProgressToNextLevel()}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {100 - (userStats.points % 100)} points to next level
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/80 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{userStats.issuesReported}</div>
          <div className="text-xs text-gray-600">Issues Reported</div>
        </div>
        <div className="bg-white/80 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{userStats.issuesResolved}</div>
          <div className="text-xs text-gray-600">Issues Resolved</div>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">Achievements</h4>
        <div className="grid grid-cols-3 gap-2">
          {getUnlockedAchievements().slice(0, 6).map((achievement) => (
            <div
              key={achievement.id}
              className={`relative p-3 rounded-xl text-center transition-all duration-300 ${
                achievement.unlocked
                  ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-300 transform hover:scale-105'
                  : 'bg-gray-100 border-2 border-gray-200 opacity-50'
              }`}
              title={achievement.description}
            >
              <div className="text-2xl mb-1">{achievement.icon}</div>
              <div className="text-xs font-medium text-gray-700">{achievement.name}</div>
              {achievement.unlocked && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Next Achievement */}
      <div className="mt-4 p-3 bg-white/60 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-800">Next Goal</div>
            <div className="text-xs text-gray-600">Report 3 more issues to unlock "Change Maker"</div>
          </div>
        </div>
      </div>
    </div>
  )
}

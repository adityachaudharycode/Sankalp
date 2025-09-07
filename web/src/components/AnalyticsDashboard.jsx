import { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { governmentSchemesService } from '../services/firebase'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement)

export default function AnalyticsDashboard() {
  const [povertyData, setPovertyData] = useState([])
  const [schemes, setSchemes] = useState([])
  const [educationMetrics, setEducationMetrics] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('poverty')

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      const [povertyResult, schemesResult, educationResult] = await Promise.all([
        governmentSchemesService.getPovertyData(),
        governmentSchemesService.getSchemes(),
        governmentSchemesService.getEducationMetrics()
      ])
      
      setPovertyData(povertyResult)
      setSchemes(schemesResult)
      setEducationMetrics(educationResult)
    } catch (error) {
      console.error('Error loading analytics data:', error)
    }
    setLoading(false)
  }

  // Poverty Analytics Charts
  const povertyRateChart = {
    labels: povertyData.map(d => d.region),
    datasets: [{
      label: 'Poverty Rate (%)',
      data: povertyData.map(d => d.povertyRate),
      backgroundColor: povertyData.map(d => 
        d.povertyRate > 20 ? '#dc2626' : 
        d.povertyRate > 15 ? '#f59e0b' : 
        d.povertyRate > 10 ? '#eab308' : '#16a34a'
      ),
      borderColor: '#374151',
      borderWidth: 1
    }]
  }

  const unemploymentChart = {
    labels: povertyData.map(d => d.region),
    datasets: [{
      label: 'Unemployment Rate (%)',
      data: povertyData.map(d => d.unemploymentRate),
      backgroundColor: 'rgba(239, 68, 68, 0.6)',
      borderColor: 'rgb(239, 68, 68)',
      borderWidth: 2,
      tension: 0.4
    }]
  }

  const literacyChart = {
    labels: povertyData.map(d => d.region),
    datasets: [{
      label: 'Literacy Rate (%)',
      data: povertyData.map(d => d.literacyRate),
      backgroundColor: 'rgba(34, 197, 94, 0.6)',
      borderColor: 'rgb(34, 197, 94)',
      borderWidth: 2,
      tension: 0.4
    }]
  }

  // Scheme Distribution Chart
  const schemeTypeDistribution = {
    labels: ['Poverty', 'Education', 'Nutrition', 'Healthcare'],
    datasets: [{
      data: [
        schemes.filter(s => s.type === 'poverty').length,
        schemes.filter(s => s.type === 'education').length,
        schemes.filter(s => s.type === 'nutrition').length,
        schemes.filter(s => s.type === 'healthcare').length
      ],
      backgroundColor: ['#dc2626', '#3b82f6', '#16a34a', '#f59e0b'],
      borderWidth: 2
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl text-white">
          <h3 className="text-lg font-semibold">Avg Poverty Rate</h3>
          <p className="text-3xl font-bold">
            {povertyData.length > 0 ? (povertyData.reduce((sum, d) => sum + d.povertyRate, 0) / povertyData.length).toFixed(1) : 0}%
          </p>
          <p className="text-red-100 text-sm">Across all regions</p>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white">
          <h3 className="text-lg font-semibold">Active Schemes</h3>
          <p className="text-3xl font-bold">{schemes.filter(s => s.status === 'active').length}</p>
          <p className="text-blue-100 text-sm">Government programs</p>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white">
          <h3 className="text-lg font-semibold">Avg Literacy</h3>
          <p className="text-3xl font-bold">
            {povertyData.length > 0 ? (povertyData.reduce((sum, d) => sum + d.literacyRate, 0) / povertyData.length).toFixed(1) : 0}%
          </p>
          <p className="text-green-100 text-sm">Education progress</p>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white">
          <h3 className="text-lg font-semibold">Total Budget</h3>
          <p className="text-3xl font-bold">
            ₹{schemes.length > 0 ? (schemes.reduce((sum, s) => sum + (s.budget || 0), 0) / 10000000000).toFixed(0) : 0}K Cr
          </p>
          <p className="text-orange-100 text-sm">Allocated funds</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'poverty', label: 'Poverty Analytics' },
          { id: 'education', label: 'Education Metrics' },
          { id: 'schemes', label: 'Scheme Impact' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart Content */}
      {activeTab === 'poverty' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-4">Poverty Rate by Region</h3>
            <div className="h-64">
              <Bar data={povertyRateChart} options={chartOptions} />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-4">Unemployment Trends</h3>
            <div className="h-64">
              <Line data={unemploymentChart} options={lineChartOptions} />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Regional Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Region</th>
                    <th className="text-right py-2">Population</th>
                    <th className="text-right py-2">Poverty Rate</th>
                    <th className="text-right py-2">Below Poverty Line</th>
                    <th className="text-right py-2">Unemployment</th>
                  </tr>
                </thead>
                <tbody>
                  {povertyData.map(region => (
                    <tr key={region.id} className="border-b">
                      <td className="py-2 font-medium">{region.region}</td>
                      <td className="text-right py-2">{(region.population / 1000000).toFixed(1)}M</td>
                      <td className="text-right py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          region.povertyRate > 20 ? 'bg-red-100 text-red-800' :
                          region.povertyRate > 15 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {region.povertyRate}%
                        </span>
                      </td>
                      <td className="text-right py-2">{(region.belowPovertyLine / 1000000).toFixed(1)}M</td>
                      <td className="text-right py-2">{region.unemploymentRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'education' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-4">Literacy Rate Trends</h3>
            <div className="h-64">
              <Line data={literacyChart} options={lineChartOptions} />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-4">Education vs Poverty Correlation</h3>
            <div className="space-y-4">
              {povertyData.map(region => (
                <div key={region.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">{region.region}</span>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-green-600">Literacy: {region.literacyRate}%</span>
                    <span className="text-red-600">Poverty: {region.povertyRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schemes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-4">Scheme Distribution by Type</h3>
            <div className="h-64">
              <Doughnut data={schemeTypeDistribution} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-4">Active Government Schemes</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {schemes.filter(s => s.status === 'active').map(scheme => (
                <div key={scheme.id} className="p-3 border rounded">
                  <h4 className="font-medium">{scheme.name}</h4>
                  <p className="text-sm text-gray-600">{scheme.description}</p>
                  <div className="flex justify-between items-center mt-2 text-xs">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{scheme.type}</span>
                    <span className="text-gray-500">₹{(scheme.budget / 10000000).toFixed(0)} Cr</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

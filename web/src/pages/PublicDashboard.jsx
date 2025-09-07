import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { db, storage, governmentSchemesService } from '../services/firebase'
import { collection, addDoc, query, where, onSnapshot, orderBy, doc, updateDoc, getDocs } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import MapView from '../components/MapView'
import EnhancedMapView from '../components/EnhancedMapView'
import NotificationSystem from '../components/NotificationSystem'
import UserProgress from '../components/UserProgress'
import CommunityStats from '../components/CommunityStats'
import DonationSystem from '../components/DonationSystem'
import AdminDataInitializer from '../components/AdminDataInitializer'
import { ChartBarIcon, MapIcon, TrophyIcon, Cog6ToothIcon, HeartIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import toast, { Toaster } from 'react-hot-toast'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement)

// Sample volunteers data
const sampleVolunteers = [
  {
    id: 'vol-1',
    name: 'Priya Sharma',
    ngoName: 'Hope Foundation',
    points: 2850,
    rank: 1,
    avatar: '👩‍⚕️',
    specialization: 'Healthcare',
    location: 'Delhi',
    completedProjects: 45,
    activeProjects: 3,
    joinedDate: '2023-01-15',
    works: [
      { title: 'Medical Camp in Slums', date: '2024-01-15', impact: '500+ people treated', type: 'healthcare' },
      { title: 'COVID Vaccination Drive', date: '2024-01-10', impact: '1000+ vaccinated', type: 'healthcare' },
      { title: 'Health Awareness Program', date: '2024-01-05', impact: '300+ educated', type: 'education' },
      { title: 'Emergency Medical Relief', date: '2023-12-20', impact: '200+ families helped', type: 'healthcare' },
      { title: 'Mental Health Workshop', date: '2023-12-15', impact: '150+ participants', type: 'healthcare' }
    ]
  },
  {
    id: 'vol-2',
    name: 'Rajesh Kumar',
    ngoName: 'Education First',
    points: 2650,
    rank: 2,
    avatar: '👨‍🏫',
    specialization: 'Education',
    location: 'Mumbai',
    completedProjects: 38,
    activeProjects: 4,
    joinedDate: '2023-02-20',
    works: [
      { title: 'Digital Literacy Program', date: '2024-01-12', impact: '800+ students trained', type: 'education' },
      { title: 'School Infrastructure Development', date: '2024-01-08', impact: '5 schools renovated', type: 'education' },
      { title: 'Teacher Training Workshop', date: '2024-01-03', impact: '100+ teachers trained', type: 'education' },
      { title: 'Scholarship Distribution', date: '2023-12-25', impact: '250+ students supported', type: 'education' },
      { title: 'Adult Literacy Campaign', date: '2023-12-18', impact: '400+ adults educated', type: 'education' }
    ]
  },
  {
    id: 'vol-3',
    name: 'Anita Patel',
    ngoName: 'Food for All',
    points: 2400,
    rank: 3,
    avatar: '👩‍🍳',
    specialization: 'Food Security',
    location: 'Ahmedabad',
    completedProjects: 42,
    activeProjects: 2,
    joinedDate: '2023-03-10',
    works: [
      { title: 'Community Kitchen Setup', date: '2024-01-14', impact: '2000+ meals daily', type: 'food' },
      { title: 'Nutrition Awareness Program', date: '2024-01-09', impact: '600+ families educated', type: 'education' },
      { title: 'Food Distribution Drive', date: '2024-01-04', impact: '1500+ families fed', type: 'food' },
      { title: 'Organic Farming Training', date: '2023-12-22', impact: '200+ farmers trained', type: 'education' },
      { title: 'Child Nutrition Program', date: '2023-12-16', impact: '800+ children supported', type: 'food' }
    ]
  },
  {
    id: 'vol-4',
    name: 'Vikram Singh',
    ngoName: 'Shelter Plus',
    points: 2200,
    rank: 4,
    avatar: '👨‍🔧',
    specialization: 'Housing & Infrastructure',
    location: 'Jaipur',
    completedProjects: 35,
    activeProjects: 5,
    joinedDate: '2023-04-05',
    works: [
      { title: 'Low-Cost Housing Project', date: '2024-01-11', impact: '100+ families housed', type: 'shelter' },
      { title: 'Water Supply System', date: '2024-01-06', impact: '50+ villages connected', type: 'infrastructure' },
      { title: 'Sanitation Facility Construction', date: '2024-01-01', impact: '200+ toilets built', type: 'infrastructure' },
      { title: 'Disaster Relief Shelter', date: '2023-12-28', impact: '500+ people sheltered', type: 'shelter' },
      { title: 'Community Center Development', date: '2023-12-20', impact: '10+ centers built', type: 'infrastructure' }
    ]
  },
  {
    id: 'vol-5',
    name: 'Meera Reddy',
    ngoName: 'Green Earth Initiative',
    points: 2050,
    rank: 5,
    avatar: '👩‍🌾',
    specialization: 'Environment & Sustainability',
    location: 'Hyderabad',
    completedProjects: 30,
    activeProjects: 3,
    joinedDate: '2023-05-12',
    works: [
      { title: 'Tree Plantation Drive', date: '2024-01-13', impact: '5000+ trees planted', type: 'environment' },
      { title: 'Waste Management Program', date: '2024-01-07', impact: '20+ communities covered', type: 'environment' },
      { title: 'Solar Energy Installation', date: '2024-01-02', impact: '100+ homes powered', type: 'environment' },
      { title: 'Water Conservation Project', date: '2023-12-24', impact: '30+ villages benefited', type: 'environment' },
      { title: 'Environmental Education', date: '2023-12-17', impact: '1000+ students educated', type: 'education' }
    ]
  },
  {
    id: 'vol-6',
    name: 'Arjun Gupta',
    ngoName: 'Tech for Good',
    points: 1900,
    rank: 6,
    avatar: '👨‍💻',
    specialization: 'Technology & Innovation',
    location: 'Bangalore',
    completedProjects: 28,
    activeProjects: 4,
    joinedDate: '2023-06-18',
    works: [
      { title: 'Digital Skills Training', date: '2024-01-10', impact: '600+ youth trained', type: 'education' },
      { title: 'E-Governance Solutions', date: '2024-01-05', impact: '15+ govt offices digitized', type: 'technology' },
      { title: 'Mobile App for NGOs', date: '2023-12-30', impact: '50+ NGOs connected', type: 'technology' },
      { title: 'Online Learning Platform', date: '2023-12-21', impact: '2000+ students enrolled', type: 'education' },
      { title: 'Tech Support for Schools', date: '2023-12-14', impact: '25+ schools upgraded', type: 'technology' }
    ]
  },
  {
    id: 'vol-7',
    name: 'Kavya Nair',
    ngoName: 'Women Empowerment Society',
    points: 1750,
    rank: 7,
    avatar: '👩‍💼',
    specialization: 'Women Empowerment',
    location: 'Kochi',
    completedProjects: 25,
    activeProjects: 2,
    joinedDate: '2023-07-22',
    works: [
      { title: 'Skill Development for Women', date: '2024-01-08', impact: '400+ women trained', type: 'education' },
      { title: 'Microfinance Program', date: '2024-01-03', impact: '200+ women entrepreneurs', type: 'economic' },
      { title: 'Self-Defense Training', date: '2023-12-26', impact: '300+ women trained', type: 'safety' },
      { title: 'Legal Awareness Campaign', date: '2023-12-19', impact: '500+ women educated', type: 'education' },
      { title: 'Healthcare for Mothers', date: '2023-12-12', impact: '250+ mothers supported', type: 'healthcare' }
    ]
  }
]

export default function PublicDashboard() {
  const { user, userProfile, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [issues, setIssues] = useState([])
  const [allIssues, setAllIssues] = useState([])
  const [solvedIssues, setSolvedIssues] = useState([])
  const [volunteers, setVolunteers] = useState(sampleVolunteers)
  const [selectedVolunteer, setSelectedVolunteer] = useState(null)
  const [showFundingModal, setShowFundingModal] = useState(false)
  const [fundingAmount, setFundingAmount] = useState('')
  const [fundingTarget, setFundingTarget] = useState(null)
  const [analytics, setAnalytics] = useState({
    totalIssues: 0,
    solvedIssues: 0,
    activeVolunteers: 0,
    totalFunding: 0
  })
  const [formData, setFormData] = useState({
    type: 'food',
    severity: 'medium',
    description: '',
    location: { lat: 22.5726, lng: 88.3639 },
    image: null
  })
  const [volunteerForm, setVolunteerForm] = useState({
    name: '',
    email: '',
    phone: '',
    skills: '',
    availability: 'weekends',
    experience: ''
  })
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [dataLoading, setDataLoading] = useState(true)

  // Load all issues for analytics and map view
  useEffect(() => {
    const unsubscribers = []
    console.log('🔄 Setting up Public Dashboard Firebase listeners...')

    try {
      // All issues listener
      const allIssuesQuery = collection(db, 'issues')
      const unsubscribeAll = onSnapshot(allIssuesQuery, (snapshot) => {
        const allIssuesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        console.log('📊 All issues loaded:', allIssuesData.length)
        setAllIssues(allIssuesData)

        // Filter user's issues
        if (user) {
          const userIssues = allIssuesData.filter(issue => issue.reporterUid === user.uid)
          setIssues(userIssues)
        }

        // Filter solved issues
        const solved = allIssuesData.filter(issue => issue.status === 'solved')
        setSolvedIssues(solved)

        // Update analytics
        setAnalytics(prev => ({
          ...prev,
          totalIssues: allIssuesData.length,
          solvedIssues: solved.length,
          activeVolunteers: sampleVolunteers.length,
          totalFunding: 2500000 // Sample total funding
        }))
      }, (error) => {
        console.error('❌ Error loading issues:', error)
        // Use mock data as fallback
        const mockIssues = [
          {
            id: 'mock-1',
            type: 'food',
            description: 'Food shortage in community center',
            severity: 'high',
            status: 'open',
            reportedBy: 'public',
            reporterName: 'Community Leader',
            region: 'Delhi',
            location: { latitude: 28.6139, longitude: 77.2090 },
            createdAt: new Date()
          },
          {
            id: 'mock-2',
            type: 'education',
            description: 'School needs educational supplies',
            severity: 'medium',
            status: 'solved',
            reportedBy: 'school',
            reporterName: 'School Principal',
            region: 'Mumbai',
            location: { latitude: 19.0760, longitude: 72.8777 },
            createdAt: new Date(),
            solvedBy: 'vol-1',
            solverName: 'Priya Sharma'
          }
        ]
        setAllIssues(mockIssues)
        setAnalytics(prev => ({
          ...prev,
          totalIssues: mockIssues.length,
          solvedIssues: 1,
          activeVolunteers: sampleVolunteers.length,
          totalFunding: 2500000
        }))
      })
      unsubscribers.push(unsubscribeAll)

    } catch (error) {
      console.error('❌ Error setting up listeners:', error)
    }

    setDataLoading(false)
    return () => unsubscribers.forEach(unsub => unsub())
  }, [user])

  // Funding functions
  const handleFunding = async () => {
    if (!fundingAmount || !fundingTarget) return

    try {
      setLoading(true)

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Add funding record to Firebase (in real app)
      await addDoc(collection(db, 'funding'), {
        donorUid: user?.uid || 'anonymous',
        donorName: userProfile?.name || 'Anonymous Donor',
        targetType: fundingTarget.type, // 'volunteer' or 'ngo'
        targetId: fundingTarget.id,
        targetName: fundingTarget.name,
        amount: parseFloat(fundingAmount),
        createdAt: new Date(),
        status: 'completed'
      })

      toast.success(`₹${fundingAmount} donated successfully to ${fundingTarget.name}!`)
      setShowFundingModal(false)
      setFundingAmount('')
      setFundingTarget(null)
    } catch (error) {
      console.error('Error processing funding:', error)
      toast.error('Failed to process donation. Please try again.')
    }
    setLoading(false)
  }

  // Volunteer application
  const handleVolunteerApplication = async (e) => {
    e.preventDefault()

    if (!volunteerForm.name || !volunteerForm.email || !volunteerForm.skills) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)

      await addDoc(collection(db, 'volunteerApplications'), {
        ...volunteerForm,
        applicantUid: user?.uid || 'anonymous',
        status: 'pending',
        createdAt: new Date()
      })

      toast.success('Volunteer application submitted successfully!')
      setVolunteerForm({
        name: '',
        email: '',
        phone: '',
        skills: '',
        availability: 'weekends',
        experience: ''
      })
      setActiveTab('dashboard')
    } catch (error) {
      console.error('Error submitting volunteer application:', error)
      toast.error('Failed to submit application. Please try again.')
    }
    setLoading(false)
  }

  // Get current location
  const getCurrentLocation = () => {
    setLocationLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }))
          setLocationLoading(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          setErrors(prev => ({ ...prev, location: 'Unable to get current location. Please select manually on map.' }))
          setLocationLoading(false)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    } else {
      setErrors(prev => ({ ...prev, location: 'Geolocation is not supported by this browser.' }))
      setLocationLoading(false)
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {}
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Calculate severity based on nearby issues
  const calculateSeverityFromLocation = async (location) => {
    try {
      // Define search radius (approximately 100 meters in lat/lng degrees)
      const searchRadius = 0.001 // ~111 meters at equator

      // Query for nearby issues within the radius
      const issuesRef = collection(db, 'issues')

      // Create multiple queries to handle Firestore's compound query limitations
      const nearbyIssues = []

      // Query for issues in the latitude range
      const latQuery = query(
        issuesRef,
        where('location.lat', '>=', location.lat - searchRadius),
        where('location.lat', '<=', location.lat + searchRadius)
      )

      const latSnapshot = await getDocs(latQuery)

      // Filter by longitude range manually (since Firestore doesn't support multiple range queries)
      latSnapshot.docs.forEach(doc => {
        const issueData = doc.data()
        const issueLng = issueData.location?.lng || issueData.location?.longitude

        if (issueLng >= location.lng - searchRadius &&
            issueLng <= location.lng + searchRadius) {
          nearbyIssues.push({
            id: doc.id,
            ...issueData
          })
        }
      })

      // Count issues by type for more accurate severity calculation
      const issuesByType = {}
      const totalNearbyCount = nearbyIssues.length

      nearbyIssues.forEach(issue => {
        const type = issue.type || 'other'
        issuesByType[type] = (issuesByType[type] || 0) + 1
      })

      // Calculate severity based on total count and issue clustering
      let severity = 'low'
      let severityReason = `${totalNearbyCount} issue(s) reported in this area`

      if (totalNearbyCount >= 8) {
        severity = 'high'
        severityReason = `Critical: ${totalNearbyCount} issues reported in this area - requires immediate attention`
      } else if (totalNearbyCount >= 5) {
        severity = 'medium'
        severityReason = `Moderate: ${totalNearbyCount} issues reported in this area - needs attention`
      } else if (totalNearbyCount >= 2) {
        severity = 'medium'
        severityReason = `${totalNearbyCount} issues reported in this area`
      } else {
        severity = 'low'
        severityReason = totalNearbyCount === 0 ? 'First report in this area' : '1 issue reported in this area'
      }

      // Additional severity boost for specific issue types in clusters
      const currentType = formData.type
      const sameTypeCount = issuesByType[currentType] || 0

      if (sameTypeCount >= 3) {
        severity = severity === 'low' ? 'medium' : 'high'
        severityReason += ` (${sameTypeCount} ${currentType} issues clustered)`
      }

      return {
        severity,
        severityReason,
        nearbyCount: totalNearbyCount,
        sameTypeCount,
        issuesByType
      }

    } catch (error) {
      console.error('Error calculating severity:', error)
      // Fallback to default severity
      return {
        severity: 'medium',
        severityReason: 'Unable to analyze nearby issues',
        nearbyCount: 0,
        sameTypeCount: 0,
        issuesByType: {}
      }
    }
  }
  // Enhanced handleSubmit with automatic severity calculation
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSuccessMessage('')

    if (!validateForm()) return

    setLoading(true)
    try {
      let imageUrl = null

      // Upload image if provided
      if (formData.image) {
        const imageRef = ref(storage, `issues/${user.uid}-${Date.now()}-${formData.image.name}`)
        await uploadBytes(imageRef, formData.image)
        imageUrl = await getDownloadURL(imageRef)
      }

      // Calculate severity based on nearby issues
      const severityData = await calculateSeverityFromLocation(formData.location)

      // Create the issue document with calculated severity
      await addDoc(collection(db, 'issues'), {
        type: formData.type,
        severity: severityData.severity,
        severityReason: severityData.severityReason,
        description: formData.description.trim(),
        location: formData.location,
        imageUrl,
        reporterUid: user.uid,
        reporterName: userProfile?.name || 'Anonymous',
        reporterEmail: user.email,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        // Additional metadata for analytics
        nearbyIssuesCount: severityData.nearbyCount,
        sameTypeIssuesCount: severityData.sameTypeCount,
        issuesByType: severityData.issuesByType
      })

      setFormData({
        type: 'food',
        severity: 'medium',
        description: '',
        location: { lat: 22.5726, lng: 88.3639 },
        image: null
      })

      // Reset file input
      const fileInput = document.getElementById('issue-image')
      if (fileInput) fileInput.value = ''

      // Show success message with severity information
      const severityEmoji = severityData.severity === 'high' ? '🚨' :
                           severityData.severity === 'medium' ? '⚠️' : '📝'

      setSuccessMessage(
        `${severityEmoji} Issue reported successfully! ` +
        `Severity: ${severityData.severity.toUpperCase()} - ${severityData.severityReason}`
      )
      setTimeout(() => setSuccessMessage(''), 8000)

    } catch (error) {
      console.error('Error reporting issue:', error)
      setErrors({ submit: 'Failed to report issue. Please try again.' })
    }
    setLoading(false)
  }



  const handleMapClick = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      location: { lat, lng }
    }))
    setErrors(prev => ({ ...prev, location: '' }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Image size must be less than 5MB' }))
        return
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'Please select a valid image file' }))
        return
      }
      setFormData(prev => ({ ...prev, image: file }))
      setErrors(prev => ({ ...prev, image: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
              S
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SANKALP Dashboard
              </h1>
              <p className="text-xs text-gray-500">Public User Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationSystem />
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">Welcome back!</p>
              <p className="text-xs text-gray-500">{userProfile?.name}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Community Stats */}
       

        {/* User Progress Widget */}
       

        {/* Enhanced Tab Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2 mb-8 bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-white/20">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            <ChartBarIcon className="w-5 h-5 mx-auto mb-1" />
            <span className="text-xs block">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'report'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            <span className="text-lg block mb-1">📢</span>
            <span className="text-xs block">Report</span>
          </button>
          <button
            onClick={() => setActiveTab('volunteer')}
            className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'volunteer'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            <UserGroupIcon className="w-5 h-5 mx-auto mb-1" />
            <span className="text-xs block">Volunteer</span>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            <TrophyIcon className="w-5 h-5 mx-auto mb-1" />
            <span className="text-xs block">Leaderboard</span>
          </button>
          <button
            onClick={() => setActiveTab('funding')}
            className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'funding'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            <HeartIcon className="w-5 h-5 mx-auto mb-1" />
            <span className="text-xs block">Fund</span>
          </button>
          <button
            onClick={() => setActiveTab('donate')}
            className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'donate'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            <span className="text-lg block mb-1">💝</span>
            <span className="text-xs block">Donate</span>
          </button>
          <button
            onClick={() => setActiveTab('my-issues')}
            className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'my-issues'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            <span className="text-lg block mb-1">📋</span>
            <span className="text-xs block">My Issues</span>
            {issues.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded-full mt-1 block">
                {issues.length}
              </span>
            )}
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {/* Admin Data Initializer (Development) */}
            {import.meta.env.DEV && <AdminDataInitializer />}

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Issues</p>
                    <p className="text-3xl font-bold">{analytics.totalIssues}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
                    📊
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Solved Issues</p>
                    <p className="text-3xl font-bold">{analytics.solvedIssues}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center">
                    ✅
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Active Volunteers</p>
                    <p className="text-3xl font-bold">{analytics.activeVolunteers}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-400 rounded-lg flex items-center justify-center">
                    👥
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Total Funding</p>
                    <p className="text-3xl font-bold">₹{(analytics.totalFunding / 100000).toFixed(1)}L</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-400 rounded-lg flex items-center justify-center">
                    💰
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Severity Analytics */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-xl">
                  🤖
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Smart Severity Analytics</h3>
                  <p className="text-sm text-gray-600">AI-powered issue prioritization based on location clustering</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🚨</span>
                    <span className="font-semibold text-red-800">High Priority</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {allIssues.filter(issue => issue.severity === 'high').length}
                  </p>
                  <p className="text-xs text-red-600">8+ reports in same area</p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">⚠️</span>
                    <span className="font-semibold text-yellow-800">Medium Priority</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {allIssues.filter(issue => issue.severity === 'medium').length}
                  </p>
                  <p className="text-xs text-yellow-600">5-7 reports in same area</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📝</span>
                    <span className="font-semibold text-blue-800">Low Priority</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {allIssues.filter(issue => issue.severity === 'low' || !issue.severity).length}
                  </p>
                  <p className="text-xs text-blue-600">1-4 reports in same area</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  <strong>How it works:</strong> Our AI analyzes the geographic clustering of reports within a 100-meter radius.
                  Multiple reports in the same location indicate higher community impact and urgency, automatically escalating priority levels.
                </p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Issues by Type</h3>
                <div className="h-64">
                  <Doughnut
                    data={{
                      labels: ['Food', 'Education', 'Healthcare', 'Shelter', 'Other'],
                      datasets: [{
                        data: [30, 25, 20, 15, 10],
                        backgroundColor: [
                          '#3B82F6',
                          '#10B981',
                          '#F59E0B',
                          '#EF4444',
                          '#8B5CF6'
                        ],
                        borderWidth: 0
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Monthly Progress</h3>
                <div className="h-64">
                  <Line
                    data={{
                      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                      datasets: [
                        {
                          label: 'Issues Reported',
                          data: [12, 19, 15, 25, 22, 30],
                          borderColor: '#3B82F6',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          tension: 0.4
                        },
                        {
                          label: 'Issues Solved',
                          data: [8, 15, 12, 20, 18, 25],
                          borderColor: '#10B981',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          tension: 0.4
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top'
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Map View */}
            {/* <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Community Issues Map</h3>
              <div className="h-96">
                <EnhancedMapView
                  issues={allIssues}
                  center={[22.5726, 88.3639]}
                  zoom={6}
                />
              </div>
            </div> */}
          </div>
        )}

        {activeTab === 'report' && (
          <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl">
                  📢
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Report New Issue</h2>
                  <p className="text-sm text-gray-600">Help us make your community better</p>
                </div>
              </div>

              {successMessage && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                  {successMessage}
                </div>
              )}

              {errors.submit && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {errors.submit}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="food">Food/Hunger</option>
                    <option value="education">Education</option>
                    <option value="shelter">Shelter</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {/* Smart Severity Information */}
                {/* <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🤖</span>
                    <h4 className="font-semibold text-gray-800">Smart Severity Detection</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Our system automatically calculates issue severity based on:
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• <strong>Location clustering:</strong> Number of nearby reports (within 100m)</li>
                    <li>• <strong>Issue type patterns:</strong> Similar issues in the same area</li>
                    <li>• <strong>Severity levels:</strong> Low (1-4 reports), Medium (5-7 reports), High (8+ reports)</li>
                  </ul>
                  <div className="mt-2 text-xs text-blue-600 font-medium">
                    ✨ No manual severity selection needed - we'll determine it for you!
                  </div>
                </div> */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, description: e.target.value }))
                      setErrors(prev => ({ ...prev, description: '' }))
                    }}
                    placeholder="Describe the issue in detail (minimum 10 characters)..."
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.description ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    rows="4"
                    required
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image (Optional)</label>
                  <input
                    id="issue-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.image ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  <p className="mt-1 text-xs text-gray-500">Max file size: 5MB. Supported formats: JPG, PNG, GIF</p>
                  {errors.image && (
                    <p className="mt-1 text-sm text-red-600">{errors.image}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={locationLoading}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {locationLoading ? 'Getting...' : '📍 Use Current Location'}
                    </button>
                    <span className="text-sm text-gray-500">or click on map to select</span>
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    📍 Lat: {formData.location.lat.toFixed(4)}, Lng: {formData.location.lng.toFixed(4)}
                  </p>
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Reporting...
                    </>
                  ) : (
                    <>
                      📤 Report Issue
                    </>
                  )}
                </button>
              </form>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center text-white text-lg">
                  🗺️
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Select Location</h3>
                  <p className="text-sm text-gray-600">Click on map or use GPS</p>
                </div>
              </div>
              <MapView
                center={[formData.location.lat, formData.location.lng]}
                markers={[{ ...formData.location, title: '📍 Selected Location', severity: 'medium' }]}
                onMapClick={handleMapClick}
                showCurrentLocation={true}
              />
            </div>
          </div>
        )}

        {/* Volunteer Application Tab */}
        {activeTab === 'volunteer' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 animate-fade-in">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center text-white text-xl">
                  🤝
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Become a Volunteer</h2>
                  <p className="text-sm text-gray-600">Join our community of changemakers</p>
                </div>
              </div>

              <form onSubmit={handleVolunteerApplication} className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={volunteerForm.name}
                    onChange={(e) => setVolunteerForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={volunteerForm.email}
                    onChange={(e) => setVolunteerForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={volunteerForm.phone}
                    onChange={(e) => setVolunteerForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                  <select
                    value={volunteerForm.availability}
                    onChange={(e) => setVolunteerForm(prev => ({ ...prev, availability: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="weekends">Weekends Only</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="flexible">Flexible</option>
                    <option value="full-time">Full Time</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills & Interests *</label>
                  <textarea
                    value={volunteerForm.skills}
                    onChange={(e) => setVolunteerForm(prev => ({ ...prev, skills: e.target.value }))}
                    placeholder="Describe your skills, interests, and how you'd like to help..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previous Experience</label>
                  <textarea
                    value={volunteerForm.experience}
                    onChange={(e) => setVolunteerForm(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="Tell us about any previous volunteer experience..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        🤝 Submit Application
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-white text-xl">
                  🏆
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Top Volunteers</h2>
                  <p className="text-sm text-gray-600">Recognize our community heroes</p>
                </div>
              </div>

              <div className="grid gap-4">
                {volunteers.map((volunteer, index) => (
                  <div
                    key={volunteer.id}
                    className="group bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                    onClick={() => setSelectedVolunteer(volunteer)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl">
                            {volunteer.avatar}
                          </div>
                          <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            volunteer.rank === 1 ? 'bg-yellow-500' :
                            volunteer.rank === 2 ? 'bg-gray-400' :
                            volunteer.rank === 3 ? 'bg-orange-600' : 'bg-blue-500'
                          }`}>
                            #{volunteer.rank}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">
                            {volunteer.name}
                          </h3>
                          <p className="text-sm text-gray-600">{volunteer.ngoName}</p>
                          <p className="text-xs text-gray-500">{volunteer.specialization} • {volunteer.location}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>✅ {volunteer.completedProjects} completed</span>
                            <span>🔄 {volunteer.activeProjects} active</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{volunteer.points}</div>
                        <div className="text-xs text-gray-500">points</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setFundingTarget({ type: 'volunteer', id: volunteer.id, name: volunteer.name })
                            setShowFundingModal(true)
                          }}
                          className="mt-2 px-3 py-1 bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs rounded-full hover:from-green-600 hover:to-blue-600 transition-all duration-300"
                        >
                          💰 Fund
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Funding Tab */}
        {activeTab === 'funding' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center text-white text-xl">
                  💰
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Support Our Cause</h2>
                  <p className="text-sm text-gray-600">Fund volunteers and NGOs making a difference</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {volunteers.slice(0, 6).map((volunteer) => (
                  <div key={volunteer.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                        {volunteer.avatar}
                      </div>
                      <h3 className="font-bold text-gray-800 mb-1">{volunteer.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{volunteer.ngoName}</p>
                      <p className="text-xs text-gray-500 mb-4">{volunteer.specialization}</p>

                      <div className="bg-gray-100 rounded-lg p-3 mb-4">
                        <div className="text-sm text-gray-600 mb-2">Recent Impact:</div>
                        <div className="text-xs text-gray-700">
                          {volunteer.works[0]?.impact || 'Making a difference'}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setFundingTarget({ type: 'volunteer', id: volunteer.id, name: volunteer.name })
                          setShowFundingModal(true)
                        }}
                        className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-all duration-300"
                      >
                        💰 Support {volunteer.name}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Blockchain Donation Tab */}
        {activeTab === 'donate' && (
          <div className="animate-fade-in">
            <DonationSystem />
          </div>
        )}

        {activeTab === 'my-issues' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 animate-fade-in">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white text-xl">
                  📋
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">My Reported Issues</h2>
                  <p className="text-sm text-gray-600">Track your community contributions</p>
                </div>
              </div>
              <div className="grid gap-4">
                {issues.map((issue, index) => (
                  <div
                    key={issue.id}
                    className="group bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                          {issue.type.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 capitalize group-hover:text-blue-600 transition-colors">
                            {issue.type} Issue
                          </h3>
                          <p className="text-xs text-gray-500">
                            {issue.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          issue.status === 'solved' ? 'bg-green-100 text-green-800' :
                          issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                          issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {issue.status === 'solved' ? '✅ Solved' :
                           issue.severity === 'high' ? '� High Priority' :
                           issue.severity === 'medium' ? '⚠️ Medium Priority' :
                           '📝 Low Priority'}
                        </span>
                        {issue.nearbyIssuesCount !== undefined && (
                          <span className="text-xs text-gray-500">
                            {issue.nearbyIssuesCount} nearby reports
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-3 group-hover:text-gray-700 transition-colors">
                      {issue.description}
                    </p>

                    {/* Severity Reasoning */}
                    {issue.severityReason && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">🤖</span>
                          <span className="text-xs font-medium text-gray-700">Smart Severity Analysis</span>
                        </div>
                        <p className="text-xs text-gray-600">{issue.severityReason}</p>
                        {issue.issuesByType && Object.keys(issue.issuesByType).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {Object.entries(issue.issuesByType).map(([type, count]) => (
                              <span key={type} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {type}: {count}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {issue.imageUrl && (
                      <div className="mt-3">
                        <img
                          src={issue.imageUrl}
                          alt="Issue"
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>📍</span>
                        <span>Lat: {issue.location?.lat?.toFixed(4)}, Lng: {issue.location?.lng?.toFixed(4)}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        ID: {issue.id.slice(-6)}
                      </div>
                    </div>
                  </div>
                ))}
                {issues.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">📝</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No issues reported yet</h3>
                    <p className="text-gray-500 mb-4">Start making a difference by reporting your first community issue!</p>
                    <button
                      onClick={() => setActiveTab('report')}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                    >
                      Report Your First Issue
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Volunteer Profile Modal */}
      {selectedVolunteer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl">
                    {selectedVolunteer.avatar}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedVolunteer.name}</h2>
                    <p className="text-gray-600">{selectedVolunteer.ngoName}</p>
                    <p className="text-sm text-gray-500">{selectedVolunteer.specialization} • {selectedVolunteer.location}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVolunteer(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedVolunteer.points}</div>
                  <div className="text-sm text-gray-600">Points</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedVolunteer.completedProjects}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{selectedVolunteer.activeProjects}</div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Work</h3>
                <div className="space-y-3">
                  {selectedVolunteer.works.map((work, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-800">{work.title}</h4>
                        <span className="text-xs text-gray-500">{work.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{work.impact}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        work.type === 'healthcare' ? 'bg-red-100 text-red-800' :
                        work.type === 'education' ? 'bg-blue-100 text-blue-800' :
                        work.type === 'food' ? 'bg-green-100 text-green-800' :
                        work.type === 'environment' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {work.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setFundingTarget({ type: 'volunteer', id: selectedVolunteer.id, name: selectedVolunteer.name })
                    setShowFundingModal(true)
                    setSelectedVolunteer(null)
                  }}
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-all duration-300"
                >
                  💰 Fund This Volunteer
                </button>
                <button
                  onClick={() => setSelectedVolunteer(null)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Funding Modal */}
      {showFundingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Support {fundingTarget?.name}</h2>
                <button
                  onClick={() => {
                    setShowFundingModal(false)
                    setFundingTarget(null)
                    setFundingAmount('')
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Donation Amount (₹)</label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[500, 1000, 2000].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setFundingAmount(amount.toString())}
                      className={`py-2 px-4 rounded-lg border transition-all duration-300 ${
                        fundingAmount === amount.toString()
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={fundingAmount}
                  onChange={(e) => setFundingAmount(e.target.value)}
                  placeholder="Enter custom amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleFunding}
                  disabled={!fundingAmount || loading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      💰 Donate ₹{fundingAmount}
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowFundingModal(false)
                    setFundingTarget(null)
                    setFundingAmount('')
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-right" />
    </div>
  )
}

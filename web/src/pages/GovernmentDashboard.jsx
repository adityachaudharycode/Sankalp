import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { db, governmentSchemesService } from '../services/firebase'
import { collection, query, onSnapshot, orderBy, where, doc, updateDoc, addDoc, getDocs } from 'firebase/firestore'
import { ChartBarIcon, MapIcon, TrophyIcon, UserGroupIcon, AcademicCapIcon, HeartIcon } from '@heroicons/react/24/outline'
import toast, { Toaster } from 'react-hot-toast'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import EnhancedMapView from '../components/EnhancedMapView'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement)

// Sample volunteers data (same as PublicDashboard)
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

export default function GovernmentDashboard() {
  const { user, userProfile, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [issues, setIssues] = useState([])
  const [volunteers, setVolunteers] = useState(sampleVolunteers)
  const [schools, setSchools] = useState([])
  const [meals, setMeals] = useState([])
  const [attendance, setAttendance] = useState([])
  const [bmiRecords, setBmiRecords] = useState([])
  const [selectedVolunteer, setSelectedVolunteer] = useState(null)
  const [publicUsers, setPublicUsers] = useState([])
  const [ngoUsers, setNgoUsers] = useState([])
  const [allIssues, setAllIssues] = useState([])
  // NGO Image Approval System
  const [pendingImages, setPendingImages] = useState([])
  const [approvedImages, setApprovedImages] = useState([])
  const [rejectedImages, setRejectedImages] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [approvalLoading, setApprovalLoading] = useState(false)

  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalIssues: 0,
    solvedIssues: 0,
    totalVolunteers: 0,
    totalSchools: 0,
    totalFunding: 2500000
  })

  useEffect(() => {
    const unsubscribers = []
    console.log('🔄 Setting up Government Dashboard Firebase listeners...')

    try {
      // Load all issues
      const issuesQuery = collection(db, 'issues')
      const unsubscribeIssues = onSnapshot(issuesQuery, (snapshot) => {
        const issuesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        console.log('📊 All issues loaded:', issuesData.length)
        setIssues(issuesData)
        setAllIssues(issuesData)

        // Update analytics
        const solved = issuesData.filter(issue => issue.status === 'solved')
        setAnalytics(prev => ({
          ...prev,
          totalIssues: issuesData.length,
          solvedIssues: solved.length
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
        setIssues(mockIssues)
        setAllIssues(mockIssues)
        setAnalytics(prev => ({
          ...prev,
          totalIssues: mockIssues.length,
          solvedIssues: 1
        }))
      })
      unsubscribers.push(unsubscribeIssues)

      // Load all users (public, NGO, school)
      const usersQuery = collection(db, 'users')
      const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        const publicUsers = usersData.filter(user => user.role === 'public')
        const ngoUsers = usersData.filter(user => user.role === 'ngo')
        const schoolUsers = usersData.filter(user => user.role === 'school')

        console.log('👥 Users loaded:', {
          public: publicUsers.length,
          ngo: ngoUsers.length,
          school: schoolUsers.length
        })

        setPublicUsers(publicUsers)
        setNgoUsers(ngoUsers)
        setSchools(schoolUsers)

        // Merge Firebase volunteers with sample volunteers
        const firebaseVolunteers = ngoUsers.sort((a, b) => (b.points || 0) - (a.points || 0))
        const mergedVolunteers = [...sampleVolunteers, ...firebaseVolunteers]
        setVolunteers(mergedVolunteers)

        setAnalytics(prev => ({
          ...prev,
          totalUsers: usersData.length,
          totalVolunteers: ngoUsers.length + sampleVolunteers.length,
          totalSchools: schoolUsers.length
        }))
      }, (error) => {
        console.error('❌ Error loading users:', error)
        // Keep sample data
        setAnalytics(prev => ({
          ...prev,
          totalUsers: 150, // Mock total users
          totalVolunteers: sampleVolunteers.length,
          totalSchools: 25 // Mock schools
        }))
      })
      unsubscribers.push(unsubscribeUsers)

      // Load NGO image submissions
      const ngoImagesQuery = collection(db, 'ngo_image_submissions')
      const unsubscribeImages = onSnapshot(ngoImagesQuery, (snapshot) => {
        const imagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        const pending = imagesData.filter(img => img.status === 'pending')
        const approved = imagesData.filter(img => img.status === 'approved')
        const rejected = imagesData.filter(img => img.status === 'rejected')

        setPendingImages(pending)
        setApprovedImages(approved)
        setRejectedImages(rejected)

        console.log('📸 NGO Images loaded:', {
          pending: pending.length,
          approved: approved.length,
          rejected: rejected.length
        })
      }, (error) => {
        console.error('❌ Error loading NGO images:', error)
      })
      unsubscribers.push(unsubscribeImages)

      // Load meal records
      const mealsQuery = collection(db, 'schoolMeals')
      const unsubscribeMeals = onSnapshot(mealsQuery, (snapshot) => {
        const mealsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        console.log('🍽️ Meals loaded:', mealsData.length)
        setMeals(mealsData)
      }, (error) => {
        console.error('❌ Error loading meals:', error)
        // Mock meal data
        const mockMeals = [
          {
            id: 'meal-1',
            schoolName: 'Delhi Public School',
            date: new Date(),
            reportedMeals: 150,
            modelCount: 148,
            discrepancyFlag: false
          },
          {
            id: 'meal-2',
            schoolName: 'Mumbai International School',
            date: new Date(),
            reportedMeals: 200,
            modelCount: 180,
            discrepancyFlag: true
          }
        ]
        setMeals(mockMeals)
      })
      unsubscribers.push(unsubscribeMeals)

      // Load attendance records
      const attendanceQuery = collection(db, 'schoolAttendance')
      const unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
        const attendanceData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        console.log('📚 Attendance loaded:', attendanceData.length)
        setAttendance(attendanceData)
      }, (error) => {
        console.error('❌ Error loading attendance:', error)
        setAttendance([]) // Empty fallback
      })
      unsubscribers.push(unsubscribeAttendance)

      // Load BMI records
      const bmiQuery = collection(db, 'bmiRecords')
      const unsubscribeBmi = onSnapshot(bmiQuery, (snapshot) => {
        const bmiData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        console.log('🏥 BMI records loaded:', bmiData.length)
        setBmiRecords(bmiData)
      }, (error) => {
        console.error('❌ Error loading BMI records:', error)
        // Mock BMI data
        const mockBMI = [
          {
            id: 'bmi-1',
            studentName: 'Rahul Sharma',
            schoolName: 'Delhi Public School',
            className: '5th',
            section: 'A',
            bmi: 18.5,
            month: new Date(),
            flagged: false
          },
          {
            id: 'bmi-2',
            studentName: 'Priya Patel',
            schoolName: 'Mumbai International School',
            className: '6th',
            section: 'B',
            bmi: 14.2,
            month: new Date(),
            flagged: true
          }
        ]
        setBmiRecords(mockBMI)
      })
      unsubscribers.push(unsubscribeBmi)

    } catch (error) {
      console.error('❌ Error setting up Government Dashboard listeners:', error)
    }

    return () => unsubscribers.forEach(unsub => unsub())
  }, [])

  // NGO Image Approval Functions with Enhanced Debugging
  const handleImageApproval = async (imageId, action, points = 0) => {
    console.log('🔄 Starting approval process:', { imageId, action, points })
    setApprovalLoading(true)

    try {
      // Validate inputs
      if (!imageId) {
        throw new Error('Image ID is required')
      }

      if (!user?.uid) {
        throw new Error('User not authenticated')
      }

      const imageRef = doc(db, 'ngo_image_submissions', imageId)
      const image = pendingImages.find(img => img.id === imageId)

      console.log('📋 Found image:', image)

      if (!image) {
        toast.error('Image not found in pending list')
        console.error('❌ Image not found in pendingImages:', imageId)
        return
      }

      console.log('📝 Updating image status...')
      // Update image status
      await updateDoc(imageRef, {
        status: action,
        points: action === 'approved' ? points : 0,
        reviewedAt: new Date(),
        reviewedBy: user.uid
      })
      console.log('✅ Image status updated successfully')

      // If approved, update NGO points
      if (action === 'approved' && points > 0) {
        console.log('💰 Processing NGO points update...')

        // Find or create NGO profile
        const ngoQuery = query(
          collection(db, 'ngo_profiles'),
          where('uid', '==', image.ngoUid)
        )

        console.log('🔍 Searching for NGO profile:', image.ngoUid)
        const ngoSnapshot = await getDocs(ngoQuery)

        if (!ngoSnapshot.empty) {
          // Update existing NGO profile
          console.log('📊 Updating existing NGO profile...')
          const ngoDoc = ngoSnapshot.docs[0]
          const currentData = ngoDoc.data()
          const currentPoints = currentData.points || 0
          const currentApproved = currentData.approvedSubmissions || 0

          await updateDoc(doc(db, 'ngo_profiles', ngoDoc.id), {
            points: currentPoints + points,
            approvedSubmissions: currentApproved + 1,
            lastUpdated: new Date()
          })
          console.log(`✅ NGO profile updated: ${currentPoints} + ${points} = ${currentPoints + points} points`)
        } else {
          // Create new NGO profile
          console.log('🆕 Creating new NGO profile...')
          const newProfile = {
            uid: image.ngoUid,
            organization: image.ngoName,
            email: image.ngoEmail,
            points: points,
            approvedSubmissions: 1,
            pendingSubmissions: 0,
            joinedDate: new Date().toISOString().split('T')[0],
            location: 'India',
            createdAt: new Date(),
            lastUpdated: new Date()
          }

          const docRef = await addDoc(collection(db, 'ngo_profiles'), newProfile)
          console.log('✅ New NGO profile created:', docRef.id, newProfile)
        }
      }

      toast.success(`Image ${action} successfully! ${points > 0 ? `+${points} points awarded` : ''}`)
      setSelectedImage(null)
      console.log('🎉 Approval process completed successfully')

    } catch (error) {
      console.error('❌ Error in approval process:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      })

      let errorMessage = 'Failed to update image status'
      if (error.message.includes('permission')) {
        errorMessage = 'Permission denied. Please check your access rights.'
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection.'
      } else if (error.message.includes('authenticated')) {
        errorMessage = 'Please log out and log back in.'
      }

      toast.error(errorMessage)
    }
    setApprovalLoading(false)
  }

  // Test function to create sample NGO submission (for debugging)
  const createTestSubmission = async () => {
    try {
      console.log('🧪 Creating test NGO submission...')
      const testSubmission = {
        ngoUid: 'test-ngo-uid-123',
        ngoName: 'Test NGO Foundation',
        ngoEmail: 'test@ngo.com',
        title: 'Test Community Health Camp',
        description: 'This is a test submission to verify the approval system is working correctly.',
        category: 'healthcare',
        imageUrl: 'https://via.placeholder.com/400x300/4CAF50/white?text=Test+NGO+Image',
        status: 'pending',
        points: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const docRef = await addDoc(collection(db, 'ngo_image_submissions'), testSubmission)
      console.log('✅ Test submission created:', docRef.id)
      toast.success('Test submission created successfully!')
    } catch (error) {
      console.error('❌ Error creating test submission:', error)
      toast.error('Failed to create test submission')
    }
  }

  const stats = {
    totalUsers: analytics.totalUsers,
    totalIssues: analytics.totalIssues,
    solvedIssues: analytics.solvedIssues,
    totalVolunteers: analytics.totalVolunteers,
    totalSchools: analytics.totalSchools,
    totalMealsServed: meals.reduce((sum, m) => sum + (m.reportedMeals || 0), 0),
    flaggedMeals: meals.filter(m => m.discrepancyFlag).length,
    flaggedBMI: bmiRecords.filter(b => b.flagged).length,
    totalFunding: analytics.totalFunding
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
              🏛️
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Government Dashboard
              </h1>
              <p className="text-xs text-gray-500">Administrative Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
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
        {/* Enhanced Tab Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2 mb-8 bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-white/20">
          {[
            { key: 'overview', label: 'Overview', icon: ChartBarIcon },
            { key: 'issues', label: 'Issues', icon: '📊' },
            { key: 'ngo-approval', label: 'NGO Approval', icon: '📸' },
            { key: 'leaderboard', label: 'Leaderboard', icon: TrophyIcon },
            { key: 'volunteers', label: 'Volunteers', icon: UserGroupIcon },
            { key: 'schools', label: 'Schools', icon: AcademicCapIcon },
            { key: 'meals', label: 'Meals', icon: '🍽️' },
            { key: 'health', label: 'Health', icon: HeartIcon }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              {typeof tab.icon === 'string' ? (
                <span className="text-lg block mb-1">{tab.icon}</span>
              ) : (
                <tab.icon className="w-5 h-5 mx-auto mb-1" />
              )}
              <span className="text-xs block">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Enhanced Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Users</p>
                    <p className="text-3xl font-bold">{stats.totalUsers}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
                    👥
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Total Issues</p>
                    <p className="text-3xl font-bold">{stats.totalIssues}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center">
                    📊
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Solved Issues</p>
                    <p className="text-3xl font-bold">{stats.solvedIssues}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-400 rounded-lg flex items-center justify-center">
                    ✅
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Active Volunteers</p>
                    <p className="text-3xl font-bold">{stats.totalVolunteers}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-400 rounded-lg flex items-center justify-center">
                    🤝
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm">Total Funding</p>
                    <p className="text-3xl font-bold">₹{(stats.totalFunding / 100000).toFixed(1)}L</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-400 rounded-lg flex items-center justify-center">
                    💰
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Registered Schools" value={stats.totalSchools} color="blue" />
              <StatCard title="Total Meals Served" value={stats.totalMealsServed} color="green" />
              <StatCard title="Flagged Records" value={stats.flaggedMeals + stats.flaggedBMI} color="red" />
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
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-gray-800 mb-4">National Issues Map</h3>
              <div className="h-96">
                <EnhancedMapView
                  issues={allIssues}
                  center={[22.5726, 88.3639]}
                  zoom={5}
                />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {issues.slice(0, 5).map(issue => (
                  <div key={issue.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-300">
                    <div>
                      <p className="font-medium capitalize">{issue.type} issue reported</p>
                      <p className="text-sm text-gray-600">by {issue.reporterName}</p>
                      <p className="text-xs text-gray-500">{issue.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      issue.status === 'solved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {issue.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ngo-approval' && (
          <div className="space-y-6 animate-fade-in">
            {/* NGO Approval Statistics */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Pending Review</h3>
                    <p className="text-3xl font-bold">{pendingImages.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center text-2xl">
                    ⏳
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Approved</h3>
                    <p className="text-3xl font-bold">{approvedImages.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center text-2xl">
                    ✅
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Rejected</h3>
                    <p className="text-3xl font-bold">{rejectedImages.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-400 rounded-lg flex items-center justify-center text-2xl">
                    ❌
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Images for Review */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Images Pending Review</h3>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500">
                    Total: {pendingImages.length} pending, {approvedImages.length} approved, {rejectedImages.length} rejected
                  </div>
                  {import.meta.env.DEV && (
                    <button
                      onClick={createTestSubmission}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Create Test Submission
                    </button>
                  )}
                </div>
              </div>

              {/* Debug Information */}
              {import.meta.env.DEV && (
                <div className="mb-4 p-3 bg-gray-100 rounded-lg text-xs">
                  <strong>Debug Info:</strong>
                  Pending: {pendingImages.length},
                  User: {user?.uid ? 'Authenticated' : 'Not authenticated'},
                  Loading: {approvalLoading ? 'Yes' : 'No'}
                  {pendingImages.length > 0 && (
                    <div className="mt-1">
                      Sample image: {JSON.stringify(pendingImages[0], null, 2).substring(0, 200)}...
                    </div>
                  )}
                </div>
              )}

              {pendingImages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">📸</div>
                  <p className="text-lg">No pending submissions</p>
                  <p className="text-sm">All NGO submissions have been reviewed</p>
                  <div className="mt-4 text-xs text-gray-400">
                    If you expect to see submissions here, check:
                    <ul className="mt-2 text-left inline-block">
                      <li>• NGOs have uploaded images</li>
                      <li>• Images have 'pending' status</li>
                      <li>• Database connection is working</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingImages.map((image) => (
                    <div key={image.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                      <img
                        src={image.imageUrl}
                        alt={image.title}
                        className="w-full h-48 object-cover cursor-pointer"
                        onClick={() => setSelectedImage(image)}
                      />
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-800 mb-2">{image.title}</h4>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{image.description}</p>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {image.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(image.createdAt?.toDate()).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                          <p><strong>NGO:</strong> {image.ngoName}</p>
                          <p><strong>Email:</strong> {image.ngoEmail}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              console.log('🔘 Approve button clicked for image:', image.id)
                              handleImageApproval(image.id, 'approved', 25)
                            }}
                            disabled={approvalLoading}
                            className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                          >
                            {approvalLoading ? 'Processing...' : 'Approve (+25 pts)'}
                          </button>
                          <button
                            onClick={() => {
                              console.log('🔘 Reject button clicked for image:', image.id)
                              handleImageApproval(image.id, 'rejected', 0)
                            }}
                            disabled={approvalLoading}
                            className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            {approvalLoading ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recently Approved Images */}
            {approvedImages.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Recently Approved</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {approvedImages.slice(0, 8).map((image) => (
                    <div key={image.id} className="border border-green-200 rounded-lg overflow-hidden">
                      <img
                        src={image.imageUrl}
                        alt={image.title}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-3">
                        <h5 className="font-medium text-sm text-gray-800 mb-1">{image.title}</h5>
                        <p className="text-xs text-gray-600 mb-2">{image.ngoName}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            +{image.points} pts
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(image.reviewedAt?.toDate()).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">All Issues</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Reporter</th>
                      <th className="text-left p-2">Severity</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Solver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map(issue => (
                      <tr key={issue.id} className="border-b">
                        <td className="p-2 capitalize">{issue.type}</td>
                        <td className="p-2">{issue.reporterName}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                            issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {issue.severity}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            issue.status === 'solved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {issue.status}
                          </span>
                        </td>
                        <td className="p-2">{issue.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</td>
                        <td className="p-2">{issue.solverName || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Comprehensive Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-white text-xl">
                  🏆
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">National Volunteer Leaderboard</h2>
                  <p className="text-sm text-gray-600">Top performers across all regions</p>
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
                            {volunteer.avatar || '👤'}
                          </div>
                          <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            volunteer.rank === 1 ? 'bg-yellow-500' :
                            volunteer.rank === 2 ? 'bg-gray-400' :
                            volunteer.rank === 3 ? 'bg-orange-600' : 'bg-blue-500'
                          }`}>
                            #{volunteer.rank || index + 1}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">
                            {volunteer.name}
                          </h3>
                          <p className="text-sm text-gray-600">{volunteer.ngoName || volunteer.organization || 'Independent'}</p>
                          <p className="text-xs text-gray-500">{volunteer.specialization || 'General'} • {volunteer.location || 'India'}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>✅ {volunteer.completedProjects || 0} completed</span>
                            <span>🔄 {volunteer.activeProjects || 0} active</span>
                            <span>📅 Since {volunteer.joinedDate || '2023'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{volunteer.points || 0}</div>
                        <div className="text-xs text-gray-500">points</div>
                        <div className="mt-2 text-xs text-gray-400">
                          {volunteer.email || 'Contact via NGO'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Analytics */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Top Performers by Category</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Healthcare</span>
                    <span className="font-medium">Priya Sharma</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Education</span>
                    <span className="font-medium">Rajesh Kumar</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Food Security</span>
                    <span className="font-medium">Anita Patel</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Infrastructure</span>
                    <span className="font-medium">Vikram Singh</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Regional Distribution</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Delhi</span>
                    <span className="font-medium">1 volunteer</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Mumbai</span>
                    <span className="font-medium">1 volunteer</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Bangalore</span>
                    <span className="font-medium">1 volunteer</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Others</span>
                    <span className="font-medium">{volunteers.length - 3} volunteers</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Impact Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Projects</span>
                    <span className="font-medium">{volunteers.reduce((sum, v) => sum + (v.completedProjects || 0), 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Projects</span>
                    <span className="font-medium">{volunteers.reduce((sum, v) => sum + (v.activeProjects || 0), 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Points</span>
                    <span className="font-medium">{volunteers.reduce((sum, v) => sum + (v.points || 0), 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Points</span>
                    <span className="font-medium">{Math.round(volunteers.reduce((sum, v) => sum + (v.points || 0), 0) / volunteers.length)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'volunteers' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Volunteer Leaderboard</h2>
              <div className="space-y-3">
                {volunteers.map((volunteer, index) => (
                  <div key={volunteer.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{volunteer.name}</p>
                        <p className="text-sm text-gray-600">{volunteer.organization || 'Individual'}</p>
                        <p className="text-xs text-gray-500">{volunteer.email}</p>
                      </div>
                    </div>
                    <span className="font-bold text-blue-600">{volunteer.points || 0} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schools' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Registered Schools</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {schools.map(school => (
                  <div key={school.id} className="p-4 border rounded">
                    <h3 className="font-medium">{school.schoolName}</h3>
                    <p className="text-sm text-gray-600">Registration: {school.registrationNumber}</p>
                    <p className="text-sm text-gray-600">Contact: {school.name}</p>
                    <p className="text-sm text-gray-600">Email: {school.email}</p>
                    <p className="text-sm text-gray-600">Phone: {school.phone}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meals' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Meal Distribution Records</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">School</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Reported</th>
                      <th className="text-left p-2">YOLO Count</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meals.map(meal => (
                      <tr key={meal.id} className="border-b">
                        <td className="p-2">{meal.schoolName}</td>
                        <td className="p-2">{meal.date?.toDate?.()?.toLocaleDateString() || 'Unknown'}</td>
                        <td className="p-2">{meal.reportedMeals}</td>
                        <td className="p-2">{meal.modelCount}</td>
                        <td className="p-2">
                          {meal.discrepancyFlag ? (
                            <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                              Flagged
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Student Health Records</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Student</th>
                      <th className="text-left p-2">School</th>
                      <th className="text-left p-2">Class</th>
                      <th className="text-left p-2">BMI</th>
                      <th className="text-left p-2">Month</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bmiRecords.map(record => (
                      <tr key={record.id} className="border-b">
                        <td className="p-2">{record.studentName}</td>
                        <td className="p-2">{record.schoolName || 'Unknown'}</td>
                        <td className="p-2">{record.className} - {record.section}</td>
                        <td className="p-2">{record.bmi}</td>
                        <td className="p-2">
                          {record.month?.toDate?.()?.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) || 'Unknown'}
                        </td>
                        <td className="p-2">
                          {record.flagged ? (
                            <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                              Needs Inspection
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    {selectedVolunteer.avatar || '👤'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedVolunteer.name}</h2>
                    <p className="text-gray-600">{selectedVolunteer.ngoName || selectedVolunteer.organization || 'Independent'}</p>
                    <p className="text-sm text-gray-500">{selectedVolunteer.specialization || 'General'} • {selectedVolunteer.location || 'India'}</p>
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
                  <div className="text-2xl font-bold text-blue-600">{selectedVolunteer.points || 0}</div>
                  <div className="text-sm text-gray-600">Points</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedVolunteer.completedProjects || 0}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{selectedVolunteer.activeProjects || 0}</div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
              </div>

              {selectedVolunteer.works && (
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
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedVolunteer(null)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    toast.success(`Recognition sent to ${selectedVolunteer.name}!`)
                    setSelectedVolunteer(null)
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                >
                  🏆 Send Recognition
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Detail Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Review Submission</h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.title}
                    className="w-full rounded-lg shadow-lg"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Title</h4>
                    <p className="text-gray-600">{selectedImage.title}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Description</h4>
                    <p className="text-gray-600">{selectedImage.description}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Category</h4>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {selectedImage.category}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">NGO Information</h4>
                    <p className="text-gray-600"><strong>Name:</strong> {selectedImage.ngoName}</p>
                    <p className="text-gray-600"><strong>Email:</strong> {selectedImage.ngoEmail}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Submission Date</h4>
                    <p className="text-gray-600">
                      {new Date(selectedImage.createdAt?.toDate()).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleImageApproval(selectedImage.id, 'approved', 50)}
                      disabled={approvalLoading}
                      className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {approvalLoading ? 'Processing...' : 'Approve (+50 pts)'}
                    </button>
                    <button
                      onClick={() => handleImageApproval(selectedImage.id, 'approved', 25)}
                      disabled={approvalLoading}
                      className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {approvalLoading ? 'Processing...' : 'Approve (+25 pts)'}
                    </button>
                    <button
                      onClick={() => handleImageApproval(selectedImage.id, 'rejected', 0)}
                      disabled={approvalLoading}
                      className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {approvalLoading ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-right" />
    </div>
  )
}

function StatCard({ title, value, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600'
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  )
}

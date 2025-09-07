import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { db, storage, governmentSchemesService } from '../services/firebase'
import { collection, query, onSnapshot, doc, updateDoc, orderBy, where, addDoc, getDocs } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import MapView from '../components/MapView'
import EnhancedMapView from '../components/EnhancedMapView'
import NGOFundManagement from '../components/NGOFundManagement'
// EnhancedLeaderboard component removed - using inline leaderboard
import { ChartBarIcon, MapIcon, TrophyIcon, Cog6ToothIcon, PhotoIcon, StarIcon } from '@heroicons/react/24/outline'
import toast, { Toaster } from 'react-hot-toast'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement)

// Sample volunteers data (same as PublicDashboard and GovernmentDashboard)
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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dashboard Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg">
          <h2>Something went wrong.</h2>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default function NGODashboard() {
  const authContext = useAuth()

  // For testing purposes, create mock user if no auth context
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@ngo.com'
  }

  const mockUserProfile = {
    name: 'Test NGO User',
    role: 'ngo',
    points: 50,
    organization: 'Test NGO'
  }

  const user = authContext?.user || mockUser
  const userProfile = authContext?.userProfile || mockUserProfile
  const logout = authContext?.logout || (() => console.log('Mock logout'))
  const [activeTab, setActiveTab] = useState('dashboard')
  const [issues, setIssues] = useState([])
  const [leaderboard, setLeaderboard] = useState(sampleVolunteers)
  const [selectedVolunteer, setSelectedVolunteer] = useState(null)
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [verificationImage, setVerificationImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [mapLayer, setMapLayer] = useState('issues')
  const [povertyData, setPovertyData] = useState([])
  const [schemes, setSchemes] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [solvedIssues, setSolvedIssues] = useState([])
  const [selectedAnalyticBox, setSelectedAnalyticBox] = useState(null)
  const [filteredAnalyticIssues, setFilteredAnalyticIssues] = useState([])

  // Debug logging
  console.log('🔍 NGODashboard Debug:', {
    user: user?.uid,
    userProfile: userProfile?.role,
    issuesCount: issues.length,
    solvedIssuesCount: solvedIssues.length,
    dataLoading,
    povertyDataCount: povertyData.length
  })

  // Real-time dynamic analytics state
  const [realTimeAnalytics, setRealTimeAnalytics] = useState({
    activeCases: 0,
    solvedByThisNGO: 0,
    mostCommonCases: [],
    regionalData: []
  })
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  // Add this state at the beginning with other state declarations
  const [analytics, setAnalytics] = useState({
    publicCases: 0,
    schoolCases: 0,
    currentNgoSolved: 0,
    totalActiveIssues: 0,
    mostCommonByRegion: {},
    underservedCommunities: []
  })

  // Add to state declarations
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Image upload and points system states
  const [uploadedImages, setUploadedImages] = useState([])
  const [imageUploadForm, setImageUploadForm] = useState({
    title: '',
    description: '',
    category: 'community_work',
    image: null
  })
  const [uploadLoading, setUploadLoading] = useState(false)
  const [ngoPoints, setNgoPoints] = useState(0)
  const [ngoLeaderboard, setNgoLeaderboard] = useState([])
  const [imageUploadErrors, setImageUploadErrors] = useState({})

  // Fetch NGO points and uploaded images
  useEffect(() => {
    if (user?.uid) {
      fetchNgoData()
      fetchUploadedImages()
      fetchNgoLeaderboard()
    }
  }, [user?.uid])

  const fetchNgoData = async () => {
    try {
      const ngoQuery = query(
        collection(db, 'ngo_profiles'),
        where('uid', '==', user.uid)
      )
      const unsubscribe = onSnapshot(ngoQuery, (snapshot) => {
        if (!snapshot.empty) {
          const ngoData = snapshot.docs[0].data()
          setNgoPoints(ngoData.points || 0)
        }
      })
      return unsubscribe
    } catch (error) {
      console.error('Error fetching NGO data:', error)
    }
  }

  const fetchUploadedImages = async () => {
    try {
      const imagesQuery = query(
        collection(db, 'ngo_image_submissions'),
        where('ngoUid', '==', user.uid),
        orderBy('createdAt', 'desc')
      )
      const unsubscribe = onSnapshot(imagesQuery, (snapshot) => {
        const images = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setUploadedImages(images)
      })
      return unsubscribe
    } catch (error) {
      console.error('Error fetching uploaded images:', error)
    }
  }

  const fetchNgoLeaderboard = async () => {
    try {
      const ngoQuery = query(
        collection(db, 'ngo_profiles'),
        orderBy('points', 'desc')
      )
      const unsubscribe = onSnapshot(ngoQuery, (snapshot) => {
        const ngos = snapshot.docs.map((doc, index) => ({
          id: doc.id,
          rank: index + 1,
          ...doc.data()
        }))
        setNgoLeaderboard(ngos)
      })
      return unsubscribe
    } catch (error) {
      console.error('Error fetching NGO leaderboard:', error)
    }
  }

  // Handle image upload with enhanced error handling
  const handleImageUpload = async (e) => {
    e.preventDefault()
    setImageUploadErrors({})

    if (!imageUploadForm.title.trim()) {
      setImageUploadErrors({ title: 'Title is required' })
      return
    }

    if (!imageUploadForm.description.trim()) {
      setImageUploadErrors({ description: 'Description is required' })
      return
    }

    if (!imageUploadForm.image) {
      setImageUploadErrors({ image: 'Image is required' })
      return
    }

    // Validate file size (max 10MB)
    if (imageUploadForm.image.size > 10 * 1024 * 1024) {
      setImageUploadErrors({ image: 'Image size must be less than 10MB' })
      return
    }

    // Validate file type
    if (!imageUploadForm.image.type.startsWith('image/')) {
      setImageUploadErrors({ image: 'Please select a valid image file' })
      return
    }

    setUploadLoading(true)
    console.log('🔄 Starting image upload...', {
      user: user?.uid,
      fileName: imageUploadForm.image.name,
      fileSize: imageUploadForm.image.size,
      fileType: imageUploadForm.image.type
    })

    try {
      // Check if user is authenticated
      if (!user || !user.uid) {
        throw new Error('User not authenticated. Please log in again.')
      }

      // Create a safe filename
      const timestamp = Date.now()
      const safeFileName = imageUploadForm.image.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      // Try ngo_submissions first, fallback to temp if permission denied
      const storagePath = `ngo_submissions/${user.uid}-${timestamp}-${safeFileName}`

      console.log('📁 Upload path:', storagePath)

      // Upload image to storage with metadata
      const imageRef = ref(storage, storagePath)
      const metadata = {
        customMetadata: {
          uploadedBy: user.uid,
          uploadedAt: new Date().toISOString(),
          originalName: imageUploadForm.image.name
        }
      }

      console.log('⬆️ Uploading to Firebase Storage...')
      let uploadResult
      let finalImageRef = imageRef
      let finalStoragePath = storagePath

      try {
        uploadResult = await uploadBytes(imageRef, imageUploadForm.image, metadata)
        console.log('✅ Upload successful:', uploadResult)
      } catch (uploadError) {
        if (uploadError.code === 'storage/unauthorized') {
          console.log('⚠️ Permission denied for ngo_submissions, trying temp folder...')
          // Fallback to temp folder with more permissive rules
          finalStoragePath = `temp/${user.uid}-${timestamp}-${safeFileName}`
          finalImageRef = ref(storage, finalStoragePath)
          uploadResult = await uploadBytes(finalImageRef, imageUploadForm.image, metadata)
          console.log('✅ Upload successful to temp folder:', uploadResult)
        } else {
          throw uploadError
        }
      }

      console.log('🔗 Getting download URL...')
      const imageUrl = await getDownloadURL(finalImageRef)
      console.log('✅ Download URL obtained:', imageUrl)

      // Create submission document
      console.log('💾 Creating database record...')
      const docRef = await addDoc(collection(db, 'ngo_image_submissions'), {
        ngoUid: user.uid,
        ngoName: userProfile?.organization || userProfile?.name || 'Unknown NGO',
        ngoEmail: user.email,
        title: imageUploadForm.title.trim(),
        description: imageUploadForm.description.trim(),
        category: imageUploadForm.category,
        imageUrl,
        storagePath: finalStoragePath, // Store the actual path used
        status: 'pending', // pending, approved, rejected
        points: 0, // Will be set when approved
        createdAt: new Date(),
        updatedAt: new Date()
      })
      console.log('✅ Database record created:', docRef.id)

      // Reset form
      setImageUploadForm({
        title: '',
        description: '',
        category: 'community_work',
        image: null
      })

      // Reset file input
      const fileInput = document.getElementById('ngo-image-upload')
      if (fileInput) fileInput.value = ''

      toast.success('Image submitted for government approval!')
    } catch (error) {
      console.error('❌ Error uploading image:', error)

      // Provide specific error messages
      let errorMessage = 'Failed to upload image. Please try again.'

      if (error.code === 'storage/unauthorized') {
        errorMessage = 'Upload permission denied. Please contact support or try logging out and back in.'
      } else if (error.code === 'storage/quota-exceeded') {
        errorMessage = 'Storage quota exceeded. Please contact support.'
      } else if (error.code === 'storage/invalid-format') {
        errorMessage = 'Invalid file format. Please select a valid image file.'
      } else if (error.code === 'storage/invalid-argument') {
        errorMessage = 'Invalid file. Please select a different image.'
      } else if (error.message.includes('User not authenticated')) {
        errorMessage = 'Please log out and log back in, then try again.'
      }

      toast.error(errorMessage)
      setImageUploadErrors({ submit: errorMessage })
    }
    setUploadLoading(false)
  }

  useEffect(() => {
    const unsubscribers = []
    console.log('🔄 Setting up Firebase real-time listeners...')
    console.log('🔍 User state:', { user: user?.uid, userProfile: userProfile?.role })

    if (!user) {
      console.log('⚠️ No user authenticated, skipping Firebase listeners')
      setDataLoading(false)
      return
    }

    try {
      // Issues listener - try without orderBy first to avoid index issues
      console.log('📊 Setting up issues listener...')
      const issuesQuery = query(
        collection(db, 'issues'),
        where('status', '==', 'open')
      )
      const unsubscribeIssues = onSnapshot(issuesQuery, (snapshot) => {
        const issuesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        console.log('📊 Active issues loaded:', issuesData.length, issuesData)
        setIssues(issuesData)
      }, (error) => {
        console.error('❌ Error loading active issues:', error)
        toast.error('Failed to load active issues: ' + error.message)

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
            status: 'open',
            reportedBy: 'school',
            reporterName: 'School Principal',
            region: 'Mumbai',
            location: { latitude: 19.0760, longitude: 72.8777 },
            createdAt: new Date()
          }
        ]
        console.log('📊 Using mock issues data:', mockIssues.length)
        setIssues(mockIssues)
      })
      unsubscribers.push(unsubscribeIssues)

      // Load leaderboard
      const leaderboardQuery = query(
        collection(db, 'users'),
        where('role', 'in', ['ngo', 'volunteer']),
        orderBy('points', 'desc')
      )
      const unsubscribeLeaderboard = onSnapshot(leaderboardQuery, (snapshot) => {
        const firebaseLeaderboard = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        console.log('🏆 Firebase leaderboard loaded:', firebaseLeaderboard.length)

        // Merge Firebase data with sample volunteers
        const mergedLeaderboard = [...sampleVolunteers, ...firebaseLeaderboard]
          .sort((a, b) => (b.points || 0) - (a.points || 0))

        setLeaderboard(mergedLeaderboard)
      }, (error) => {
        console.error('❌ Error loading leaderboard:', error)
        // Keep sample volunteers as fallback
        setLeaderboard(sampleVolunteers)
      })
      unsubscribers.push(unsubscribeLeaderboard)

      // Load solved issues for analytics
      console.log('✅ Setting up solved issues listener...')
      const solvedIssuesQuery = query(
        collection(db, 'issues'),
        where('status', '==', 'solved')
      )
      const unsubscribeSolved = onSnapshot(solvedIssuesQuery, (snapshot) => {
        const solvedData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        console.log('✅ Solved issues loaded:', solvedData.length, solvedData)
        setSolvedIssues(solvedData)
      }, (error) => {
        console.error('❌ Error loading solved issues:', error)
        toast.error('Failed to load solved issues: ' + error.message)

        // Use mock solved issues data
        const mockSolvedIssues = [
          {
            id: 'solved-1',
            type: 'healthcare',
            description: 'Medical camp organized successfully',
            severity: 'high',
            status: 'solved',
            reportedBy: 'public',
            reporterName: 'Health Worker',
            region: 'Chennai',
            solvedBy: user?.uid || 'test-user-123',
            solverName: userProfile?.name || 'Test NGO User',
            solvedAt: new Date(),
            location: { latitude: 13.0827, longitude: 80.2707 },
            createdAt: new Date(Date.now() - 86400000) // Yesterday
          },
          {
            id: 'solved-2',
            type: 'shelter',
            description: 'Temporary housing provided',
            severity: 'medium',
            status: 'solved',
            reportedBy: 'public',
            reporterName: 'Social Worker',
            region: 'Kolkata',
            solvedBy: user?.uid || 'test-user-123',
            solverName: userProfile?.name || 'Test NGO User',
            solvedAt: new Date(),
            location: { latitude: 22.5726, longitude: 88.3639 },
            createdAt: new Date(Date.now() - 172800000) // 2 days ago
          }
        ]
        console.log('✅ Using mock solved issues data:', mockSolvedIssues.length)
        setSolvedIssues(mockSolvedIssues)
      })
      unsubscribers.push(unsubscribeSolved)

      // Load government schemes and poverty data
      loadGovernmentData()

    } catch (error) {
      console.error('Error setting up listeners:', error)
      toast.error('Failed to initialize dashboard')
    }

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }, [])

  // Real-time analytics calculation
  useEffect(() => {
    const calculateAnalytics = () => {
      try {
        setAnalyticsLoading(true)

        // 1. Active Cases Count (all open issues)
        const activeCases = issues.length

        // 2. Cases Solved by This NGO
        const solvedByThisNGO = solvedIssues.filter(issue =>
          issue.solvedBy === user?.uid
        ).length

        // 3. Most Common Cases by Region
        const regionCounts = {}
        const typeCounts = {}

        const allIssues = [...issues, ...solvedIssues]
        allIssues.forEach(issue => {
          // Count by region
          const region = issue.region || 'Unknown'
          regionCounts[region] = (regionCounts[region] || 0) + 1

          // Count by type
          const type = issue.type || 'Unknown'
          typeCounts[type] = (typeCounts[type] || 0) + 1
        })

        const mostCommonCases = Object.entries(typeCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([type, count]) => ({ type, count }))

        // 4. Regional Data for Analytics
        const regionalData = Object.entries(regionCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([region, count]) => ({ region, count }))

        setRealTimeAnalytics({
          activeCases,
          solvedByThisNGO,
          mostCommonCases,
          regionalData
        })

        // Calculate additional analytics for the analytics object
        const publicCases = allIssues.filter(issue => issue.reportedBy === 'public').length
        const schoolCases = allIssues.filter(issue => issue.reportedBy === 'school').length
        const currentNgoSolved = solvedByThisNGO
        const totalActiveIssues = activeCases + solvedIssues.length

        // Most common by region
        const mostCommonByRegion = {}
        Object.entries(regionCounts).forEach(([region, totalCount]) => {
          const regionIssues = allIssues.filter(issue => (issue.region || 'Unknown') === region)
          const regionTypeCounts = {}
          regionIssues.forEach(issue => {
            const type = issue.type || 'Unknown'
            regionTypeCounts[type] = (regionTypeCounts[type] || 0) + 1
          })
          const mostCommonType = Object.entries(regionTypeCounts)
            .sort((a, b) => b[1] - a[1])[0]
          if (mostCommonType) {
            mostCommonByRegion[region] = {
              type: mostCommonType[0],
              count: mostCommonType[1],
              total: totalCount
            }
          }
        })

        // Underserved communities (using poverty data if available)
        const underservedCommunities = povertyData.map(region => ({
          ...region,
          needsLevel: calculateNeedsLevel(region),
          activeIssues: allIssues.filter(issue => issue.region === region.region).length,
          solvedIssues: solvedIssues.filter(issue => issue.region === region.region).length
        }))

        setAnalytics({
          publicCases,
          schoolCases,
          currentNgoSolved,
          totalActiveIssues,
          mostCommonByRegion,
          underservedCommunities
        })

        // Debug logging
        console.log('🔄 Real-time Analytics Updated:', {
          activeCases,
          solvedByThisNGO,
          mostCommonCases: mostCommonCases.length,
          regionalData: regionalData.length,
          totalIssues: issues.length,
          totalSolved: solvedIssues.length
        })

        // Show toast notification for real-time updates (only after initial load)
        // if (!analyticsLoading && (activeCases > 0 || solvedByThisNGO > 0)) {
        //   toast.success(`📊 Analytics updated: ${activeCases} active cases, ${solvedByThisNGO} solved by you`, {
        //     duration: 3000,
        //     position: 'top-right'
        //   })
        // }
      } catch (error) {
        console.error('Error calculating analytics:', error)
        toast.error('Failed to update analytics')
      } finally {
        setAnalyticsLoading(false)
      }
    }

    calculateAnalytics()
  }, [issues, solvedIssues, user?.uid, povertyData])

  // Generate chart data based on real cases
  const generateChartData = () => {
    const allIssues = [...issues, ...solvedIssues]

    // 1. Cases by Type (Bar Chart)
    const typeCount = {}
    allIssues.forEach(issue => {
      const type = issue.type || 'Unknown'
      typeCount[type] = (typeCount[type] || 0) + 1
    })

    const casesByTypeData = {
      labels: Object.keys(typeCount),
      datasets: [{
        label: 'Number of Cases',
        data: Object.values(typeCount),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',   // Red for food
          'rgba(59, 130, 246, 0.8)',  // Blue for education
          'rgba(34, 197, 94, 0.8)',   // Green for healthcare
          'rgba(168, 85, 247, 0.8)',  // Purple for shelter
          'rgba(245, 158, 11, 0.8)',  // Orange for infrastructure
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(245, 158, 11, 1)',
        ],
        borderWidth: 2
      }]
    }

    // 2. Cases by Status (Doughnut Chart)
    const statusCount = {}
    allIssues.forEach(issue => {
      const status = issue.status || 'Unknown'
      statusCount[status] = (statusCount[status] || 0) + 1
    })

    const casesByStatusData = {
      labels: Object.keys(statusCount),
      datasets: [{
        data: Object.values(statusCount),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',   // Red for open
          'rgba(34, 197, 94, 0.8)',   // Green for solved
          'rgba(156, 163, 175, 0.8)', // Gray for others
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(156, 163, 175, 1)',
        ],
        borderWidth: 2
      }]
    }

    // 3. Cases by Region (Bar Chart)
    const regionCount = {}
    allIssues.forEach(issue => {
      const region = issue.region || 'Unknown'
      regionCount[region] = (regionCount[region] || 0) + 1
    })

    const casesByRegionData = {
      labels: Object.keys(regionCount),
      datasets: [{
        label: 'Cases by Region',
        data: Object.values(regionCount),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2
      }]
    }

    // 4. Cases Over Time (Line Chart)
    const last7Days = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      last7Days.push(date.toISOString().split('T')[0])
    }

    const casesOverTime = last7Days.map(date => {
      return allIssues.filter(issue => {
        // Update the createdAt date handling
        const issueDate = issue.createdAt?.toDate?.() 
          ? issue.createdAt.toDate().toISOString().split('T')[0]
          : new Date(issue.createdAt?.seconds * 1000).toISOString().split('T')[0]
        return issueDate === date
      }).length
    })

    const casesOverTimeData = {
      labels: last7Days.map(date => new Date(date).toLocaleDateString()),
      datasets: [{
        label: 'Cases Reported',
        data: casesOverTime,
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true
      }]
    }

    return {
      casesByTypeData,
      casesByStatusData,
      casesByRegionData,
      casesOverTimeData
    }
  }

  const loadGovernmentData = async () => {
    setDataLoading(true)
    try {
      console.log('📊 Loading government data...')
      const [povertyResult, schemesResult] = await Promise.all([
        governmentSchemesService.getPovertyData(),
        governmentSchemesService.getSchemes()
      ])

      console.log('📊 Government data loaded:', {
        povertyCount: povertyResult.length,
        schemesCount: schemesResult.length
      })

      setPovertyData(povertyResult)
      setSchemes(schemesResult)

      // Initialize sample data if empty
      if (povertyResult.length === 0 || schemesResult.length === 0) {
        console.log('📊 Initializing sample government data...')
        await governmentSchemesService.initializeSampleData()
        // Reload data after initialization
        const [newPovertyResult, newSchemesResult] = await Promise.all([
          governmentSchemesService.getPovertyData(),
          governmentSchemesService.getSchemes()
        ])
        console.log('📊 Sample data initialized:', {
          povertyCount: newPovertyResult.length,
          schemesCount: newSchemesResult.length
        })
        setPovertyData(newPovertyResult)
        setSchemes(newSchemesResult)
      }
    } catch (error) {
      console.error('❌ Error loading government data:', error)
      toast.error('Failed to load government data: ' + error.message)

      // Fallback to mock data if Firebase fails
      const mockPovertyData = [
        {
          region: 'Delhi',
          povertyRate: 15.2,
          unemploymentRate: 8.5,
          literacyRate: 86.3,
          population: 32000000,
          coordinates: { lat: 28.6139, lng: 77.2090 }
        }
      ]
      setPovertyData(mockPovertyData)
      console.log('📊 Using fallback mock data')
    }
    setDataLoading(false)
  }

  const handleSolveIssue = async (issueId) => {
    if (!verificationImage) {
      toast.error('Please upload a verification image')
      return
    }

    setIsSubmitting(true)
    try {
      // Upload image
      const imageRef = ref(storage, `verifications/${issueId}-${Date.now()}`)
      await uploadBytes(imageRef, verificationImage)
      const imageUrl = await getDownloadURL(imageRef)

      // Update issue
      await updateDoc(doc(db, 'issues', issueId), {
        status: 'solved',
        solvedBy: user.uid,
        solverName: userProfile?.name,
        verificationImageUrl: imageUrl,
        solvedAt: new Date()
      })

      // Update user points
      await updateDoc(doc(db, 'users', user.uid), {
        points: (userProfile?.points || 0) + 10
      })

      setSelectedIssue(null)
      setVerificationImage(null)
      toast.success('🎉 Issue marked as solved! You earned 10 points.')
    } catch (error) {
      console.error('Error solving issue:', error)
      toast.error('Failed to solve issue: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredIssues = issues.filter(issue => {
    if (filter === 'all') return true
    return issue.severity === filter
  })

  const issueMarkers = filteredIssues.map(issue => ({
    lat: issue.location?.latitude || 22.5726,
    lng: issue.location?.longitude || 88.3639,
    title: `${issue.type} - ${issue.severity}`,
    description: issue.description,
    severity: issue.severity,
    status: issue.status
  }))

  // Helper function for calculating needs level (kept for potential future use)
  const calculateNeedsLevel = (region) => {
    const povertyWeight = region.povertyRate * 0.4
    const unemploymentWeight = region.unemploymentRate * 0.3
    const literacyWeight = (100 - region.literacyRate) * 0.3
    return Math.round(povertyWeight + unemploymentWeight + literacyWeight)
  }

  const handleBoxClick = (boxType, data = null) => {
    setSelectedAnalyticBox(boxType)

    switch(boxType) {
      case 'active':
        setFilteredAnalyticIssues(issues.filter(issue => issue.status === 'open'))
        break
      case 'solved':
        setFilteredAnalyticIssues(solvedIssues.filter(issue =>
          issue.solvedBy === user?.uid
        ))
        break
      case 'common':
        // Show breakdown of most common case types
        const allIssues = [...issues, ...solvedIssues]
        setFilteredAnalyticIssues(allIssues)
        break
      case 'regional':
        // Show regional breakdown
        const allRegionalIssues = [...issues, ...solvedIssues]
        setFilteredAnalyticIssues(allRegionalIssues)
        break
      default:
        setFilteredAnalyticIssues([])
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">Enhanced NGO Dashboard</h1>
              <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700">
                  Real-time Data Active
                </span>
              </div>
             
             
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{userProfile?.name}</div>
                <div className="text-xs text-gray-500">
                  {ngoPoints} points • Rank #{ngoLeaderboard.find(ngo => ngo.uid === user?.uid)?.rank || 'N/A'} • {realTimeAnalytics.solvedByThisNGO} solved
                </div>
              </div>
              <button onClick={logout} className="text-sm text-red-600 hover:underline">Logout</button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Enhanced Navigation */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="flex flex-wrap gap-2 p-4">
              {[
                { id: 'dashboard', label: 'Analytics Dashboard', icon: ChartBarIcon },
                { id: 'map', label: 'Enhanced Map', icon: MapIcon },
                { id: 'uploads', label: 'Image Uploads', icon: PhotoIcon },
                { id: 'funds', label: 'Fund Management', icon: StarIcon },
                { id: 'leaderboard', label: 'NGO Rankings', icon: TrophyIcon },
                { id: 'issues', label: 'Issue Management', icon: Cog6ToothIcon }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {tab.id === 'issues' && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-1">
                      {filteredIssues.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Analytics Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Debug Panel */}
              

              {/* Four Real-time Analytics Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Box 1: Active Cases to Solve */}
                <div
                  onClick={() => handleBoxClick('active')}
                  className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl text-white cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Active Cases</h3>
                    <div className="w-3 h-3 bg-red-300 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-4xl font-bold mb-2">
                    {analyticsLoading ? '...' : realTimeAnalytics.activeCases}
                  </p>
                  <div className="space-y-1 text-sm text-red-100">
                    <div className="flex justify-between">
                      <span>Pending Reports:</span>
                      <span className="font-semibold">{realTimeAnalytics.activeCases}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Need Action:</span>
                      <span className="font-semibold">{issues.filter(i => i.severity === 'high').length}</span>
                    </div>
                  </div>
                  <p className="text-xs text-red-200 mt-3">Real-time • Click to view details</p>
                </div>

                {/* Box 2: Cases Solved by Current NGO */}
                <div
                  onClick={() => handleBoxClick('solved')}
                  className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Your Solutions</h3>
                    <div className="w-3 h-3 bg-green-300 rounded-full"></div>
                  </div>
                  <p className="text-4xl font-bold mb-2">
                    {analyticsLoading ? '...' : realTimeAnalytics.solvedByThisNGO}
                  </p>
                  <div className="text-sm text-green-100">
                    <p>Total solved by you: {realTimeAnalytics.solvedByThisNGO}</p>
                    <p className="font-semibold">
                      {realTimeAnalytics.activeCases > 0
                        ? `${((realTimeAnalytics.solvedByThisNGO / (realTimeAnalytics.activeCases + realTimeAnalytics.solvedByThisNGO)) * 100).toFixed(1)}% success rate`
                        : 'Start solving cases!'
                      }
                    </p>
                  </div>
                  <p className="text-xs text-green-200 mt-3">Your impact • Click to view</p>
                </div>

                {/* Box 3: Most Common Cases by Type */}
                <div
                  onClick={() => handleBoxClick('common')}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Common Cases</h3>
                    <div className="w-3 h-3 bg-orange-300 rounded-full"></div>
                  </div>
                  <p className="text-4xl font-bold mb-2">
                    {analyticsLoading ? '...' : realTimeAnalytics.mostCommonCases.length}
                  </p>
                  <div className="space-y-1 text-sm text-orange-100 max-h-16 overflow-y-auto">
                    {realTimeAnalytics.mostCommonCases.slice(0, 2).map((caseData, index) => (
                      <div
                        key={index}
                        className="cursor-pointer hover:bg-orange-400 hover:bg-opacity-20 p-1 rounded"
                      >
                        <div className="flex justify-between">
                          <span className="truncate capitalize">{caseData.type}:</span>
                          <span className="font-semibold">{caseData.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-orange-200 mt-3">Click for detailed breakdown</p>
                </div>

                {/* Box 4: Regional Analytics */}
                <div
                  onClick={() => handleBoxClick('regional')}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Regional Data</h3>
                    <div className="w-3 h-3 bg-purple-300 rounded-full"></div>
                  </div>
                  <p className="text-4xl font-bold mb-2">
                    {analyticsLoading ? '...' : realTimeAnalytics.regionalData.length}
                  </p>
                  <div className="space-y-1 text-sm text-purple-100 max-h-16 overflow-y-auto">
                    {realTimeAnalytics.regionalData.slice(0, 2).map((regionData, index) => (
                      <div
                        key={index}
                        className="cursor-pointer hover:bg-purple-400 hover:bg-opacity-20 p-1 rounded"
                      >
                        <div className="flex justify-between">
                          <span className="truncate">{regionData.region}:</span>
                          <span className="font-semibold">{regionData.count} cases</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-purple-200 mt-3">Click for regional breakdown</p>
                </div>
              </div>

              {/* Summary Statistics */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">📊 Case Analytics Summary</h3>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live Data</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{issues.length + solvedIssues.length}</div>
                    <div className="text-sm text-gray-600">Total Cases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{issues.length}</div>
                    <div className="text-sm text-gray-600">Open Cases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{solvedIssues.length}</div>
                    <div className="text-sm text-gray-600">Solved Cases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {issues.length + solvedIssues.length > 0
                        ? Math.round((solvedIssues.length / (issues.length + solvedIssues.length)) * 100)
                        : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                </div>
              </div>

              {/* Charts Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">📈 Real-time Case Analytics</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      toast.success('Charts refreshed with latest data!')
                    }}
                    className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                  >
                    🔄 Refresh Charts
                  </button>
                  <div className="text-xs text-gray-500">
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Real-time Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cases by Type Chart */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Cases by Type</h3>
                    <div className="text-xs text-gray-500">
                      Total: {issues.length + solvedIssues.length} cases
                    </div>
                  </div>
                  <div className="h-64">
                    <Bar
                      data={generateChartData().casesByTypeData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          },
                          title: {
                            display: true,
                            text: 'Distribution of Cases by Type'
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              stepSize: 1
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Cases by Status Chart */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Cases by Status</h3>
                    <div className="text-xs text-gray-500">
                      {Math.round((solvedIssues.length / (issues.length + solvedIssues.length || 1)) * 100)}% solved
                    </div>
                  </div>
                  <div className="h-64">
                    <Doughnut
                      data={generateChartData().casesByStatusData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom'
                          },
                          title: {
                            display: true,
                            text: 'Open vs Solved Cases'
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Cases by Region Chart */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Cases by Region</h3>
                  <div className="h-64">
                    <Bar
                      data={generateChartData().casesByRegionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          },
                          title: {
                            display: true,
                            text: 'Regional Distribution of Cases'
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              stepSize: 1
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Cases Over Time Chart */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Cases Over Time (Last 7 Days)</h3>
                  <div className="h-64">
                    <Line
                      data={generateChartData().casesOverTimeData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          },
                          title: {
                            display: true,
                            text: 'Daily Case Reports Trend'
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              stepSize: 1
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Real-time Detailed Dashboard */}
              {selectedAnalyticBox && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      {selectedAnalyticBox === 'active' && (
                        <>
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          Active Cases - Real-time Data
                        </>
                      )}
                      {selectedAnalyticBox === 'solved' && (
                        <>
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          Your Solved Cases
                        </>
                      )}
                      {selectedAnalyticBox === 'common' && (
                        <>
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          Regional Issue Patterns
                        </>
                      )}
                      {selectedAnalyticBox === 'geo' && (
                        <>
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          Geo-tagged Community Data
                        </>
                      )}
                    </h3>
                    <button
                      onClick={() => setSelectedAnalyticBox(null)}
                      className="text-gray-500 hover:text-gray-700 text-xl"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {selectedAnalyticBox === 'active' && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg mb-4">
                          <h4 className="font-semibold text-blue-800 mb-2">Real-time Active Cases</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-blue-600">Public Dashboard Reports:</span>
                              <span className="font-bold ml-2">{analytics.publicCases}</span>
                            </div>
                            <div>
                              <span className="text-blue-600">School Dashboard Reports:</span>
                              <span className="font-bold ml-2">{analytics.schoolCases}</span>
                            </div>
                          </div>
                        </div>
                        {filteredAnalyticIssues.map(issue => (
                          <div key={issue.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium capitalize">{issue.type} Issue</h4>
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    issue.reportedBy === 'school' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                    {issue.reportedBy === 'school' ? 'School Report' : 'Public Report'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                  <span>📍 {issue.region || 'Unknown Region'}</span>
                                  <span>👤 {issue.reporterName || 'Anonymous'}</span>
                                  <span>📅 {issue.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}</span>
                                  {issue.location && (
                                    <span>🗺 {issue.location.latitude?.toFixed(4)}, {issue.location.longitude?.toFixed(4)}</span>
                                  )}
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                                issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {issue.severity} priority
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedAnalyticBox === 'solved' && (
                      <div className="space-y-4">
                        <div className="bg-green-50 p-4 rounded-lg mb-4">
                          <h4 className="font-semibold text-green-800 mb-2">Your NGO Impact</h4>
                          <div className="text-sm text-green-700">
                            <p>You have solved <span className="font-bold">{analytics.currentNgoSolved}</span> out of <span className="font-bold">{analytics.totalActiveIssues}</span> total cases</p>
                            <p className="mt-1">Impact Rate: <span className="font-bold">
                              {analytics.totalActiveIssues > 0
                                ? `${((analytics.currentNgoSolved / analytics.totalActiveIssues) * 100).toFixed(1)}%`
                                : '0%'
                              }
                            </span></p>
                          </div>
                        </div>
                        {filteredAnalyticIssues.map(issue => (
                          <div key={issue.id} className="p-4 border rounded-lg bg-green-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium capitalize">{issue.type} Issue - SOLVED</h4>
                                <p className="text-sm text-gray-600">{issue.description}</p>
                                <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-2">
                                  <span>📍 {issue.region || 'Unknown'}</span>
                                  <span>✅ Solved: {issue.solvedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}</span>
                                  <span>🏆 Points Earned: +10</span>
                                </div>
                              </div>
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                Completed
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedAnalyticBox === 'common' && (
                      <div className="space-y-4">
                        <div className="bg-orange-50 p-4 rounded-lg mb-4">
                          <h4 className="font-semibold text-orange-800 mb-2">Regional Issue Patterns</h4>
                          <p className="text-sm text-orange-700">Most common issues by region - helps target resources effectively</p>
                        </div>
                        {Object.entries(analytics.mostCommonByRegion).map(([region, data]) => (
                          <div key={region} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">{region}</h4>
                                <p className="text-sm text-gray-600">
                                  Most common: <span className="font-semibold capitalize">{data.type}</span> issues
                                </p>
                                <p className="text-xs text-gray-500">
                                  {data.count} out of {data.total} total cases ({((data.count / data.total) * 100).toFixed(1)}%)
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-bold text-orange-600">{data.count}</span>
                                <p className="text-xs text-gray-500">{data.type} cases</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedAnalyticBox === 'geo' && (
                      <div className="space-y-4">
                        <div className="bg-purple-50 p-4 rounded-lg mb-4">
                          <h4 className="font-semibold text-purple-800 mb-2">Geo-tagged Underserved Communities</h4>
                          <p className="text-sm text-purple-700">Based on poverty, hunger, and education indicators</p>
                        </div>
                        {analytics.underservedCommunities
                          .sort((a, b) => b.needsLevel - a.needsLevel)
                          .map((community) => (
                            <div key={community.region} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium">{community.region}</h4>
                                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                                    <div>
                                      <p className="text-gray-600">Poverty Rate: <span className="font-semibold text-red-600">{community.povertyRate}%</span></p>
                                      <p className="text-gray-600">Unemployment: <span className="font-semibold text-orange-600">{community.unemploymentRate}%</span></p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">Literacy Rate: <span className="font-semibold text-green-600">{community.literacyRate}%</span></p>
                                      <p className="text-gray-600">Population: <span className="font-semibold">{(community.population / 1000000).toFixed(1)}M</span></p>
                                    </div>
                                  </div>
                                  <div className="mt-2 text-xs text-gray-500">
                                    <span>📍 {community.coordinates.lat.toFixed(4)}, {community.coordinates.lng.toFixed(4)}</span>
                                    <span className="ml-4">🚨 Active Issues: {community.activeIssues}</span>
                                    <span className="ml-4">✅ Solved: {community.solvedIssues}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`text-2xl font-bold ${
                                    community.needsLevel > 70 ? 'text-red-600' :
                                    community.needsLevel > 50 ? 'text-orange-600' :
                                    'text-yellow-600'
                                  }`}>
                                    {community.needsLevel}%
                                  </span>
                                  <p className="text-xs text-gray-500">needs level</p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mobile Reporting Simulation */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Real-time Citizen & Field Worker Reports
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    - Mobile app integration for instant data-driven response
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Simulated Mobile Reports */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                      📱 Mobile App Reports (Live)
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {issues.slice(0, 5).map(issue => (
                        <div key={issue.id} className="bg-white p-3 rounded-lg shadow-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm capitalize">{issue.type} Issue</p>
                              <p className="text-xs text-gray-600 truncate">{issue.description}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                <span>📍 {issue.region}</span>
                                <span>👤 {issue.reporterName}</span>
                                <span className={`px-2 py-1 rounded ${
                                  issue.reportedBy === 'school' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                }`}>
                                  {issue.reportedBy === 'school' ? 'Field Worker' : 'Citizen'}
                                </span>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${
                              issue.severity === 'high' ? 'bg-red-100 text-red-700' :
                              issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {issue.severity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Report Categories */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">Report Categories</h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-red-50 p-3 rounded-lg text-center">
                        <div className="text-2xl mb-1">🍽</div>
                        <p className="text-sm font-medium text-red-800">Food Insecurity</p>
                        <p className="text-xs text-red-600">
                          {issues.filter(i => i.type === 'food').length} reports
                        </p>
                      </div>

                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <div className="text-2xl mb-1">🎓</div>
                        <p className="text-sm font-medium text-blue-800">Education Dropout</p>
                        <p className="text-xs text-blue-600">
                          {issues.filter(i => i.type === 'education').length} reports
                        </p>
                      </div>

                      <div className="bg-orange-50 p-3 rounded-lg text-center">
                        <div className="text-2xl mb-1">🏗</div>
                        <p className="text-sm font-medium text-orange-800">Infrastructure</p>
                        <p className="text-xs text-orange-600">
                          {issues.filter(i => i.type === 'shelter').length} reports
                        </p>
                      </div>

                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <div className="text-2xl mb-1">🏥</div>
                        <p className="text-sm font-medium text-green-800">Healthcare</p>
                        <p className="text-xs text-green-600">
                          {issues.filter(i => i.type === 'healthcare').length} reports
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h5 className="font-medium text-gray-800 mb-2">Response Time</h5>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Average Response:</span>
                        <span className="font-semibold text-green-600">2.3 hours</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Your Response:</span>
                        <span className="font-semibold text-blue-600">1.8 hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {dataLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : null}
            </div>
          )}

          {/* Enhanced Map Tab */}
          {activeTab === 'map' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Map Layer:</label>
                    <select
                      value={mapLayer}
                      onChange={(e) => setMapLayer(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded"
                    >
                      <option value="issues">Issues Only</option>
                      <option value="poverty">Poverty Data</option>
                      <option value="schemes">Government Schemes</option>
                      <option value="all">All Layers</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Filter by severity:</label>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded"
                    >
                      <option value="all">All Issues</option>
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Geo-tagged Underserved Communities Map
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    - Real-time data for effective resource channeling
                  </span>
                </h3>
                {dataLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Map Legend for NGO Use */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Map Guide for NGOs & Donors</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span>High Priority Areas</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span>Medium Priority</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span>Active Issues</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span>Government Schemes</span>
                        </div>
                      </div>
                    </div>

                    <EnhancedMapView
                      markers={[
                        ...issueMarkers,
                        // Add poverty data markers
                        ...povertyData.map(region => ({
                          lat: region.coordinates?.lat || 22.5726,
                          lng: region.coordinates?.lng || 88.3639,
                          title: `${region.region} - ${region.povertyRate}% poverty`,
                          description: `Population: ${region.population?.toLocaleString()} | Unemployment: ${region.unemploymentRate}%`,
                          severity: region.povertyRate > 20 ? 'high' : region.povertyRate > 15 ? 'medium' : 'low',
                          status: 'community',
                          type: 'poverty-data'
                        }))
                      ]}
                      povertyData={povertyData}
                      schemeData={schemes}
                      activeLayer={mapLayer}
                      center={[20.5937, 78.9629]}
                      zoom={5}
                    />

                    {/* Real-time Data Indicators */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="bg-red-50 p-3 rounded-lg">
                        <h5 className="font-medium text-red-800">High Priority Areas</h5>
                        <p className="text-sm text-red-600">
                          {povertyData.filter(region => region.povertyRate > 20).length} regions with high poverty rates
                        </p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h5 className="font-medium text-blue-800">Active Reports</h5>
                        <p className="text-sm text-blue-600">
                          {realTimeAnalytics.activeCases} real-time reports from citizens & field workers
                        </p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <h5 className="font-medium text-green-800">Your Impact</h5>
                        <p className="text-sm text-green-600">
                          {realTimeAnalytics.solvedByThisNGO} cases solved by your organization
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Image Upload Tab */}
          {activeTab === 'uploads' && (
            <div className="space-y-6 animate-fade-in">
              {/* NGO Status Dashboard */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Points Display */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold mb-2">Total Points</h3>
                      <p className="text-3xl font-bold">{ngoPoints}</p>
                      <p className="text-green-100 text-sm">Government approved</p>
                    </div>
                    <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center text-xl">
                      <StarIcon className="h-6 w-6" />
                    </div>
                  </div>
                </div>

                {/* Rank Display */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold mb-2">Current Rank</h3>
                      <p className="text-3xl font-bold">#{ngoLeaderboard.find(ngo => ngo.uid === user?.uid)?.rank || 'N/A'}</p>
                      <p className="text-blue-100 text-sm">Among all NGOs</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-xl">
                      🏆
                    </div>
                  </div>
                </div>

                {/* Submissions Status */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold mb-2">Submissions</h3>
                      <p className="text-3xl font-bold">{uploadedImages.length}</p>
                      <p className="text-orange-100 text-sm">
                        {uploadedImages.filter(img => img.status === 'approved').length} approved, {' '}
                        {uploadedImages.filter(img => img.status === 'pending').length} pending
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center text-xl">
                      📸
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Upload Form */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-xl">
                    📸
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Submit Work Images</h3>
                    <p className="text-sm text-gray-600">Upload images of your community work for government approval</p>
                  </div>
                </div>

                <form onSubmit={handleImageUpload} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                    <input
                      type="text"
                      value={imageUploadForm.title}
                      onChange={(e) => setImageUploadForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Community Health Camp"
                    />
                    {imageUploadErrors.title && (
                      <p className="text-red-500 text-xs mt-1">{imageUploadErrors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea
                      value={imageUploadForm.description}
                      onChange={(e) => setImageUploadForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe the work done, impact created, people helped..."
                    />
                    {imageUploadErrors.description && (
                      <p className="text-red-500 text-xs mt-1">{imageUploadErrors.description}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={imageUploadForm.category}
                      onChange={(e) => setImageUploadForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="community_work">Community Work</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="education">Education</option>
                      <option value="food_distribution">Food Distribution</option>
                      <option value="infrastructure">Infrastructure</option>
                      <option value="environment">Environment</option>
                      <option value="disaster_relief">Disaster Relief</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image *</label>
                    <input
                      type="file"
                      id="ngo-image-upload"
                      accept="image/*"
                      onChange={(e) => setImageUploadForm(prev => ({ ...prev, image: e.target.files[0] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {imageUploadErrors.image && (
                      <p className="text-red-500 text-xs mt-1">{imageUploadErrors.image}</p>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">📋 Submission Guidelines</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Images will be reviewed by government officials</li>
                      <li>• Approved images earn 10-50 points based on impact</li>
                      <li>• Include clear photos showing your work and beneficiaries</li>
                      <li>• Provide detailed descriptions of activities and outcomes</li>
                    </ul>
                  </div>

                  <button
                    type="submit"
                    disabled={uploadLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50"
                  >
                    {uploadLoading ? 'Uploading...' : 'Submit for Approval'}
                  </button>
                </form>
              </div>

              {/* Uploaded Images History */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Your Submissions</h3>
                {uploadedImages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <PhotoIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No submissions yet. Upload your first image!</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uploadedImages.map((image) => (
                      <div key={image.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={image.imageUrl}
                          alt={image.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-800 mb-1">{image.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{image.description}</p>
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              image.status === 'approved' ? 'bg-green-100 text-green-800' :
                              image.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {image.status === 'approved' ? '✅ Approved' :
                               image.status === 'rejected' ? '❌ Rejected' :
                               '⏳ Pending'}
                            </span>
                            {image.status === 'approved' && (
                              <span className="text-green-600 font-semibold text-sm">
                                +{image.points} points
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(image.createdAt?.toDate()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fund Management Tab */}
          {activeTab === 'funds' && (
            <div className="animate-fade-in">
              <NGOFundManagement />
            </div>
          )}

          {/* Enhanced Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-white text-xl">
                    🏆
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">NGO Leaderboard</h2>
                    <p className="text-sm text-gray-600">Top NGOs ranked by government-approved submissions</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  {ngoLeaderboard.map((ngo, index) => (
                    <div
                      key={ngo.id}
                      className="group bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-2xl">
                              🏢
                            </div>
                            <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                              ngo.rank === 1 ? 'bg-yellow-500' :
                              ngo.rank === 2 ? 'bg-gray-400' :
                              ngo.rank === 3 ? 'bg-orange-600' : 'bg-blue-500'
                            }`}>
                              #{ngo.rank || index + 1}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 text-lg group-hover:text-green-600 transition-colors">
                              {ngo.organization || ngo.name || 'NGO'}
                            </h3>
                            <p className="text-sm text-gray-600">{ngo.email}</p>
                            <p className="text-xs text-gray-500">{ngo.location || 'India'}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>📸 {ngo.approvedSubmissions || 0} approved</span>
                              <span>⏳ {ngo.pendingSubmissions || 0} pending</span>
                              <span>📅 Since {ngo.joinedDate || '2024'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">{ngo.points || 0}</div>
                          <div className="text-xs text-gray-500">points</div>
                          <div className="mt-2 text-xs text-gray-400">
                            Government Verified
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
                      <span className="font-medium">{leaderboard.length - 3} volunteers</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Impact Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Projects</span>
                      <span className="font-medium">{leaderboard.reduce((sum, v) => sum + (v.completedProjects || 0), 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Projects</span>
                      <span className="font-medium">{leaderboard.reduce((sum, v) => sum + (v.activeProjects || 0), 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Points</span>
                      <span className="font-medium">{leaderboard.reduce((sum, v) => sum + (v.points || 0), 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg Points</span>
                      <span className="font-medium">{Math.round(leaderboard.reduce((sum, v) => sum + (v.points || 0), 0) / leaderboard.length)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Issue Management Tab */}
          {activeTab === 'issues' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex gap-4 items-center">
                  <label className="text-sm font-medium">Filter by severity:</label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded"
                  >
                    <option value="all">All Issues</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Issues Map</h3>
                  <MapView markers={issueMarkers} />
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Issue Details</h3>
                  {selectedIssue ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium capitalize">{selectedIssue.type} Issue</h4>
                        <p className="text-sm text-gray-600">{selectedIssue.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Reported by {selectedIssue.reporterName} on{' '}
                          {selectedIssue.createdAt?.toDate?.()?.toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Verification Image
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setVerificationImage(e.target.files[0])}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSolveIssue(selectedIssue.id)}
                          disabled={loading || !verificationImage}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          {loading ? 'Solving...' : 'Mark as Solved'}
                        </button>
                        <button
                          onClick={() => setSelectedIssue(null)}
                          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-500 mb-4">Select an issue from the list below:</p>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredIssues.map(issue => (
                          <div
                            key={issue.id}
                            onClick={() => setSelectedIssue(issue)}
                            className="p-3 border rounded cursor-pointer hover:bg-gray-50"
                          >
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium capitalize">{issue.type}</h4>
                              <span className={`px-2 py-1 rounded text-xs ${
                                issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                                issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {issue.severity}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">{issue.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Volunteer Profile Modal (No Funding Option) */}
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
                      toast.success(`Collaboration request sent to ${selectedVolunteer.name}!`)
                      setSelectedVolunteer(null)
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                  >
                    🤝 Collaborate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </ErrorBoundary>
  )
}
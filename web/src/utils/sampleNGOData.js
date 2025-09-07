import { db } from '../services/firebase'
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'

// Sample NGO data with blockchain wallet addresses
export const sampleNGOs = [
  {
    uid: 'ngo-hope-foundation-001',
    organization: 'Hope Foundation',
    email: 'contact@hopefoundation.org',
    description: 'Dedicated to providing healthcare and education to underprivileged communities across India.',
    walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A', // Sample wallet address
    points: 450,
    approvedSubmissions: 18,
    pendingSubmissions: 2,
    joinedDate: '2023-01-15',
    location: 'Delhi, India',
    category: 'Healthcare & Education',
    website: 'https://hopefoundation.org',
    phone: '+91-11-2345-6789',
    registrationNumber: 'NGO/DL/2023/001',
    isVerified: true,
    totalDonationsReceived: 0,
    totalFundsSpent: 0,
    impactMetrics: {
      peopleHelped: 5000,
      projectsCompleted: 25,
      communitiesServed: 12
    },
    workAreas: ['Healthcare', 'Education', 'Community Development'],
    achievements: [
      'Established 5 mobile health clinics',
      'Educated 2000+ children',
      'Provided clean water to 8 villages'
    ],
    createdAt: new Date('2023-01-15'),
    lastUpdated: new Date()
  },
  {
    uid: 'ngo-green-earth-002',
    organization: 'Green Earth Initiative',
    email: 'info@greenearthinitiative.org',
    description: 'Environmental conservation and sustainable development organization working towards a greener future.',
    walletAddress: '0x8ba1f109551bD432803012645Hac136c9c0F90F90', // Sample wallet address
    points: 380,
    approvedSubmissions: 15,
    pendingSubmissions: 1,
    joinedDate: '2023-02-20',
    location: 'Mumbai, India',
    category: 'Environment & Sustainability',
    website: 'https://greenearthinitiative.org',
    phone: '+91-22-3456-7890',
    registrationNumber: 'NGO/MH/2023/002',
    isVerified: true,
    totalDonationsReceived: 0,
    totalFundsSpent: 0,
    impactMetrics: {
      treesPlanted: 15000,
      wasteRecycled: 50000,
      carbonReduced: 2500
    },
    workAreas: ['Environment', 'Climate Change', 'Waste Management'],
    achievements: [
      'Planted 15,000 trees across Maharashtra',
      'Established 10 recycling centers',
      'Reduced carbon footprint by 2500 tons'
    ],
    createdAt: new Date('2023-02-20'),
    lastUpdated: new Date()
  },
  {
    uid: 'ngo-food-for-all-003',
    organization: 'Food For All',
    email: 'support@foodforall.org',
    description: 'Fighting hunger and malnutrition by providing nutritious meals to those in need.',
    walletAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // Sample wallet address
    points: 520,
    approvedSubmissions: 22,
    pendingSubmissions: 3,
    joinedDate: '2022-11-10',
    location: 'Bangalore, India',
    category: 'Food Security & Nutrition',
    website: 'https://foodforall.org',
    phone: '+91-80-4567-8901',
    registrationNumber: 'NGO/KA/2022/003',
    isVerified: true,
    totalDonationsReceived: 0,
    totalFundsSpent: 0,
    impactMetrics: {
      mealsServed: 100000,
      familiesHelped: 5000,
      nutritionPrograms: 15
    },
    workAreas: ['Food Distribution', 'Nutrition', 'Community Kitchens'],
    achievements: [
      'Served 100,000+ meals to hungry families',
      'Established 8 community kitchens',
      'Nutrition programs for 1000+ children'
    ],
    createdAt: new Date('2022-11-10'),
    lastUpdated: new Date()
  },
  {
    uid: 'ngo-education-first-004',
    organization: 'Education First Foundation',
    email: 'hello@educationfirst.org',
    description: 'Empowering underprivileged children through quality education and skill development programs.',
    walletAddress: '0xA0b86a33E6441E8e2F4c6d6E8F8E8E8E8E8E8E8E', // Sample wallet address
    points: 410,
    approvedSubmissions: 16,
    pendingSubmissions: 1,
    joinedDate: '2023-03-05',
    location: 'Chennai, India',
    category: 'Education & Skill Development',
    website: 'https://educationfirst.org',
    phone: '+91-44-5678-9012',
    registrationNumber: 'NGO/TN/2023/004',
    isVerified: true,
    totalDonationsReceived: 0,
    totalFundsSpent: 0,
    impactMetrics: {
      studentsEducated: 3000,
      schoolsSupported: 20,
      teachersTrained: 150
    },
    workAreas: ['Primary Education', 'Skill Training', 'Digital Literacy'],
    achievements: [
      'Educated 3000+ underprivileged children',
      'Established 12 learning centers',
      'Trained 150+ teachers in rural areas'
    ],
    createdAt: new Date('2023-03-05'),
    lastUpdated: new Date()
  },
  {
    uid: 'ngo-women-empowerment-005',
    organization: 'Women Empowerment Society',
    email: 'contact@womenempowerment.org',
    description: 'Dedicated to empowering women through education, skill development, and economic opportunities.',
    walletAddress: '0xB0c86a33E6441E8e2F4c6d6E8F8E8E8E8E8E8E8F', // Sample wallet address
    points: 350,
    approvedSubmissions: 14,
    pendingSubmissions: 2,
    joinedDate: '2023-04-12',
    location: 'Pune, India',
    category: 'Women Empowerment',
    website: 'https://womenempowerment.org',
    phone: '+91-20-6789-0123',
    registrationNumber: 'NGO/MH/2023/005',
    isVerified: true,
    totalDonationsReceived: 0,
    totalFundsSpent: 0,
    impactMetrics: {
      womenTrained: 2000,
      businessesStarted: 500,
      livesTransformed: 1500
    },
    workAreas: ['Skill Development', 'Microfinance', 'Legal Aid'],
    achievements: [
      'Trained 2000+ women in various skills',
      'Helped start 500+ small businesses',
      'Provided legal aid to 800+ women'
    ],
    createdAt: new Date('2023-04-12'),
    lastUpdated: new Date()
  },
  {
    uid: 'ngo-disaster-relief-006',
    organization: 'Disaster Relief Network',
    email: 'emergency@disasterrelief.org',
    description: 'Rapid response organization providing emergency aid and rehabilitation during natural disasters.',
    walletAddress: '0xC0d86a33E6441E8e2F4c6d6E8F8E8E8E8E8E8E8G', // Sample wallet address
    points: 480,
    approvedSubmissions: 19,
    pendingSubmissions: 1,
    joinedDate: '2022-08-20',
    location: 'Kolkata, India',
    category: 'Disaster Relief & Emergency Response',
    website: 'https://disasterrelief.org',
    phone: '+91-33-7890-1234',
    registrationNumber: 'NGO/WB/2022/006',
    isVerified: true,
    totalDonationsReceived: 0,
    totalFundsSpent: 0,
    impactMetrics: {
      disasterResponses: 25,
      familiesRescued: 8000,
      reliefCampsSetup: 50
    },
    workAreas: ['Emergency Response', 'Rehabilitation', 'Disaster Preparedness'],
    achievements: [
      'Responded to 25+ natural disasters',
      'Rescued and rehabilitated 8000+ families',
      'Set up 50+ emergency relief camps'
    ],
    createdAt: new Date('2022-08-20'),
    lastUpdated: new Date()
  }
]

// Function to add sample NGOs to Firebase
export const addSampleNGOs = async () => {
  try {
    console.log('🔄 Adding sample NGOs to database...')
    
    for (const ngo of sampleNGOs) {
      // Check if NGO already exists
      const existingQuery = query(
        collection(db, 'ngo_profiles'),
        where('uid', '==', ngo.uid)
      )
      const existingDocs = await getDocs(existingQuery)
      
      if (existingDocs.empty) {
        // Add new NGO
        const docRef = await addDoc(collection(db, 'ngo_profiles'), ngo)
        console.log(`✅ Added NGO: ${ngo.organization} (ID: ${docRef.id})`)
      } else {
        console.log(`⚠️ NGO already exists: ${ngo.organization}`)
      }
    }
    
    console.log('🎉 Sample NGOs added successfully!')
    return { success: true, message: 'Sample NGOs added successfully!' }
  } catch (error) {
    console.error('❌ Error adding sample NGOs:', error)
    return { success: false, error: error.message }
  }
}

// Sample donation data
export const sampleDonations = [
  {
    donorUid: 'sample-donor-001',
    donorName: 'Rajesh Kumar',
    donorEmail: 'rajesh@example.com',
    ngoId: 'ngo-hope-foundation-001',
    ngoName: 'Hope Foundation',
    ngoWalletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A',
    amount: 0.5,
    purpose: 'healthcare',
    message: 'Keep up the great work in providing healthcare to the needy!',
    isAnonymous: false,
    transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
    blockNumber: 12345678,
    gasUsed: '21000',
    status: 'completed',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    donorUid: 'sample-donor-002',
    donorName: 'Anonymous',
    donorEmail: 'anonymous@example.com',
    ngoId: 'ngo-food-for-all-003',
    ngoName: 'Food For All',
    ngoWalletAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    amount: 1.0,
    purpose: 'food_distribution',
    message: '',
    isAnonymous: true,
    transactionHash: '0xabcdef1234567890abcdef1234567890abcdef12',
    blockNumber: 12345679,
    gasUsed: '21000',
    status: 'completed',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    donorUid: 'sample-donor-003',
    donorName: 'Priya Sharma',
    donorEmail: 'priya@example.com',
    ngoId: 'ngo-education-first-004',
    ngoName: 'Education First Foundation',
    ngoWalletAddress: '0xA0b86a33E6441E8e2F4c6d6E8F8E8E8E8E8E8E8E',
    amount: 0.25,
    purpose: 'education',
    message: 'Education is the key to breaking the cycle of poverty.',
    isAnonymous: false,
    transactionHash: '0x567890abcdef1234567890abcdef1234567890ab',
    blockNumber: 12345680,
    gasUsed: '21000',
    status: 'completed',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    donorUid: 'sample-donor-004',
    donorName: 'Amit Patel',
    donorEmail: 'amit@example.com',
    ngoId: 'ngo-green-earth-002',
    ngoName: 'Green Earth Initiative',
    ngoWalletAddress: '0x8ba1f109551bD432803012645Hac136c9c0F90F90',
    amount: 0.75,
    purpose: 'infrastructure',
    message: 'Supporting environmental conservation efforts.',
    isAnonymous: false,
    transactionHash: '0x890abcdef1234567890abcdef1234567890abcdef',
    blockNumber: 12345681,
    gasUsed: '21000',
    status: 'completed',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  }
]

// Function to add sample donations
export const addSampleDonations = async () => {
  try {
    console.log('🔄 Adding sample donations...')

    for (const donation of sampleDonations) {
      // Check if donation already exists
      const existingQuery = query(
        collection(db, 'donations'),
        where('transactionHash', '==', donation.transactionHash)
      )
      const existingDocs = await getDocs(existingQuery)

      if (existingDocs.empty) {
        const docRef = await addDoc(collection(db, 'donations'), donation)
        console.log(`✅ Added donation: ${donation.amount} MATIC to ${donation.ngoName}`)
      } else {
        console.log(`⚠️ Donation already exists: ${donation.transactionHash}`)
      }
    }

    console.log('🎉 Sample donations added successfully!')
    return { success: true, message: 'Sample donations added successfully!' }
  } catch (error) {
    console.error('❌ Error adding sample donations:', error)
    return { success: false, error: error.message }
  }
}

// Function to get all NGOs for display
export const getAllNGOs = async () => {
  try {
    const ngoQuery = collection(db, 'ngo_profiles')
    const snapshot = await getDocs(ngoQuery)

    const ngos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return ngos.sort((a, b) => (b.points || 0) - (a.points || 0))
  } catch (error) {
    console.error('❌ Error fetching NGOs:', error)
    return []
  }
}

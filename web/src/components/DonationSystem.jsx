import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../services/firebase'
import { collection, addDoc, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore'
import blockchainService from '../services/blockchain'
import { addSampleNGOs, addSampleDonations } from '../utils/sampleNGOData'
import FirebaseRulesChecker from './FirebaseRulesChecker'
import toast from 'react-hot-toast'

export default function DonationSystem() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('donate')
  const [ngos, setNgos] = useState([])
  const [selectedNgo, setSelectedNgo] = useState(null)
  const [donationForm, setDonationForm] = useState({
    amount: '',
    purpose: 'food_distribution',
    message: '',
    donorName: '',
    isAnonymous: false
  })
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [donations, setDonations] = useState([])
  const [ngoBalances, setNgoBalances] = useState({})

  // Initialize blockchain service
  useEffect(() => {
    const initBlockchain = async () => {
      const initialized = await blockchainService.initialize()
      if (initialized) {
        console.log('✅ Blockchain service initialized')
      }
    }
    initBlockchain()
  }, [])

  // Fetch NGOs from database and initialize sample data if needed
  useEffect(() => {
    const initializeNGOs = async () => {
      try {
        // First check if we have any NGOs
        const ngoQuery = query(collection(db, 'ngo_profiles'))
        const snapshot = await getDocs(ngoQuery)

        // If no NGOs exist, add sample data
        if (snapshot.empty) {
          console.log('🔄 No NGOs found, adding sample data...')
          await addSampleNGOs()
          await addSampleDonations()
        }
      } catch (error) {
        console.error('❌ Firebase permission error:', error)
        if (error.code === 'permission-denied') {
          toast.error('Firebase permission denied. Please check Firestore security rules.', {
            duration: 10000,
            style: {
              background: '#FEE2E2',
              color: '#DC2626',
              border: '1px solid #FECACA'
            }
          })
        }
      }
    }

    initializeNGOs()

    const ngoQuery = query(
      collection(db, 'ngo_profiles'),
      orderBy('points', 'desc')
    )

    const unsubscribe = onSnapshot(ngoQuery, (snapshot) => {
      const ngoData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setNgos(ngoData)

      // Fetch blockchain balances for each NGO
      ngoData.forEach(async (ngo) => {
        if (ngo.walletAddress) {
          const balance = await blockchainService.getNGOBalance(ngo.walletAddress)
          setNgoBalances(prev => ({
            ...prev,
            [ngo.id]: balance
          }))
        }
      })
    }, (error) => {
      console.error('❌ Firestore listener error:', error)
      if (error.code === 'permission-denied') {
        toast.error('Cannot load NGO data. Please check Firebase security rules.', {
          duration: 8000
        })
      }
    })

    return unsubscribe
  }, [])

  // Fetch donation history
  useEffect(() => {
    if (user) {
      const donationsQuery = query(
        collection(db, 'donations'),
        where('donorUid', '==', user.uid),
        orderBy('createdAt', 'desc')
      )
      
      const unsubscribe = onSnapshot(donationsQuery, (snapshot) => {
        const donationData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setDonations(donationData)
      })

      return unsubscribe
    }
  }, [user])

  // Connect wallet
  const connectWallet = async () => {
    setLoading(true)
    try {
      const result = await blockchainService.connectWallet()
      if (result.success) {
        setWalletConnected(true)
        setWalletAddress(result.address)
        toast.success('Wallet connected successfully!')
      } else {
        toast.error(result.error || 'Failed to connect wallet')
      }
    } catch (error) {
      toast.error('Error connecting wallet: ' + error.message)
    }
    setLoading(false)
  }

  // Handle donation
  const handleDonation = async (e) => {
    e.preventDefault()
    
    if (!walletConnected) {
      toast.error('Please connect your wallet first')
      return
    }
    
    if (!selectedNgo) {
      toast.error('Please select an NGO to donate to')
      return
    }
    
    if (!donationForm.amount || parseFloat(donationForm.amount) <= 0) {
      toast.error('Please enter a valid donation amount')
      return
    }

    setLoading(true)
    try {
      // Process blockchain donation
      const blockchainResult = await blockchainService.donate(
        selectedNgo.walletAddress || selectedNgo.uid, // Use wallet address or fallback to UID
        parseFloat(donationForm.amount),
        donationForm.purpose,
        donationForm.isAnonymous ? 'Anonymous' : donationForm.donorName
      )

      if (blockchainResult.success) {
        // Store donation record in Firebase
        const donationRecord = {
          donorUid: user.uid,
          donorName: donationForm.isAnonymous ? 'Anonymous' : donationForm.donorName,
          donorEmail: user.email,
          ngoId: selectedNgo.id,
          ngoName: selectedNgo.organization || selectedNgo.name,
          ngoWalletAddress: selectedNgo.walletAddress || selectedNgo.uid,
          amount: parseFloat(donationForm.amount),
          purpose: donationForm.purpose,
          message: donationForm.message,
          isAnonymous: donationForm.isAnonymous,
          transactionHash: blockchainResult.transactionHash,
          blockNumber: blockchainResult.blockNumber,
          gasUsed: blockchainResult.gasUsed,
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        await addDoc(collection(db, 'donations'), donationRecord)

        // Reset form
        setDonationForm({
          amount: '',
          purpose: 'food_distribution',
          message: '',
          donorName: '',
          isAnonymous: false
        })
        setSelectedNgo(null)

        toast.success(`Donation of ${donationForm.amount} MATIC successful! Transaction: ${blockchainResult.transactionHash.substring(0, 10)}...`)
      } else {
        toast.error('Blockchain transaction failed: ' + blockchainResult.error)
      }
    } catch (error) {
      console.error('Donation error:', error)
      toast.error('Donation failed: ' + error.message)
    }
    setLoading(false)
  }

  const purposeOptions = [
    { value: 'food_distribution', label: '🍽️ Food Distribution', description: 'Provide meals to those in need' },
    { value: 'healthcare', label: '🏥 Healthcare', description: 'Medical aid and health camps' },
    { value: 'education', label: '📚 Education', description: 'Educational support and resources' },
    { value: 'disaster_relief', label: '🆘 Disaster Relief', description: 'Emergency aid and support' },
    { value: 'infrastructure', label: '🏗️ Infrastructure', description: 'Community development projects' },
    { value: 'general', label: '💝 General Support', description: 'Flexible use for NGO operations' }
  ]

  // Function to manually add sample NGOs and donations (for testing)
  const handleAddSampleNGOs = async () => {
    setLoading(true)
    try {
      const ngoResult = await addSampleNGOs()
      const donationResult = await addSampleDonations()

      if (ngoResult.success && donationResult.success) {
        toast.success('Sample NGOs and donations added successfully!')
      } else {
        toast.error('Some data failed to add. Check console for details.')
      }
    } catch (error) {
      toast.error('Error: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Firebase Rules Status Checker */}
      <FirebaseRulesChecker />

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Blockchain Donation System
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Donate to verified NGOs with complete transparency through blockchain technology. 
          Every transaction is recorded and publicly verifiable.
        </p>
      </div>

      {/* Wallet Connection */}
      {!walletConnected && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Connect Your Wallet</h3>
              <p className="text-blue-100">Connect your MetaMask wallet to start making transparent donations</p>
            </div>
            <button
              onClick={connectWallet}
              disabled={loading}
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      )}

      {/* Connected Wallet Info */}
      {walletConnected && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-medium text-green-800">Wallet Connected:</span>
            <span className="text-green-700 font-mono text-sm">
              {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-8">
        {[
          { id: 'donate', label: 'Make Donation', icon: '💝' },
          { id: 'ngos', label: 'NGO Directory', icon: '🏢' },
          { id: 'history', label: 'My Donations', icon: '📋' },
          { id: 'transparency', label: 'Transparency', icon: '🔍' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'donate' && (
          <motion.div
            key="donate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* NGO Selection */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Select NGO to Support</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ngos.map((ngo) => (
                  <div
                    key={ngo.id}
                    onClick={() => setSelectedNgo(ngo)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedNgo?.id === ngo.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                        {(ngo.organization || ngo.name || 'N').charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{ngo.organization || ngo.name}</h4>
                        <p className="text-sm text-gray-600">{ngo.points || 0} points</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>Balance: {ngoBalances[ngo.id] || '0'} MATIC</p>
                      <p>Approved: {ngo.approvedSubmissions || 0} submissions</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Donation Form */}
            {selectedNgo && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Donate to {selectedNgo.organization || selectedNgo.name}
                </h3>
                <form onSubmit={handleDonation} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Donation Amount (MATIC) *
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        value={donationForm.amount}
                        onChange={(e) => setDonationForm(prev => ({ ...prev, amount: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.1"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Purpose *</label>
                      <select
                        value={donationForm.purpose}
                        onChange={(e) => setDonationForm(prev => ({ ...prev, purpose: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {purposeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                    <input
                      type="text"
                      value={donationForm.donorName}
                      onChange={(e) => setDonationForm(prev => ({ ...prev, donorName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your name (optional)"
                      disabled={donationForm.isAnonymous}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message (Optional)</label>
                    <textarea
                      value={donationForm.message}
                      onChange={(e) => setDonationForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Leave a message for the NGO..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={donationForm.isAnonymous}
                      onChange={(e) => setDonationForm(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="anonymous" className="text-sm text-gray-700">
                      Donate anonymously
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !walletConnected}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? 'Processing Donation...' : `Donate ${donationForm.amount || '0'} MATIC`}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'ngos' && (
          <motion.div
            key="ngos"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Verified NGO Directory</h3>
              {import.meta.env.DEV && (
                <button
                  onClick={handleAddSampleNGOs}
                  disabled={loading}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Sample Data'}
                </button>
              )}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ngos.map((ngo) => (
                <div key={ngo.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {(ngo.organization || ngo.name || 'N').charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{ngo.organization || ngo.name}</h4>
                      <p className="text-sm text-gray-600">{ngo.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Government Points:</span>
                      <span className="font-semibold text-green-600">{ngo.points || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Blockchain Balance:</span>
                      <span className="font-semibold text-blue-600">{ngoBalances[ngo.id] || '0'} MATIC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Approved Work:</span>
                      <span className="font-semibold">{ngo.approvedSubmissions || 0} submissions</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span>{ngo.location || 'India'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedNgo(ngo)
                      setActiveTab('donate')
                    }}
                    className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all"
                  >
                    Donate Now
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6">Your Donation History</h3>
            {donations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">💝</div>
                <p className="text-lg">No donations yet</p>
                <p className="text-sm">Start making a difference by donating to verified NGOs</p>
              </div>
            ) : (
              <div className="space-y-4">
                {donations.map((donation) => (
                  <div key={donation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-800">{donation.ngoName}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(donation.createdAt?.toDate()).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{donation.amount} MATIC</p>
                        <p className="text-xs text-gray-500">${(donation.amount * 0.8).toFixed(2)} USD</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Purpose:</span>
                        <span className="ml-2 font-medium">{donation.purpose.replace('_', ' ')}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className="ml-2 text-green-600 font-medium">✅ {donation.status}</span>
                      </div>
                    </div>

                    {donation.message && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">"{donation.message}"</p>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>Transaction: {donation.transactionHash?.substring(0, 10)}...</span>
                      <a
                        href={`https://mumbai.polygonscan.com/tx/${donation.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        View on Blockchain ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'transparency' && (
          <motion.div
            key="transparency"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Transparency Overview */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Blockchain Transparency</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl mb-2">🔗</div>
                  <h4 className="font-semibold text-blue-800">Immutable Records</h4>
                  <p className="text-sm text-blue-600">All donations recorded on blockchain</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl mb-2">👁️</div>
                  <h4 className="font-semibold text-green-800">Public Verification</h4>
                  <p className="text-sm text-green-600">Anyone can verify transactions</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl mb-2">📊</div>
                  <h4 className="font-semibold text-purple-800">Real-time Tracking</h4>
                  <p className="text-sm text-purple-600">Live fund usage monitoring</p>
                </div>
              </div>
            </div>

            {/* Global Statistics */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Platform Statistics</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {donations.reduce((sum, d) => sum + d.amount, 0).toFixed(3)}
                  </p>
                  <p className="text-sm text-gray-600">Total MATIC Donated</p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{donations.length}</p>
                  <p className="text-sm text-gray-600">Total Donations</p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{ngos.length}</p>
                  <p className="text-sm text-gray-600">Verified NGOs</p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">100%</p>
                  <p className="text-sm text-gray-600">Transparency</p>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">How Blockchain Ensures Transparency</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Donation Recording</h4>
                    <p className="text-gray-600">Every donation is recorded on the Polygon blockchain with donor details, amount, and purpose.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Fund Tracking</h4>
                    <p className="text-gray-600">NGOs can only spend funds through smart contracts, creating an immutable spending record.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Public Verification</h4>
                    <p className="text-gray-600">Anyone can verify transactions on the blockchain explorer using transaction hashes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Impact Reporting</h4>
                    <p className="text-gray-600">NGOs provide proof of work through government-verified image submissions linked to fund usage.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

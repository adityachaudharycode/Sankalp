import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../services/firebase'
import { collection, addDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import blockchainService from '../services/blockchain'
import toast from 'react-hot-toast'

export default function NGOFundManagement() {
  const { user, userProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('balance')
  const [balance, setBalance] = useState('0')
  const [donations, setDonations] = useState([])
  const [spendings, setSpendings] = useState([])
  const [spendingForm, setSpendingForm] = useState({
    amount: '',
    purpose: 'food_distribution',
    description: '',
    proofDocuments: []
  })
  const [loading, setLoading] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')

  // Initialize blockchain and fetch data
  useEffect(() => {
    const initializeData = async () => {
      // Initialize blockchain
      const initialized = await blockchainService.initialize()
      if (initialized) {
        // Check if wallet is already connected
        const address = await blockchainService.getCurrentAddress()
        if (address) {
          setWalletConnected(true)
          setWalletAddress(address)
          await fetchBlockchainData(address)
        }
      }
    }
    
    initializeData()
  }, [])

  // Fetch donations from Firebase
  useEffect(() => {
    if (user) {
      const donationsQuery = query(
        collection(db, 'donations'),
        where('ngoId', '==', userProfile?.id || user.uid),
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
  }, [user, userProfile])

  // Fetch spending history from Firebase
  useEffect(() => {
    if (user) {
      const spendingsQuery = query(
        collection(db, 'ngo_spendings'),
        where('ngoUid', '==', user.uid),
        orderBy('createdAt', 'desc')
      )
      
      const unsubscribe = onSnapshot(spendingsQuery, (snapshot) => {
        const spendingData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setSpendings(spendingData)
      })

      return unsubscribe
    }
  }, [user])

  // Fetch blockchain data
  const fetchBlockchainData = async (address) => {
    try {
      const ngoBalance = await blockchainService.getNGOBalance(address)
      setBalance(ngoBalance)
      
      const donationHistory = await blockchainService.getDonationHistory(address)
      const spendingHistory = await blockchainService.getSpendingHistory(address)
      
      console.log('Blockchain data:', { ngoBalance, donationHistory, spendingHistory })
    } catch (error) {
      console.error('Error fetching blockchain data:', error)
    }
  }

  // Connect wallet
  const connectWallet = async () => {
    setLoading(true)
    try {
      const result = await blockchainService.connectWallet()
      if (result.success) {
        setWalletConnected(true)
        setWalletAddress(result.address)
        await fetchBlockchainData(result.address)
        toast.success('Wallet connected successfully!')
      } else {
        toast.error(result.error || 'Failed to connect wallet')
      }
    } catch (error) {
      toast.error('Error connecting wallet: ' + error.message)
    }
    setLoading(false)
  }

  // Handle fund spending
  const handleSpending = async (e) => {
    e.preventDefault()
    
    if (!walletConnected) {
      toast.error('Please connect your wallet first')
      return
    }
    
    if (!spendingForm.amount || parseFloat(spendingForm.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    if (parseFloat(spendingForm.amount) > parseFloat(balance)) {
      toast.error('Insufficient balance')
      return
    }

    setLoading(true)
    try {
      // Process blockchain spending
      const blockchainResult = await blockchainService.spendFunds(
        parseFloat(spendingForm.amount),
        spendingForm.purpose,
        spendingForm.description
      )

      if (blockchainResult.success) {
        // Store spending record in Firebase
        const spendingRecord = {
          ngoUid: user.uid,
          ngoName: userProfile?.organization || userProfile?.name,
          ngoEmail: user.email,
          amount: parseFloat(spendingForm.amount),
          purpose: spendingForm.purpose,
          description: spendingForm.description,
          transactionHash: blockchainResult.transactionHash,
          blockNumber: blockchainResult.blockNumber,
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        await addDoc(collection(db, 'ngo_spendings'), spendingRecord)

        // Reset form
        setSpendingForm({
          amount: '',
          purpose: 'food_distribution',
          description: '',
          proofDocuments: []
        })

        // Refresh balance
        await fetchBlockchainData(walletAddress)

        toast.success(`Successfully spent ${spendingForm.amount} MATIC for ${spendingForm.purpose}`)
      } else {
        toast.error('Blockchain transaction failed: ' + blockchainResult.error)
      }
    } catch (error) {
      console.error('Spending error:', error)
      toast.error('Spending failed: ' + error.message)
    }
    setLoading(false)
  }

  const purposeOptions = [
    { value: 'food_distribution', label: '🍽️ Food Distribution', description: 'Meals and food supplies' },
    { value: 'healthcare', label: '🏥 Healthcare', description: 'Medical aid and supplies' },
    { value: 'education', label: '📚 Education', description: 'Educational materials and programs' },
    { value: 'disaster_relief', label: '🆘 Disaster Relief', description: 'Emergency aid and support' },
    { value: 'infrastructure', label: '🏗️ Infrastructure', description: 'Community development' },
    { value: 'operational', label: '⚙️ Operational', description: 'Administrative and operational costs' }
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          NGO Fund Management
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Manage your donated funds transparently through blockchain technology. 
          Every transaction is recorded and publicly verifiable.
        </p>
      </div>

      {/* Wallet Connection */}
      {!walletConnected && (
        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Connect Your NGO Wallet</h3>
              <p className="text-orange-100">Connect your MetaMask wallet to manage donated funds</p>
            </div>
            <button
              onClick={connectWallet}
              disabled={loading}
              className="px-6 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      )}

      {/* Connected Wallet Info */}
      {walletConnected && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium text-green-800">NGO Wallet Connected:</span>
              <span className="text-green-700 font-mono text-sm">
                {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-700">Available Balance</p>
              <p className="text-lg font-bold text-green-800">{balance} MATIC</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-8">
        {[
          { id: 'balance', label: 'Balance & Overview', icon: '💰' },
          { id: 'spend', label: 'Spend Funds', icon: '💸' },
          { id: 'donations', label: 'Donation History', icon: '📥' },
          { id: 'spendings', label: 'Spending History', icon: '📤' }
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
      {activeTab === 'balance' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Balance Overview */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Available Balance</h3>
                  <p className="text-3xl font-bold">{balance} MATIC</p>
                  <p className="text-green-100 text-sm">${(parseFloat(balance) * 0.8).toFixed(2)} USD</p>
                </div>
                <div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center text-2xl">
                  💰
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Total Received</h3>
                  <p className="text-3xl font-bold">{donations.reduce((sum, d) => sum + d.amount, 0).toFixed(3)}</p>
                  <p className="text-blue-100 text-sm">{donations.length} donations</p>
                </div>
                <div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center text-2xl">
                  📥
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Total Spent</h3>
                  <p className="text-3xl font-bold">{spendings.reduce((sum, s) => sum + s.amount, 0).toFixed(3)}</p>
                  <p className="text-orange-100 text-sm">{spendings.length} transactions</p>
                </div>
                <div className="w-12 h-12 bg-orange-400 rounded-lg flex items-center justify-center text-2xl">
                  📤
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {[...donations.slice(0, 3), ...spendings.slice(0, 3)]
                .sort((a, b) => new Date(b.createdAt?.toDate()) - new Date(a.createdAt?.toDate()))
                .slice(0, 5)
                .map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                      activity.donorUid ? 'bg-green-500' : 'bg-orange-500'
                    }`}>
                      {activity.donorUid ? '📥' : '📤'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {activity.donorUid ? 'Donation Received' : 'Funds Spent'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.purpose?.replace('_', ' ') || 'General'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${activity.donorUid ? 'text-green-600' : 'text-orange-600'}`}>
                      {activity.donorUid ? '+' : '-'}{activity.amount} MATIC
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.createdAt?.toDate()).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'spend' && walletConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-6">Spend Donated Funds</h3>
          
          <form onSubmit={handleSpending} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Spend (MATIC) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  max={balance}
                  value={spendingForm.amount}
                  onChange={(e) => setSpendingForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Available: {balance} MATIC</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Purpose *</label>
                <select
                  value={spendingForm.purpose}
                  onChange={(e) => setSpendingForm(prev => ({ ...prev, purpose: e.target.value }))}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Description *
              </label>
              <textarea
                value={spendingForm.description}
                onChange={(e) => setSpendingForm(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Provide detailed description of how the funds will be used..."
                required
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-yellow-600 text-lg">⚠️</span>
                <div>
                  <h4 className="font-medium text-yellow-800">Transparency Notice</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    This spending will be recorded on the blockchain and will be publicly visible. 
                    Make sure to provide accurate information about fund usage.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !walletConnected || parseFloat(spendingForm.amount) > parseFloat(balance)}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Processing Transaction...' : `Spend ${spendingForm.amount || '0'} MATIC`}
            </button>
          </form>
        </motion.div>
      )}
    </div>
  )
}

import { ethers } from 'ethers'
import CryptoJS from 'crypto-js'

// Smart Contract ABI for NGO Donation System
const DONATION_CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "_ngoAddress", "type": "address"},
      {"internalType": "string", "name": "_purpose", "type": "string"},
      {"internalType": "string", "name": "_donorName", "type": "string"}
    ],
    "name": "donate",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_amount", "type": "uint256"},
      {"internalType": "string", "name": "_purpose", "type": "string"},
      {"internalType": "string", "name": "_description", "type": "string"}
    ],
    "name": "spendFunds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_ngo", "type": "address"}],
    "name": "getNGOBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_ngo", "type": "address"}],
    "name": "getDonationHistory",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "donor", "type": "address"},
          {"internalType": "uint256", "name": "amount", "type": "uint256"},
          {"internalType": "string", "name": "purpose", "type": "string"},
          {"internalType": "string", "name": "donorName", "type": "string"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "internalType": "struct DonationContract.Donation[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_ngo", "type": "address"}],
    "name": "getSpendingHistory",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "amount", "type": "uint256"},
          {"internalType": "string", "name": "purpose", "type": "string"},
          {"internalType": "string", "name": "description", "type": "string"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "internalType": "struct DonationContract.Spending[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

// Contract address (you'll need to deploy this to a testnet/mainnet)
const CONTRACT_ADDRESS = import.meta.env.VITE_DONATION_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890'

// Polygon Mumbai Testnet configuration
const POLYGON_MUMBAI_CONFIG = {
  chainId: '0x13881',
  chainName: 'Polygon Mumbai Testnet',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18
  },
  rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
  blockExplorerUrls: ['https://mumbai.polygonscan.com/']
}

class BlockchainService {
  constructor() {
    this.provider = null
    this.signer = null
    this.contract = null
    this.isConnected = false
  }

  // Initialize Web3 connection
  async initialize() {
    try {
      if (typeof window.ethereum !== 'undefined') {
        this.provider = new ethers.BrowserProvider(window.ethereum)
        console.log('✅ Ethereum provider detected')
        return true
      } else {
        console.warn('⚠️ No Ethereum provider found. Please install MetaMask.')
        return false
      }
    } catch (error) {
      console.error('❌ Error initializing blockchain service:', error)
      return false
    }
  }

  // Connect to MetaMask wallet
  async connectWallet() {
    try {
      if (!this.provider) {
        throw new Error('Ethereum provider not found')
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      
      // Switch to Polygon Mumbai testnet
      await this.switchToPolygon()
      
      this.signer = await this.provider.getSigner()
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, DONATION_CONTRACT_ABI, this.signer)
      
      const address = await this.signer.getAddress()
      this.isConnected = true
      
      console.log('✅ Wallet connected:', address)
      return { success: true, address }
    } catch (error) {
      console.error('❌ Error connecting wallet:', error)
      return { success: false, error: error.message }
    }
  }

  // Switch to Polygon Mumbai testnet
  async switchToPolygon() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_MUMBAI_CONFIG.chainId }]
      })
    } catch (switchError) {
      // Chain not added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [POLYGON_MUMBAI_CONFIG]
          })
        } catch (addError) {
          throw new Error('Failed to add Polygon network to MetaMask')
        }
      } else {
        throw switchError
      }
    }
  }

  // Make a donation to NGO
  async donate(ngoAddress, amount, purpose, donorName) {
    try {
      if (!this.isConnected || !this.contract) {
        throw new Error('Wallet not connected')
      }

      const amountInWei = ethers.parseEther(amount.toString())
      
      console.log('🔄 Processing donation...', {
        ngoAddress,
        amount: amount.toString(),
        purpose,
        donorName
      })

      const tx = await this.contract.donate(ngoAddress, purpose, donorName, {
        value: amountInWei,
        gasLimit: 300000
      })

      console.log('⏳ Transaction submitted:', tx.hash)
      const receipt = await tx.wait()
      console.log('✅ Donation successful:', receipt)

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      }
    } catch (error) {
      console.error('❌ Donation failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get NGO balance
  async getNGOBalance(ngoAddress) {
    try {
      if (!this.contract) {
        // Use read-only provider for balance queries
        const provider = new ethers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com/')
        const contract = new ethers.Contract(CONTRACT_ADDRESS, DONATION_CONTRACT_ABI, provider)
        const balance = await contract.getNGOBalance(ngoAddress)
        return ethers.formatEther(balance)
      }

      const balance = await this.contract.getNGOBalance(ngoAddress)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error('❌ Error getting NGO balance:', error)
      return '0'
    }
  }

  // Get donation history for NGO
  async getDonationHistory(ngoAddress) {
    try {
      const provider = new ethers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com/')
      const contract = new ethers.Contract(CONTRACT_ADDRESS, DONATION_CONTRACT_ABI, provider)
      
      const donations = await contract.getDonationHistory(ngoAddress)
      
      return donations.map(donation => ({
        donor: donation.donor,
        amount: ethers.formatEther(donation.amount),
        purpose: donation.purpose,
        donorName: donation.donorName,
        timestamp: new Date(Number(donation.timestamp) * 1000),
        transactionHash: donation.transactionHash || 'N/A'
      }))
    } catch (error) {
      console.error('❌ Error getting donation history:', error)
      return []
    }
  }

  // Get spending history for NGO
  async getSpendingHistory(ngoAddress) {
    try {
      const provider = new ethers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com/')
      const contract = new ethers.Contract(CONTRACT_ADDRESS, DONATION_CONTRACT_ABI, provider)
      
      const spendings = await contract.getSpendingHistory(ngoAddress)
      
      return spendings.map(spending => ({
        amount: ethers.formatEther(spending.amount),
        purpose: spending.purpose,
        description: spending.description,
        timestamp: new Date(Number(spending.timestamp) * 1000)
      }))
    } catch (error) {
      console.error('❌ Error getting spending history:', error)
      return []
    }
  }

  // Spend funds (for NGOs)
  async spendFunds(amount, purpose, description) {
    try {
      if (!this.isConnected || !this.contract) {
        throw new Error('Wallet not connected')
      }

      const amountInWei = ethers.parseEther(amount.toString())
      
      const tx = await this.contract.spendFunds(amountInWei, purpose, description, {
        gasLimit: 200000
      })

      const receipt = await tx.wait()
      
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      }
    } catch (error) {
      console.error('❌ Spending failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Generate transaction hash for off-chain tracking
  generateTransactionHash(donorId, ngoId, amount, timestamp) {
    const data = `${donorId}-${ngoId}-${amount}-${timestamp}`
    return CryptoJS.SHA256(data).toString()
  }

  // Verify transaction integrity
  verifyTransaction(transactionData, hash) {
    const computedHash = this.generateTransactionHash(
      transactionData.donorId,
      transactionData.ngoId,
      transactionData.amount,
      transactionData.timestamp
    )
    return computedHash === hash
  }

  // Get current wallet address
  async getCurrentAddress() {
    try {
      if (this.signer) {
        return await this.signer.getAddress()
      }
      return null
    } catch (error) {
      console.error('❌ Error getting current address:', error)
      return null
    }
  }

  // Disconnect wallet
  disconnect() {
    this.provider = null
    this.signer = null
    this.contract = null
    this.isConnected = false
    console.log('🔌 Wallet disconnected')
  }
}

// Create singleton instance
const blockchainService = new BlockchainService()

export default blockchainService

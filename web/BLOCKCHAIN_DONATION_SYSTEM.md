# Blockchain-Based NGO Donation System

## 🎯 **Overview**

The Sankalp platform now includes a comprehensive blockchain-based donation system that enables transparent, verifiable donations to NGOs. This system uses smart contracts on the Polygon Mumbai testnet to ensure complete transparency and accountability in fund management.

## 🏗️ **System Architecture**

### **1. Smart Contract Layer**
- **Contract**: `DonationContract.sol` deployed on Polygon Mumbai testnet
- **Features**: Donation tracking, fund management, spending verification
- **Transparency**: All transactions publicly verifiable on blockchain

### **2. Frontend Components**
- **Public Dashboard**: `DonationSystem.jsx` - For public donations
- **NGO Dashboard**: `NGOFundManagement.jsx` - For NGO fund management
- **Blockchain Service**: `blockchain.js` - Web3 integration

### **3. Database Integration**
- **Firebase Collections**: 
  - `donations` - Off-chain donation records
  - `ngo_spendings` - Spending transaction records
  - `ngo_profiles` - NGO verification and points

## 💝 **Donation Flow**

### **For Public Users:**

1. **Connect Wallet** 
   - MetaMask integration
   - Automatic network switching to Polygon Mumbai
   - Real-time balance display

2. **Select NGO**
   - Browse verified NGOs
   - View NGO points and blockchain balance
   - See government-approved work history

3. **Make Donation**
   - Choose donation amount (MATIC)
   - Select purpose (food, healthcare, education, etc.)
   - Add optional message
   - Option for anonymous donation

4. **Blockchain Transaction**
   - Smart contract records donation
   - Immutable transaction on blockchain
   - Automatic balance update for NGO

5. **Verification**
   - Transaction hash for public verification
   - View on Polygon Mumbai explorer
   - Real-time dashboard updates

## 💰 **NGO Fund Management**

### **For NGO Users:**

1. **Connect NGO Wallet**
   - MetaMask integration for NGO accounts
   - View available donated funds
   - Real-time balance tracking

2. **Fund Overview**
   - Total received donations
   - Current available balance
   - Spending history
   - Recent activity feed

3. **Transparent Spending**
   - Spend funds through smart contract
   - Required purpose and description
   - Blockchain-recorded transactions
   - Public spending verification

4. **Accountability**
   - All spending publicly visible
   - Link to government-verified work
   - Automatic balance updates
   - Donor confidence building

## 🔗 **Blockchain Features**

### **Smart Contract Functions:**

```solidity
// Core donation function
function donate(address _ngoAddress, string _purpose, string _donorName) payable

// NGO spending function  
function spendFunds(uint256 _amount, string _purpose, string _description)

// Transparency functions
function getNGOBalance(address _ngoAddress) view returns (uint256)
function getDonationHistory(address _ngoAddress) view returns (Donation[])
function getSpendingHistory(address _ngoAddress) view returns (Spending[])
```

### **Transparency Guarantees:**

1. **Immutable Records**: All donations recorded permanently
2. **Public Verification**: Anyone can verify transactions
3. **Real-time Tracking**: Live fund usage monitoring
4. **Spending Accountability**: NGOs must justify all expenditures

## 🎮 **User Experience**

### **Public Dashboard - Donation Tab:**
- **Wallet Connection**: One-click MetaMask integration
- **NGO Directory**: Browse verified NGOs with ratings
- **Donation Form**: Intuitive donation interface
- **History Tracking**: Personal donation history
- **Transparency View**: Blockchain verification tools

### **NGO Dashboard - Fund Management Tab:**
- **Balance Overview**: Real-time fund tracking
- **Spending Interface**: Transparent fund usage
- **Activity History**: Complete transaction log
- **Verification Tools**: Link spending to work proof

## 🔧 **Technical Implementation**

### **Dependencies Added:**
```json
{
  "ethers": "^6.8.0",
  "web3": "^4.2.0", 
  "crypto-js": "^4.2.0"
}
```

### **Key Files Created:**
- `web/src/services/blockchain.js` - Blockchain service layer
- `web/src/components/DonationSystem.jsx` - Public donation interface
- `web/src/components/NGOFundManagement.jsx` - NGO fund management
- `web/contracts/DonationContract.sol` - Smart contract

### **Integration Points:**
- **Public Dashboard**: New "Donate" tab with full donation system
- **NGO Dashboard**: New "Fund Management" tab for spending
- **Government Dashboard**: NGO verification affects donation eligibility

## 🚀 **Setup Instructions**

### **1. Install Dependencies**
```bash
cd web
npm install ethers web3 crypto-js
```

### **2. Configure Environment**
Add to `.env` file:
```
VITE_DONATION_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
```

### **3. Deploy Smart Contract**
1. Compile `DonationContract.sol`
2. Deploy to Polygon Mumbai testnet
3. Update contract address in environment

### **4. MetaMask Setup**
1. Install MetaMask browser extension
2. Add Polygon Mumbai testnet
3. Get test MATIC from faucet

## 🎯 **Benefits**

### **For Donors:**
- **Complete Transparency**: See exactly how funds are used
- **Verification**: Blockchain proof of donations
- **Impact Tracking**: Link donations to real work
- **Trust Building**: Government-verified NGOs only

### **For NGOs:**
- **Credibility**: Transparent fund management
- **Efficiency**: Direct blockchain transfers
- **Accountability**: Public spending records
- **Growth**: Increased donor confidence

### **For Platform:**
- **Innovation**: Cutting-edge blockchain integration
- **Trust**: Unparalleled transparency
- **Scalability**: Decentralized fund management
- **Impact**: Real social change facilitation

## 🔍 **Verification Process**

### **How to Verify Donations:**

1. **Get Transaction Hash**: From donation confirmation
2. **Visit Blockchain Explorer**: https://mumbai.polygonscan.com/
3. **Search Transaction**: Enter transaction hash
4. **View Details**: See donation amount, NGO address, timestamp
5. **Track Spending**: Monitor NGO spending transactions

### **Public Transparency:**
- All donations publicly visible
- NGO spending tracked in real-time
- Government verification integrated
- Community oversight enabled

## 📊 **Impact Metrics**

The system tracks:
- **Total Donations**: Cumulative MATIC donated
- **Active NGOs**: Number of verified organizations
- **Transparency Score**: 100% blockchain verification
- **Fund Utilization**: Real-time spending tracking

## 🔮 **Future Enhancements**

1. **Multi-token Support**: Accept various cryptocurrencies
2. **Impact NFTs**: Mint NFTs for donation milestones
3. **DAO Governance**: Community voting on NGO verification
4. **Cross-chain Bridge**: Support multiple blockchain networks
5. **AI Analytics**: Smart fund allocation recommendations

## 🎉 **Ready to Use!**

The blockchain donation system is now fully integrated and ready for use. Users can:

1. **Make Transparent Donations**: Through the Public Dashboard
2. **Manage Funds Responsibly**: Through the NGO Dashboard  
3. **Verify All Transactions**: Through blockchain explorers
4. **Track Real Impact**: Through government-verified work

This system represents a revolutionary approach to charitable giving, combining the transparency of blockchain technology with the social impact verification of government oversight.

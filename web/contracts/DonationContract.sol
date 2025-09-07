// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title NGO Donation Contract
 * @dev Smart contract for transparent NGO donations with spending tracking
 * @author Sankalp Platform
 */
contract DonationContract {
    
    // Events
    event DonationReceived(
        address indexed donor,
        address indexed ngo,
        uint256 amount,
        string purpose,
        string donorName,
        uint256 timestamp
    );
    
    event FundsSpent(
        address indexed ngo,
        uint256 amount,
        string purpose,
        string description,
        uint256 timestamp
    );
    
    event NGORegistered(
        address indexed ngo,
        string name,
        string email,
        uint256 timestamp
    );
    
    // Structs
    struct Donation {
        address donor;
        uint256 amount;
        string purpose;
        string donorName;
        uint256 timestamp;
        bool isAnonymous;
    }
    
    struct Spending {
        uint256 amount;
        string purpose;
        string description;
        uint256 timestamp;
        string proofHash; // IPFS hash for proof documents
    }
    
    struct NGOProfile {
        string name;
        string email;
        string description;
        bool isVerified;
        uint256 totalReceived;
        uint256 totalSpent;
        uint256 registrationTime;
    }
    
    // State variables
    mapping(address => NGOProfile) public ngoProfiles;
    mapping(address => Donation[]) public donationHistory;
    mapping(address => Spending[]) public spendingHistory;
    mapping(address => uint256) public ngoBalances;
    
    address[] public registeredNGOs;
    address public owner;
    uint256 public totalDonations;
    uint256 public totalNGOs;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyRegisteredNGO() {
        require(ngoProfiles[msg.sender].registrationTime > 0, "NGO not registered");
        _;
    }
    
    modifier validAmount() {
        require(msg.value > 0, "Donation amount must be greater than 0");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Register a new NGO
     * @param _name NGO name
     * @param _email NGO email
     * @param _description NGO description
     */
    function registerNGO(
        string memory _name,
        string memory _email,
        string memory _description
    ) external {
        require(ngoProfiles[msg.sender].registrationTime == 0, "NGO already registered");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_email).length > 0, "Email cannot be empty");
        
        ngoProfiles[msg.sender] = NGOProfile({
            name: _name,
            email: _email,
            description: _description,
            isVerified: false,
            totalReceived: 0,
            totalSpent: 0,
            registrationTime: block.timestamp
        });
        
        registeredNGOs.push(msg.sender);
        totalNGOs++;
        
        emit NGORegistered(msg.sender, _name, _email, block.timestamp);
    }
    
    /**
     * @dev Verify an NGO (only owner)
     * @param _ngoAddress Address of the NGO to verify
     */
    function verifyNGO(address _ngoAddress) external onlyOwner {
        require(ngoProfiles[_ngoAddress].registrationTime > 0, "NGO not registered");
        ngoProfiles[_ngoAddress].isVerified = true;
    }
    
    /**
     * @dev Make a donation to an NGO
     * @param _ngoAddress Address of the NGO
     * @param _purpose Purpose of the donation
     * @param _donorName Name of the donor (can be "Anonymous")
     */
    function donate(
        address _ngoAddress,
        string memory _purpose,
        string memory _donorName
    ) external payable validAmount {
        require(ngoProfiles[_ngoAddress].registrationTime > 0, "NGO not registered");
        require(ngoProfiles[_ngoAddress].isVerified, "NGO not verified");
        require(bytes(_purpose).length > 0, "Purpose cannot be empty");
        
        // Update balances
        ngoBalances[_ngoAddress] += msg.value;
        ngoProfiles[_ngoAddress].totalReceived += msg.value;
        totalDonations += msg.value;
        
        // Record donation
        bool isAnonymous = keccak256(bytes(_donorName)) == keccak256(bytes("Anonymous"));
        
        donationHistory[_ngoAddress].push(Donation({
            donor: msg.sender,
            amount: msg.value,
            purpose: _purpose,
            donorName: _donorName,
            timestamp: block.timestamp,
            isAnonymous: isAnonymous
        }));
        
        emit DonationReceived(
            msg.sender,
            _ngoAddress,
            msg.value,
            _purpose,
            _donorName,
            block.timestamp
        );
    }
    
    /**
     * @dev Spend funds (only registered NGOs)
     * @param _amount Amount to spend
     * @param _purpose Purpose of spending
     * @param _description Detailed description
     * @param _proofHash IPFS hash of proof documents
     */
    function spendFunds(
        uint256 _amount,
        string memory _purpose,
        string memory _description,
        string memory _proofHash
    ) external onlyRegisteredNGO {
        require(_amount > 0, "Amount must be greater than 0");
        require(_amount <= ngoBalances[msg.sender], "Insufficient balance");
        require(bytes(_purpose).length > 0, "Purpose cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        
        // Update balances
        ngoBalances[msg.sender] -= _amount;
        ngoProfiles[msg.sender].totalSpent += _amount;
        
        // Record spending
        spendingHistory[msg.sender].push(Spending({
            amount: _amount,
            purpose: _purpose,
            description: _description,
            timestamp: block.timestamp,
            proofHash: _proofHash
        }));
        
        // Transfer funds to NGO
        payable(msg.sender).transfer(_amount);
        
        emit FundsSpent(
            msg.sender,
            _amount,
            _purpose,
            _description,
            block.timestamp
        );
    }
    
    /**
     * @dev Get NGO balance
     * @param _ngoAddress Address of the NGO
     * @return Balance of the NGO
     */
    function getNGOBalance(address _ngoAddress) external view returns (uint256) {
        return ngoBalances[_ngoAddress];
    }
    
    /**
     * @dev Get donation history for an NGO
     * @param _ngoAddress Address of the NGO
     * @return Array of donations
     */
    function getDonationHistory(address _ngoAddress) external view returns (Donation[] memory) {
        return donationHistory[_ngoAddress];
    }
    
    /**
     * @dev Get spending history for an NGO
     * @param _ngoAddress Address of the NGO
     * @return Array of spendings
     */
    function getSpendingHistory(address _ngoAddress) external view returns (Spending[] memory) {
        return spendingHistory[_ngoAddress];
    }
    
    /**
     * @dev Get NGO profile
     * @param _ngoAddress Address of the NGO
     * @return NGO profile data
     */
    function getNGOProfile(address _ngoAddress) external view returns (NGOProfile memory) {
        return ngoProfiles[_ngoAddress];
    }
    
    /**
     * @dev Get all registered NGOs
     * @return Array of NGO addresses
     */
    function getAllNGOs() external view returns (address[] memory) {
        return registeredNGOs;
    }
    
    /**
     * @dev Get contract statistics
     * @return totalDonations, totalNGOs, contractBalance
     */
    function getContractStats() external view returns (uint256, uint256, uint256) {
        return (totalDonations, totalNGOs, address(this).balance);
    }
    
    /**
     * @dev Emergency withdrawal (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    /**
     * @dev Update contract owner
     * @param _newOwner New owner address
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }
}

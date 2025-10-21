// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title UNITE Token
 * @dev ERC20 token for Fantasy Crypto platform with staking functionality
 */
contract UniteToken is ERC20, ERC20Burnable, Ownable, ReentrancyGuard, Pausable {
    uint256 public constant TOTAL_SUPPLY = 1_000_000 * 10**18; // 1M tokens
    uint256 public constant REWARD_POOL = 1_000_000 * 10**18; // 1M tokens for rewards
    
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public stakingTimestamp;
    mapping(address => uint256) public lastRewardClaim;
    
    uint256 public totalStaked;
    uint256 public rewardPoolRemaining;
    
    // Staking tiers
    struct StakingTier {
        uint256 minStake;
        uint256 leverage; // Multiplied by 100 (e.g., 200 = 2x)
        uint256 priorityWeight; // For draft priority
    }
    
    mapping(uint256 => StakingTier) public stakingTiers;
    uint256 public tierCount;
    
    // Events
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event TierUpdated(uint256 tierId, uint256 minStake, uint256 leverage, uint256 priorityWeight);
    
    constructor() ERC20("UNITE", "UNITE") {
        _mint(msg.sender, TOTAL_SUPPLY);
        rewardPoolRemaining = REWARD_POOL;
        
        // Initialize staking tiers
        setupInitialTiers();
    }
    
    function setupInitialTiers() internal {
        stakingTiers[0] = StakingTier(10000 * 10**18, 200, 10); // 2x leverage
        stakingTiers[1] = StakingTier(20000 * 10**18, 300, 20); // 3x leverage
        stakingTiers[2] = StakingTier(30000 * 10**18, 400, 30); // 4x leverage
        stakingTiers[3] = StakingTier(40000 * 10**18, 500, 40); // 5x leverage
        stakingTiers[4] = StakingTier(50000 * 10**18, 1000, 50); // 10x leverage + boosting
        tierCount = 5;
    }
    
    /**
     * @dev Stake UNITE tokens
     * @param amount Amount of tokens to stake
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        // Update staking info
        stakedBalance[msg.sender] += amount;
        totalStaked += amount;
        
        if (stakingTimestamp[msg.sender] == 0) {
            stakingTimestamp[msg.sender] = block.timestamp;
            lastRewardClaim[msg.sender] = block.timestamp;
        }
        
        emit Staked(msg.sender, amount);
    }
    
    /**
     * @dev Unstake UNITE tokens
     * @param amount Amount of tokens to unstake
     */
    function unstake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(stakedBalance[msg.sender] >= amount, "Insufficient staked balance");
        
        // Update staking info
        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;
        
        if (stakedBalance[msg.sender] == 0) {
            stakingTimestamp[msg.sender] = 0;
            lastRewardClaim[msg.sender] = 0;
        }
        
        // Transfer tokens back to user
        _transfer(address(this), msg.sender, amount);
        
        emit Unstaked(msg.sender, amount);
    }
    
    /**
     * @dev Get user's current staking tier
     * @param user User address
     * @return tierId The tier ID (returns tierCount if no tier)
     */
    function getUserTier(address user) external view returns (uint256 tierId) {
        uint256 userStaked = stakedBalance[user];
        
        for (uint256 i = tierCount; i > 0; i--) {
            if (userStaked >= stakingTiers[i-1].minStake) {
                return i - 1;
            }
        }
        
        return tierCount; // No tier
    }
    
    /**
     * @dev Get user's leverage multiplier
     * @param user User address
     * @return leverage Leverage multiplier (100 = 1x, 200 = 2x, etc.)
     */
    function getUserLeverage(address user) external view returns (uint256 leverage) {
        uint256 userStaked = stakedBalance[user];
        
        for (uint256 i = tierCount; i > 0; i--) {
            if (userStaked >= stakingTiers[i-1].minStake) {
                return stakingTiers[i-1].leverage;
            }
        }
        
        return 100; // 1x leverage (no tier)
    }
    
    /**
     * @dev Get user's draft priority weight
     * @param user User address
     * @return weight Priority weight for draft order
     */
    function getUserPriorityWeight(address user) external view returns (uint256 weight) {
        uint256 userStaked = stakedBalance[user];
        
        for (uint256 i = tierCount; i > 0; i--) {
            if (userStaked >= stakingTiers[i-1].minStake) {
                return stakingTiers[i-1].priorityWeight;
            }
        }
        
        return 5; // Base weight
    }
    
    /**
     * @dev Check if user has boosting capability
     * @param user User address
     * @return canBoost Whether user can use boosting
     */
    function canUserBoost(address user) external view returns (bool canBoost) {
        return stakedBalance[user] >= stakingTiers[4].minStake; // Tier 5 (50k tokens)
    }
    
    /**
     * @dev Get number of available boosts for user
     * @param user User address
     * @return boosts Number of available boosts
     */
    function getUserBoosts(address user) external view returns (uint256 boosts) {
        uint256 userStaked = stakedBalance[user];
        if (userStaked >= stakingTiers[4].minStake) {
            return userStaked / (10000 * 10**18); // 1 boost per 10k tokens, max 5
        }
        return 0;
    }
    
    /**
     * @dev Distribute rewards to a user (only callable by owner/platform)
     * @param user User address
     * @param amount Reward amount
     */
    function distributeReward(address user, uint256 amount) external onlyOwner {
        require(rewardPoolRemaining >= amount, "Insufficient reward pool");
        require(user != address(0), "Invalid user address");
        
        rewardPoolRemaining -= amount;
        _mint(user, amount);
        
        emit RewardClaimed(user, amount);
    }
    
    /**
     * @dev Batch distribute rewards
     * @param users Array of user addresses
     * @param amounts Array of reward amounts
     */
    function batchDistributeRewards(address[] calldata users, uint256[] calldata amounts) external onlyOwner {
        require(users.length == amounts.length, "Arrays length mismatch");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(rewardPoolRemaining >= totalAmount, "Insufficient reward pool");
        
        rewardPoolRemaining -= totalAmount;
        
        for (uint256 i = 0; i < users.length; i++) {
            _mint(users[i], amounts[i]);
            emit RewardClaimed(users[i], amounts[i]);
        }
    }
    
    /**
     * @dev Update staking tier (only owner)
     */
    function updateTier(uint256 tierId, uint256 minStake, uint256 leverage, uint256 priorityWeight) external onlyOwner {
        require(tierId < tierCount, "Invalid tier ID");
        
        stakingTiers[tierId] = StakingTier(minStake, leverage, priorityWeight);
        
        emit TierUpdated(tierId, minStake, leverage, priorityWeight);
    }
    
    /**
     * @dev Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get total staking statistics
     */
    function getStakingStats() external view returns (
        uint256 _totalStaked,
        uint256 _totalSupply,
        uint256 _rewardPoolRemaining,
        uint256 _stakingRatio
    ) {
        _totalStaked = totalStaked;
        _totalSupply = totalSupply();
        _rewardPoolRemaining = rewardPoolRemaining;
        _stakingRatio = totalSupply() > 0 ? (totalStaked * 10000) / totalSupply() : 0;
    }
}
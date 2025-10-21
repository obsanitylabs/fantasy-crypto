// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./UniteToken.sol";

/**
 * @title Fantasy Crypto Match Contract
 * @dev Handles escrow and settlement for PvP matches and PvE leagues
 */
contract FantasyCrypto is ReentrancyGuard, Ownable, Pausable {
    UniteToken public uniteToken;
    
    // Platform fees
    uint256 public constant PLATFORM_FEE = 1000; // 10% (basis points)
    uint256 public constant INSURANCE_FEE = 500;  // 5%
    uint256 public constant ESCROW_FEE = 1000;     // 10%
    
    address public treasuryAddress;
    address public insuranceFund;
    
    // Match structure
    struct Match {
        uint256 id;
        address player1;
        address player2;
        uint256 wagerAmount;
        uint256 positionSize;
        uint256 escrowAmount;
        uint256 startTime;
        uint256 endTime;
        address winner;
        bool isSettled;
        bool isActive;
    }
    
    // League structure
    struct League {
        uint256 id;
        address[] participants;
        uint256 wagerAmount;
        uint256 positionSize;
        uint256 seasonStart;
        uint256 seasonEnd;
        uint256 totalPrizePool;
        bool isActive;
        bool isSettled;
    }
    
    mapping(uint256 => Match) public matches;
    mapping(uint256 => League) public leagues;
    mapping(address => uint256[]) public userMatches;
    mapping(address => uint256[]) public userLeagues;
    
    uint256 public nextMatchId = 1;
    uint256 public nextLeagueId = 1;
    
    // Events
    event MatchCreated(uint256 indexed matchId, address indexed player1, address indexed player2, uint256 wagerAmount);
    event MatchSettled(uint256 indexed matchId, address indexed winner, uint256 payout);
    event LeagueCreated(uint256 indexed leagueId, uint256 participantCount, uint256 wagerAmount);
    event LeagueSettled(uint256 indexed leagueId, address[] winners, uint256[] payouts);
    event EscrowDeposited(uint256 indexed matchId, address indexed user, uint256 amount);
    event EscrowWithdrawn(uint256 indexed matchId, address indexed user, uint256 amount);
    
    constructor(address _uniteToken, address _treasury, address _insurance) {
        uniteToken = UniteToken(_uniteToken);
        treasuryAddress = _treasury;
        insuranceFund = _insurance;
    }
    
    /**
     * @dev Create a new PvP match
     */
    function createMatch(
        address player1,
        address player2,
        uint256 wagerAmount,
        uint256 positionSize
    ) external payable onlyOwner returns (uint256 matchId) {
        require(player1 != address(0) && player2 != address(0), "Invalid player addresses");
        require(player1 != player2, "Players cannot be the same");
        require(wagerAmount > 0, "Wager amount must be greater than 0");
        require(msg.value >= wagerAmount * 2, "Insufficient ETH sent for escrow");
        
        matchId = nextMatchId++;
        
        matches[matchId] = Match({
            id: matchId,
            player1: player1,
            player2: player2,
            wagerAmount: wagerAmount,
            positionSize: positionSize,
            escrowAmount: wagerAmount * 2,
            startTime: block.timestamp,
            endTime: block.timestamp + 7 days, // 1 week duration
            winner: address(0),
            isSettled: false,
            isActive: true
        });
        
        userMatches[player1].push(matchId);
        userMatches[player2].push(matchId);
        
        emit MatchCreated(matchId, player1, player2, wagerAmount);
        emit EscrowDeposited(matchId, address(this), wagerAmount * 2);
    }
    
    /**
     * @dev Settle a match (only owner)
     */
    function settleMatch(uint256 matchId, address winner) external onlyOwner nonReentrant {
        Match storage match = matches[matchId];
        require(match.id != 0, "Match does not exist");
        require(!match.isSettled, "Match already settled");
        require(match.isActive, "Match is not active");
        require(winner == match.player1 || winner == match.player2, "Invalid winner");
        
        match.winner = winner;
        match.isSettled = true;
        match.isActive = false;
        
        uint256 totalPayout = match.escrowAmount;
        uint256 platformFee = (totalPayout * PLATFORM_FEE) / 10000;
        uint256 insuranceFee = (totalPayout * INSURANCE_FEE) / 10000;
        uint256 winnerPayout = totalPayout - platformFee - insuranceFee;
        
        // Transfer payouts
        payable(winner).transfer(winnerPayout);
        payable(treasuryAddress).transfer(platformFee / 2); // 5% to treasury
        payable(insuranceFund).transfer(insuranceFee);
        
        // Distribute UNITE rewards
        uniteToken.distributeReward(winner, 90 * 10**18); // 90 UNITE
        address loser = (winner == match.player1) ? match.player2 : match.player1;
        uniteToken.distributeReward(loser, 10 * 10**18); // 10 UNITE
        
        // Remaining 5% goes to UNITE stakers (handled off-chain)
        
        emit MatchSettled(matchId, winner, winnerPayout);
    }
    
    /**
     * @dev Create a new PvE league
     */
    function createLeague(
        address[] calldata participants,
        uint256 wagerAmount,
        uint256 positionSize,
        uint256 seasonDuration
    ) external payable onlyOwner returns (uint256 leagueId) {
        require(participants.length > 0, "No participants provided");
        require(participants.length <= 12, "Too many participants");
        require(wagerAmount > 0, "Wager amount must be greater than 0");
        require(msg.value >= wagerAmount * participants.length, "Insufficient ETH sent");
        
        leagueId = nextLeagueId++;
        
        leagues[leagueId] = League({
            id: leagueId,
            participants: participants,
            wagerAmount: wagerAmount,
            positionSize: positionSize,
            seasonStart: block.timestamp,
            seasonEnd: block.timestamp + seasonDuration,
            totalPrizePool: wagerAmount * participants.length,
            isActive: true,
            isSettled: false
        });
        
        for (uint256 i = 0; i < participants.length; i++) {
            userLeagues[participants[i]].push(leagueId);
        }
        
        emit LeagueCreated(leagueId, participants.length, wagerAmount);
    }
    
    /**
     * @dev Settle a league (only owner)
     */
    function settleLeague(
        uint256 leagueId,
        address[] calldata winners,
        uint256[] calldata payoutPercentages
    ) external onlyOwner nonReentrant {
        require(winners.length == payoutPercentages.length, "Array length mismatch");
        
        League storage league = leagues[leagueId];
        require(league.id != 0, "League does not exist");
        require(!league.isSettled, "League already settled");
        require(league.isActive, "League is not active");
        
        league.isSettled = true;
        league.isActive = false;
        
        uint256 totalPrizePool = league.totalPrizePool;
        uint256 platformFee = (totalPrizePool * PLATFORM_FEE) / 10000;
        uint256 insuranceFee = (totalPrizePool * INSURANCE_FEE) / 10000;
        uint256 remainingPool = totalPrizePool - platformFee - insuranceFee;
        
        uint256[] memory payouts = new uint256[](winners.length);
        
        // Calculate and distribute payouts
        for (uint256 i = 0; i < winners.length; i++) {
            uint256 payout = (remainingPool * payoutPercentages[i]) / 10000;
            payouts[i] = payout;
            payable(winners[i]).transfer(payout);
        }
        
        // Transfer fees
        payable(treasuryAddress).transfer(platformFee / 2);
        payable(insuranceFund).transfer(insuranceFee);
        
        // Distribute UNITE rewards based on position
        if (winners.length > 0) {
            uniteToken.distributeReward(winners[0], 10000 * 10**18); // 1st place: 10k UNITE
        }
        if (winners.length > 1) {
            uniteToken.distributeReward(winners[1], 3000 * 10**18); // 2nd place: 3k UNITE
        }
        if (winners.length > 2) {
            uniteToken.distributeReward(winners[2], 1000 * 10**18); // 3rd place: 1k UNITE
        }
        
        // Others get 100 UNITE each
        for (uint256 i = 3; i < winners.length; i++) {
            uniteToken.distributeReward(winners[i], 100 * 10**18);
        }
        
        emit LeagueSettled(leagueId, winners, payouts);
    }
    
    /**
     * @dev Emergency withdrawal for unclaimed funds
     */
    function emergencyWithdraw(uint256 matchId) external nonReentrant {
        Match storage match = matches[matchId];
        require(match.id != 0, "Match does not exist");
        require(msg.sender == match.player1 || msg.sender == match.player2, "Not authorized");
        require(block.timestamp > match.endTime + 30 days, "Emergency withdrawal not available yet");
        require(!match.isSettled, "Match already settled");
        
        match.isSettled = true;
        match.isActive = false;
        
        // Split the escrow equally
        uint256 halfEscrow = match.escrowAmount / 2;
        payable(match.player1).transfer(halfEscrow);
        payable(match.player2).transfer(halfEscrow);
        
        emit EscrowWithdrawn(matchId, msg.sender, halfEscrow);
    }
    
    /**
     * @dev Get match details
     */
    function getMatch(uint256 matchId) external view returns (Match memory) {
        return matches[matchId];
    }
    
    /**
     * @dev Get league details
     */
    function getLeague(uint256 leagueId) external view returns (League memory) {
        return leagues[leagueId];
    }
    
    /**
     * @dev Get user's matches
     */
    function getUserMatches(address user) external view returns (uint256[] memory) {
        return userMatches[user];
    }
    
    /**
     * @dev Get user's leagues
     */
    function getUserLeagues(address user) external view returns (uint256[] memory) {
        return userLeagues[user];
    }
    
    /**
     * @dev Update treasury address
     */
    function updateTreasuryAddress(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        treasuryAddress = newTreasury;
    }
    
    /**
     * @dev Update insurance fund address
     */
    function updateInsuranceFund(address newInsurance) external onlyOwner {
        require(newInsurance != address(0), "Invalid insurance address");
        insuranceFund = newInsurance;
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
     * @dev Withdraw contract balance (emergency only)
     */
    function emergencyWithdrawAll() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    // Fallback function to receive ETH
    receive() external payable {}
}
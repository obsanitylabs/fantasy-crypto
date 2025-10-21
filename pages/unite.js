import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';

export default function Unite() {
  const { address, isConnected } = useAccount();
  const [userStats, setUserStats] = useState({});
  const [stakeAmount, setStakeAmount] = useState('');
  const [uniteBalance, setUniteBalance] = useState(0);
  const [stakedAmount, setStakedAmount] = useState(0);
  const [unclaimedRewards, setUnclaimedRewards] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stake');

  const stakingTiers = [
    {
      amount: 10000,
      leverage: '2x',
      perks: ['2x Leverage', 'Draft Priority +0.1'],
      color: 'from-blue-400 to-blue-600'
    },
    {
      amount: 20000,
      leverage: '3x',
      perks: ['3x Leverage', 'Draft Priority +0.2'],
      color: 'from-green-400 to-green-600'
    },
    {
      amount: 30000,
      leverage: '4x',
      perks: ['4x Leverage', 'Draft Priority +0.3'],
      color: 'from-purple-400 to-purple-600'
    },
    {
      amount: 40000,
      leverage: '5x',
      perks: ['5x Leverage', 'Draft Priority +0.4'],
      color: 'from-red-400 to-red-600'
    },
    {
      amount: 50000,
      leverage: '10x',
      perks: ['10x Leverage', 'Draft Priority +0.5', 'Boosting Unlocked'],
      color: 'from-yellow-400 to-yellow-600'
    }
  ];

  // Mock data
  const mockUserStats = {
    uniteBalance: 25000,
    stakedAmount: 20000,
    unclaimedRewards: 150,
    currentTier: 1, // index in stakingTiers
    totalEarned: 450,
    stakingHistory: [
      { date: '2024-01-15', amount: 10000, action: 'stake' },
      { date: '2024-01-20', amount: 10000, action: 'stake' },
      { date: '2024-02-01', amount: 50, action: 'reward' }
    ]
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchUserStats();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  const fetchUserStats = async () => {
    setLoading(true);
    try {
      // const response = await fetch(`/api/unite/user/${address}`);
      // const data = await response.json();
      // setUserStats(data);
      
      // Use mock data
      setTimeout(() => {
        setUserStats(mockUserStats);
        setUniteBalance(mockUserStats.uniteBalance);
        setStakedAmount(mockUserStats.stakedAmount);
        setUnclaimedRewards(mockUserStats.unclaimedRewards);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setLoading(false);
    }
  };

  const handleStake = async () => {
    const amount = parseFloat(stakeAmount);
    if (amount <= 0 || amount > uniteBalance) {
      alert('Invalid stake amount');
      return;
    }

    try {
      // const response = await fetch('/api/unite/stake', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ amount, address })
      // });
      
      // Mock success
      setStakedAmount(prev => prev + amount);
      setUniteBalance(prev => prev - amount);
      setStakeAmount('');
      alert('Successfully staked UNITE tokens!');
    } catch (error) {
      console.error('Error staking:', error);
    }
  };

  const handleClaimRewards = async () => {
    if (unclaimedRewards <= 0) return;

    try {
      // const response = await fetch('/api/unite/claim', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ address })
      // });
      
      // Mock success
      setUniteBalance(prev => prev + unclaimedRewards);
      setUnclaimedRewards(0);
      alert('Successfully claimed rewards!');
    } catch (error) {
      console.error('Error claiming rewards:', error);
    }
  };

  const getCurrentTier = () => {
    for (let i = stakingTiers.length - 1; i >= 0; i--) {
      if (stakedAmount >= stakingTiers[i].amount) {
        return i;
      }
    }
    return -1;
  };

  const getNextTier = () => {
    const currentTier = getCurrentTier();
    if (currentTier < stakingTiers.length - 1) {
      return stakingTiers[currentTier + 1];
    }
    return null;
  };

  const currentTierIndex = getCurrentTier();
  const nextTier = getNextTier();

  if (!isConnected) {
    return (
      <Layout title="UNITE Token - Fantasy Crypto">
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-fantasy-light to-white">
          <div className="text-center bg-white p-12 rounded-2xl shadow-xl max-w-md mx-auto">
            <div className="text-6xl mb-6">🔐</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to access UNITE token staking
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="UNITE Token - Fantasy Crypto">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🚀 UNITE Token Staking
            </h1>
            <p className="text-xl text-gray-600">
              Stake UNITE tokens to unlock leverage, boosting, and exclusive perks
            </p>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fantasy-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your UNITE data...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* User Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                  <div className="text-3xl font-bold text-fantasy-primary">
                    {uniteBalance.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Available UNITE</div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                  <div className="text-3xl font-bold text-fantasy-secondary">
                    {stakedAmount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Staked UNITE</div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                  <div className="text-3xl font-bold text-fantasy-accent">
                    {unclaimedRewards.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Unclaimed Rewards</div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                  <div className="text-3xl font-bold text-fantasy-danger">
                    {currentTierIndex >= 0 ? stakingTiers[currentTierIndex].leverage : '1x'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Current Leverage</div>
                </div>
              </div>

              {/* Current Tier Status */}
              {currentTierIndex >= 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Current Tier</h3>
                    <span className={`px-4 py-2 rounded-full text-white font-bold bg-gradient-to-r ${stakingTiers[currentTierIndex].color}`}>
                      Tier {currentTierIndex + 1}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Active Perks:</h4>
                      <ul className="space-y-1">
                        {stakingTiers[currentTierIndex].perks.map((perk, idx) => (
                          <li key={idx} className="text-green-600 flex items-center">
                            <span className="mr-2">✅</span>{perk}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {nextTier && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Next Tier ({nextTier.amount.toLocaleString()} UNITE):
                        </h4>
                        <div className="text-sm text-gray-600 mb-2">
                          Need {(nextTier.amount - stakedAmount).toLocaleString()} more UNITE
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-fantasy-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((stakedAmount / nextTier.amount) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Staking Interface */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Stake UNITE */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Stake UNITE Tokens</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount to Stake
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fantasy-primary focus:border-transparent"
                          placeholder="Enter UNITE amount"
                          max={uniteBalance}
                        />
                        <button
                          onClick={() => setStakeAmount(uniteBalance.toString())}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                        >
                          MAX
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleStake}
                      disabled={!stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > uniteBalance}
                      className="w-full btn-fantasy-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Stake UNITE
                    </button>
                  </div>
                </div>

                {/* Claim Rewards */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Claim Rewards</h3>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-fantasy-secondary mb-2">
                      {unclaimedRewards.toLocaleString()}
                    </div>
                    <div className="text-gray-600">UNITE Tokens Available</div>
                  </div>
                  <button
                    onClick={handleClaimRewards}
                    disabled={unclaimedRewards <= 0}
                    className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-200 ${
                      unclaimedRewards > 0 
                        ? 'claim-button-golden hover:transform hover:scale-105'
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {unclaimedRewards > 0 ? 'Claim All Rewards' : 'No Rewards Available'}
                  </button>
                </div>
              </div>

              {/* Staking Tiers */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Staking Tiers & Benefits</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {stakingTiers.map((tier, index) => {
                    const isActive = stakedAmount >= tier.amount;
                    const isCurrent = currentTierIndex === index;
                    
                    return (
                      <motion.div
                        key={index}
                        className={`staking-tier-card ${
                          isCurrent ? 'staking-tier-active ring-2 ring-fantasy-primary' :
                          isActive ? 'border-green-300 bg-green-50' :
                          'staking-tier-locked'
                        }`}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="text-center mb-4">
                          <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-r ${tier.color} flex items-center justify-center text-white font-bold text-lg mb-2`}>
                            {index + 1}
                          </div>
                          <div className="text-lg font-bold">{tier.leverage} Leverage</div>
                          <div className="text-sm text-gray-600">{tier.amount.toLocaleString()} UNITE</div>
                        </div>
                        <ul className="space-y-1 text-sm">
                          {tier.perks.map((perk, perkIndex) => (
                            <li key={perkIndex} className="flex items-center">
                              <span className={`mr-2 ${isActive ? 'text-green-500' : 'text-gray-400'}`}>
                                {isActive ? '✅' : '⭕'}
                              </span>
                              <span className={isActive ? 'text-gray-900' : 'text-gray-500'}>{perk}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Swap Widget Placeholder */}
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Need More UNITE Tokens?</h3>
                <p className="text-gray-600 mb-6">
                  Swap your tokens for UNITE using our integrated exchange
                </p>
                <button className="btn-fantasy-accent">
                  Open Swap Interface (Coming Soon)
                </button>
                <p className="text-xs text-gray-500 mt-4">
                  Initially funded by Unbound Science Foundation • Community pool coming soon
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
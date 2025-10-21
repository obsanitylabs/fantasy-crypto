import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';

export default function Leaderboard() {
  const { address, isConnected } = useAccount();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [platformStats, setPlatformStats] = useState({});
  const [activeTab, setActiveTab] = useState('realized_pnl');
  const [loading, setLoading] = useState(true);

  const tabs = [
    { key: 'realized_pnl', label: 'Realized P&L', icon: '💰' },
    { key: 'match_wins', label: 'Match Wins', icon: '🏆' },
    { key: 'season_wins', label: 'Season Wins', icon: '👑' },
    { key: 'winning_amount', label: 'Total Winnings', icon: '💎' },
    { key: 'win_percentage', label: 'Win Rate', icon: '📊' },
    { key: 'total_matches', label: 'Total Matches', icon: '⚔️' }
  ];

  // Mock data for development
  const mockLeaderboard = [
    {
      id: 1,
      wallet_address: '0x1234...5678',
      username: 'CryptoKing',
      user_class: 'Poseidon',
      realized_pnl: 45000.50,
      match_wins: 142,
      season_wins: 3,
      winning_amount: 89.5,
      win_percentage: 78.2,
      total_matches: 182
    },
    {
      id: 2,
      wallet_address: '0x9876...4321',
      username: 'DiamondHands',
      user_class: 'Whale',
      realized_pnl: 32100.25,
      match_wins: 98,
      season_wins: 2,
      winning_amount: 65.2,
      win_percentage: 72.1,
      total_matches: 136
    },
    {
      id: 3,
      wallet_address: '0x5555...8888',
      username: 'MoonShot',
      user_class: 'Shark',
      realized_pnl: 18750.75,
      match_wins: 67,
      season_wins: 1,
      winning_amount: 42.1,
      win_percentage: 68.4,
      total_matches: 98
    }
  ];

  const mockPlatformStats = {
    total_volume_eth: 15420.75,
    total_fees_collected: 1542.08,
    total_matches_played: 8924,
    active_traders: 1245,
    total_escrow_deposits: 45678.90,
    insurance_fund_balance: 2345.67,
    unite_rewards_distributed: 125000
  };

  useEffect(() => {
    fetchLeaderboardData();
    fetchPlatformStats();
  }, [activeTab]);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    try {
      // const response = await fetch(`/api/leaderboard/${activeTab}`);
      // const data = await response.json();
      // setLeaderboardData(data);
      
      // Use mock data for development
      setTimeout(() => {
        const sortedData = [...mockLeaderboard].sort((a, b) => b[activeTab] - a[activeTab]);
        setLeaderboardData(sortedData);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboardData(mockLeaderboard);
      setLoading(false);
    }
  };

  const fetchPlatformStats = async () => {
    try {
      // const response = await fetch('/api/platform/stats');
      // const data = await response.json();
      // setPlatformStats(data);
      
      // Use mock data
      setPlatformStats(mockPlatformStats);
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      setPlatformStats(mockPlatformStats);
    }
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return 'leaderboard-rank-1';
    if (rank === 2) return 'leaderboard-rank-2';
    if (rank === 3) return 'leaderboard-rank-3';
    return '';
  };

  const getRankEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const formatValue = (value, type) => {
    switch (type) {
      case 'realized_pnl':
        return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      case 'winning_amount':
        return `${value} ETH`;
      case 'win_percentage':
        return `${value}%`;
      default:
        return value.toLocaleString();
    }
  };

  const getClassStyle = (userClass) => {
    const styles = {
      'Barnacle': 'bg-gray-100 text-gray-800',
      'Guppie': 'bg-blue-100 text-blue-800',
      'Shark': 'bg-green-100 text-green-800',
      'Whale': 'bg-purple-100 text-purple-800',
      'Poseidon': 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900'
    };
    return styles[userClass] || styles['Barnacle'];
  };

  return (
    <Layout title="Leaderboard - Fantasy Crypto">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🏆 Global Leaderboard
            </h1>
            <p className="text-xl text-gray-600">
              Top performers across all Fantasy Crypto competitions
            </p>
          </div>

          {/* Platform Statistics */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Platform Statistics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-fantasy-primary">
                  {platformStats.total_volume_eth?.toFixed(2) || '0'}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Volume (ETH)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-fantasy-secondary">
                  {platformStats.total_matches_played?.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-gray-600 mt-1">Matches Played</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-fantasy-accent">
                  {platformStats.active_traders?.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-gray-600 mt-1">Active Traders</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-fantasy-danger">
                  {platformStats.total_fees_collected?.toFixed(2) || '0'}
                </div>
                <div className="text-sm text-gray-600 mt-1">Fees Collected (ETH)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {platformStats.total_escrow_deposits?.toFixed(2) || '0'}
                </div>
                <div className="text-sm text-gray-600 mt-1">Escrow Deposits (ETH)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {platformStats.insurance_fund_balance?.toFixed(2) || '0'}
                </div>
                <div className="text-sm text-gray-600 mt-1">Insurance Fund (ETH)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {platformStats.unite_rewards_distributed?.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-gray-600 mt-1">UNITE Distributed</div>
              </div>
            </div>
          </div>

          {/* Leaderboard Tabs */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="flex flex-wrap justify-center">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center space-x-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? 'border-fantasy-primary text-fantasy-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fantasy-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading leaderboard...</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trader
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {tabs.find(t => t.key === activeTab)?.label}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Matches
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Win Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaderboardData.map((trader, index) => {
                      const rank = index + 1;
                      const isCurrentUser = isConnected && trader.wallet_address === address;
                      
                      return (
                        <motion.tr
                          key={trader.id}
                          className={`hover:bg-gray-50 ${
                            isCurrentUser ? 'bg-blue-50 border-l-4 border-fantasy-primary' : ''
                          } ${getRankStyle(rank)}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-2xl mr-2">{getRankEmoji(rank)}</span>
                              <span className="text-lg font-bold">{rank}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {trader.username || `${trader.wallet_address.slice(0, 6)}...${trader.wallet_address.slice(-4)}`}
                                {isCurrentUser && <span className="ml-2 text-fantasy-primary">(You)</span>}
                              </div>
                              <div className="text-sm text-gray-500">
                                {trader.wallet_address.slice(0, 6)}...{trader.wallet_address.slice(-4)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getClassStyle(trader.user_class)}`}>
                              {trader.user_class}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-lg font-bold text-gray-900">
                              {formatValue(trader[activeTab], activeTab)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {trader.total_matches.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {trader.win_percentage}%
                              </div>
                              <div className="ml-3 w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-fantasy-secondary h-2 rounded-full"
                                  style={{ width: `${trader.win_percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Share Button */}
            <div className="bg-gray-50 px-6 py-4 text-center">
              <button 
                className="btn-fantasy-primary"
                onClick={() => {
                  const currentUserRank = leaderboardData.findIndex(t => t.wallet_address === address) + 1;
                  const currentUser = leaderboardData.find(t => t.wallet_address === address);
                  const shareText = currentUser 
                    ? `I'm ranked #${currentUserRank} on Fantasy Crypto Leaderboard! ${formatValue(currentUser[activeTab], activeTab)} in ${tabs.find(t => t.key === activeTab)?.label}. Join the competition at fantasycrypto.io`
                    : 'Check out the Fantasy Crypto Leaderboard - where Fantasy Football meets DeFi trading! fantasycrypto.io';
                  
                  if (navigator.share) {
                    navigator.share({ title: 'Fantasy Crypto Leaderboard', text: shareText });
                  } else {
                    navigator.clipboard.writeText(shareText);
                    alert('Copied to clipboard!');
                  }
                }}
              >
                📤 Share Leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
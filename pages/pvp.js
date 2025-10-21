import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PvPInterface from '../components/PvPInterface';
import MatchingInterface from '../components/MatchingInterface';
import { useAccount } from 'wagmi';

export default function PvP() {
  const { address, isConnected } = useAccount();
  const [currentMatches, setCurrentMatches] = useState([]);
  const [balances, setBalances] = useState({ ETH: 0, USDT: 0, USDC: 0 });
  const [isMatching, setIsMatching] = useState(false);
  const [userClass, setUserClass] = useState('Barnacle');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchUserBalances(),
        fetchCurrentMatches(),
        fetchUserClass()
      ]);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBalances = async () => {
    try {
      const response = await fetch(`/api/trading/balances/${address}`);
      if (response.ok) {
        const data = await response.json();
        setBalances(data);
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
      // Mock data for development
      setBalances({
        ETH: '2.45',
        USDT: '5000.00',
        USDC: '3500.50'
      });
    }
  };

  const fetchCurrentMatches = async () => {
    try {
      const response = await fetch(`/api/matches/user/${address}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentMatches(data);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      // Mock data for development
      setCurrentMatches([]);
    }
  };

  const fetchUserClass = async () => {
    try {
      const response = await fetch(`/api/auth/user/${address}`);
      if (response.ok) {
        const data = await response.json();
        setUserClass(data.user_class || 'Barnacle');
      }
    } catch (error) {
      console.error('Error fetching user class:', error);
    }
  };

  if (!isConnected) {
    return (
      <Layout title="PvP Trading - Fantasy Crypto">
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-fantasy-light to-white">
          <div className="text-center bg-white p-12 rounded-2xl shadow-xl max-w-md mx-auto">
            <div className="text-6xl mb-6">🔐</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to access PvP trading competitions
            </p>
            <div className="text-sm text-gray-500">
              <p>Supported wallets:</p>
              <p>MetaMask • Phantom • WalletConnect</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout title="PvP Trading - Fantasy Crypto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fantasy-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your trading data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="PvP Trading - Fantasy Crypto">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h2 className="text-3xl font-bold leading-7 text-gray-900 sm:text-4xl sm:truncate">
                Player vs Player
              </h2>
              <p className="mt-2 text-gray-600">
                Weekly head-to-head trading competitions. Draft your lineup and compete for ETH prizes.
              </p>
            </div>
            <div className="mt-4 md:mt-0 md:ml-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Your Class:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getClassStyle(userClass)}`}>
                  {userClass}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Wallet Balances - Collapsible Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
                <div className="px-6 py-5">
                  <h3 className="text-lg leading-6 font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="text-2xl mr-2">💰</span>
                    Wallet Balances
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">Ξ</span>
                        <span className="text-sm font-medium text-gray-900">ETH</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{balances.ETH}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">₮</span>
                        <span className="text-sm font-medium text-gray-900">USDT</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{balances.USDT}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">◊</span>
                        <span className="text-sm font-medium text-gray-900">USDC</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{balances.USDC}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4 text-center italic">
                    All other coins are ineligible
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
                <div className="px-6 py-5">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Matches</span>
                      <span className="font-medium">{currentMatches.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Class</span>
                      <span className="font-medium">{userClass}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main PvP Interface */}
            <div className="lg:col-span-3">
              {currentMatches.length > 0 && !isMatching ? (
                <MatchingInterface 
                  matches={currentMatches}
                  onMatchUpdate={fetchCurrentMatches}
                  userClass={userClass}
                />
              ) : (
                <PvPInterface 
                  balances={balances}
                  userClass={userClass}
                  onMatchingStart={() => setIsMatching(true)}
                  onMatchFound={() => {
                    setIsMatching(false);
                    fetchCurrentMatches();
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function getClassStyle(userClass) {
  const styles = {
    'Barnacle': 'bg-gray-100 text-gray-800',
    'Guppie': 'bg-blue-100 text-blue-800',
    'Shark': 'bg-green-100 text-green-800',
    'Whale': 'bg-purple-100 text-purple-800',
    'Poseidon': 'bg-gold-100 text-gold-800 bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900'
  };
  return styles[userClass] || styles['Barnacle'];
}
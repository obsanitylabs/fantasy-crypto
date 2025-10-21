import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import CoinTable from '../components/CoinTable';

export default function PvE() {
  const { address, isConnected } = useAccount();
  const [userClass, setUserClass] = useState('Barnacle');
  const [availableLeagues, setAvailableLeagues] = useState([]);
  const [activeLeagues, setActiveLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [loading, setLoading] = useState(true);

  const leagueClasses = {
    'Barnacle': { wager: 0.1, position: 1000, description: 'Entry level league for new traders' },
    'Shark': { wager: 1, position: 10000, description: 'Intermediate league for experienced traders' },
    'Whale': { wager: 100, position: 100000, description: 'Advanced league for serious competitors' },
    'Poseidon': { wager: 1000, position: 1000000, description: 'Elite league for top traders only' }
  };

  // Mock data
  const mockAvailableLeagues = [
    {
      id: 1,
      league_class: 'Barnacle',
      participants: 8,
      max_participants: 12,
      season_start: '2024-04-01T00:00:00Z',
      season_end: '2024-06-30T23:59:59Z',
      draft_time: '2024-03-29T14:00:00Z',
      status: 'filling'
    },
    {
      id: 2,
      league_class: 'Shark',
      participants: 5,
      max_participants: 12,
      season_start: '2024-04-01T00:00:00Z',
      season_end: '2024-06-30T23:59:59Z',
      draft_time: '2024-03-30T14:00:00Z',
      status: 'filling'
    }
  ];

  const mockActiveLeagues = [
    {
      id: 3,
      league_class: 'Barnacle',
      participants: 12,
      season_start: '2024-01-01T00:00:00Z',
      season_end: '2024-03-31T23:59:59Z',
      status: 'active',
      user_position: 3,
      realized_pnl: 1250.50,
      open_pnl: 325.75,
      days_remaining: 45
    }
  ];

  useEffect(() => {
    if (isConnected && address) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch user class
      // const userResponse = await fetch(`/api/auth/user/${address}`);
      // const userData = await userResponse.json();
      // setUserClass(userData.user_class);

      // Fetch available leagues
      // const leaguesResponse = await fetch(`/api/leagues/available/${userData.user_class}`);
      // const leaguesData = await leaguesResponse.json();
      // setAvailableLeagues(leaguesData);

      // Fetch active leagues
      // const activeResponse = await fetch(`/api/leagues/user/${address}`);
      // const activeData = await activeResponse.json();
      // setActiveLeagues(activeData);

      // Use mock data
      setTimeout(() => {
        setUserClass('Barnacle');
        setAvailableLeagues(mockAvailableLeagues);
        setActiveLeagues(mockActiveLeagues);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  const handleJoinLeague = async (leagueId) => {
    try {
      // const response = await fetch(`/api/leagues/${leagueId}/join`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ address })
      // });

      // Mock success
      alert('Successfully joined league! Draft will be scheduled when league fills up.');
      fetchUserData();
    } catch (error) {
      console.error('Error joining league:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (!isConnected) {
    return (
      <Layout title="PvE Leagues - Fantasy Crypto">
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-fantasy-light to-white">
          <div className="text-center bg-white p-12 rounded-2xl shadow-xl max-w-md mx-auto">
            <div className="text-6xl mb-6">🔐</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to access PvE league competitions
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout title="PvE Leagues - Fantasy Crypto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fantasy-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading league data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="PvE Leagues - Fantasy Crypto">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🏆 Player vs Environment
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Join 12-player leagues for 90-day seasons. Long-term strategy meets competitive trading.
            </p>
            <div className="flex justify-center">
              <span className={`px-4 py-2 rounded-full text-lg font-bold bg-gradient-to-r from-blue-400 to-blue-600 text-white`}>
                Your Class: {userClass}
              </span>
            </div>
          </div>

          {/* Active Leagues */}
          {activeLeagues.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Active Leagues</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeLeagues.map((league) => (
                  <motion.div
                    key={league.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="bg-gradient-to-r from-fantasy-secondary to-green-600 text-white p-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">{league.league_class} League</h3>
                        <span className="text-sm opacity-75">Position #{league.user_position}</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${
                            league.realized_pnl >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {league.realized_pnl >= 0 ? '+' : ''}${league.realized_pnl.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">Realized P&L</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${
                            league.open_pnl >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {league.open_pnl >= 0 ? '+' : ''}${league.open_pnl.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">Open P&L</div>
                        </div>
                      </div>
                      <div className="text-center mb-4">
                        <div className="text-lg font-semibold text-gray-900">
                          {league.days_remaining} Days Remaining
                        </div>
                        <div className="text-sm text-gray-600">
                          Season ends {formatDate(league.season_end)}
                        </div>
                      </div>
                      <button className="w-full btn-fantasy-primary">
                        Manage Lineup
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Available Leagues */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Leagues</h2>
            {availableLeagues.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">🕰️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Available Leagues</h3>
                <p className="text-gray-600 mb-6">
                  New leagues start at the beginning of each quarter. Check back soon!
                </p>
                <div className="text-sm text-gray-500">
                  Next season starts: April 1st, 2024
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableLeagues.map((league) => {
                  const leagueConfig = leagueClasses[league.league_class];
                  const canJoin = userClass === league.league_class;
                  
                  return (
                    <motion.div
                      key={league.id}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="bg-gradient-to-r from-fantasy-primary to-blue-600 text-white p-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-bold">{league.league_class} League</h3>
                          <span className="text-sm opacity-75">
                            {league.participants}/{league.max_participants}
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="mb-4">
                          <div className="text-sm text-gray-600 mb-2">{leagueConfig.description}</div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Wager:</span> {leagueConfig.wager} ETH
                            </div>
                            <div>
                              <span className="font-medium">Position:</span> ${leagueConfig.position.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Participants</span>
                            <span>{league.participants}/{league.max_participants}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-fantasy-secondary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(league.participants / league.max_participants) * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 mb-4">
                          <div><strong>Season:</strong> {formatDate(league.season_start)} - {formatDate(league.season_end)}</div>
                          <div><strong>Draft:</strong> {formatDate(league.draft_time)}</div>
                        </div>

                        <button
                          onClick={() => handleJoinLeague(league.id)}
                          disabled={!canJoin}
                          className={`w-full py-3 px-4 rounded-lg font-bold transition-all duration-200 ${
                            canJoin 
                              ? 'btn-fantasy-primary hover:transform hover:scale-105'
                              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          {canJoin ? 'Join League' : `Requires ${league.league_class} Class`}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* League Classes Info */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">League Classes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(leagueClasses).map(([className, config]) => (
                <div
                  key={className}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                    userClass === className 
                      ? 'border-fantasy-primary bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{className}</h3>
                    {userClass === className && (
                      <span className="text-xs text-fantasy-primary font-medium">Your Class</span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wager:</span>
                      <span className="font-medium">{config.wager} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Position:</span>
                      <span className="font-medium">${config.position.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-3">{config.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center text-sm text-gray-600">
              <p>Your class is determined by your trading history, wager amounts, and position sizes.</p>
              <p>New users who bet 100+ ETH or have $100K+ positions automatically start as Shark class.</p>
            </div>
          </div>

          {/* Season Information */}
          <div className="bg-gradient-to-r from-fantasy-dark to-gray-800 text-white rounded-xl p-8 mt-8">
            <h2 className="text-2xl font-bold mb-4 text-center">How PvE Leagues Work</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-3">📅</div>
                <h3 className="text-lg font-bold mb-2">90-Day Seasons</h3>
                <p className="text-gray-300 text-sm">
                  Leagues run for full quarters, starting January 1st, April 1st, July 1st, and October 1st.
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="text-lg font-bold mb-2">Snake Draft</h3>
                <p className="text-gray-300 text-small">
                  Draft 12 coins in snake format. UNITE stakers get priority in draft order selection.
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-lg font-bold mb-2">Long-term Strategy</h3>
                <p className="text-gray-300 text-sm">
                  Manage daily lineups, add/cut coins, and use boosting to maximize your seasonal performance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
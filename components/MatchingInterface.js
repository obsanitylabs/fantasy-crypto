import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CoinTable from './CoinTable';
import DraftInterface from './DraftInterface';

export default function MatchingInterface({ matches, onMatchUpdate, userClass }) {
  const [activeView, setActiveView] = useState('matches');
  const [selectedMatch, setSelectedMatch] = useState(null);

  const handleMatchSelect = (match) => {
    setSelectedMatch(match);
    if (match.status === 'matched' && !match.hasStarted) {
      setActiveView('draft');
    } else {
      setActiveView('lineup');
    }
  };

  const formatTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))}m`;
  };

  const getStatusColor = (status) => {
    const colors = {
      'waiting': 'bg-yellow-100 text-yellow-800',
      'matched': 'bg-blue-100 text-blue-800',
      'active': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors['waiting'];
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveView('matches')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeView === 'matches'
                  ? 'border-fantasy-primary text-fantasy-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Current Matches ({matches.length})
            </button>
            <button
              onClick={() => setActiveView('create')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeView === 'create'
                  ? 'border-fantasy-primary text-fantasy-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Create New Match
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeView === 'matches' && (
            <div className="space-y-4">
              {matches.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Matches</h3>
                  <p className="text-gray-600 mb-6">Create a new match to start competing</p>
                  <button
                    onClick={() => setActiveView('create')}
                    className="btn-fantasy-primary"
                  >
                    Create New Match
                  </button>
                </div>
              ) : (
                matches.map((match) => (
                  <motion.div
                    key={match.id}
                    className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => handleMatchSelect(match)}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">
                          {match.opponent_address ? '👥' : '⏳'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            vs {match.opponent_username || `${match.opponent_address?.slice(0,6)}...${match.opponent_address?.slice(-4)}`}
                          </div>
                          <div className="text-sm text-gray-600">
                            {match.wager_amount} ETH • ${match.position_size.toLocaleString()} Position
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                          {match.status === 'matched' && !match.hasStarted ? 'Enter Draft' : match.status}
                        </span>
                        {match.status === 'active' && (
                          <div className="text-sm text-gray-600 mt-1">
                            {formatTimeRemaining(match.end_time)}
                          </div>
                        )}
                        {match.status === 'completed' && (
                          <button className="mt-2 claim-button-golden px-4 py-2 rounded-lg text-sm font-bold">
                            Claim Rewards
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {match.status === 'active' && (
                      <div className="mt-4 flex justify-between items-center bg-white rounded-lg p-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">Your P&L</div>
                          <div className={`text-xl font-bold ${
                            match.your_pnl >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {match.your_pnl >= 0 ? '+' : ''}${match.your_pnl?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">Opponent P&L</div>
                          <div className={`text-xl font-bold ${
                            match.opponent_pnl >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {match.opponent_pnl >= 0 ? '+' : ''}${match.opponent_pnl?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          )}

          {activeView === 'create' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Match</h3>
              <p className="text-gray-600 mb-6">
                Click here to set up a new PvP match with custom parameters.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-fantasy-primary"
              >
                Start New Match Setup
              </button>
            </div>
          )}

          {activeView === 'draft' && selectedMatch && (
            <DraftInterface 
              match={selectedMatch}
              onDraftComplete={() => {
                setActiveView('matches');
                onMatchUpdate();
              }}
            />
          )}

          {activeView === 'lineup' && selectedMatch && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Lineup Management</h3>
              <CoinTable 
                showActions={true}
                matchId={selectedMatch.id}
                onLineupChange={onMatchUpdate}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
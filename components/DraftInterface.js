import { useState } from 'react';
import { motion } from 'framer-motion';
import CoinTable from './CoinTable';

export default function DraftInterface({ match, onDraftComplete }) {
  const [draftedCoins, setDraftedCoins] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [isMyTurn, setIsMyTurn] = useState(true); // Mock - would be determined by draft order
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes per pick
  const maxCoins = 12;

  const handleCoinSelect = (coin, position) => {
    if (draftedCoins.length >= maxCoins) {
      alert('You have already drafted the maximum number of coins');
      return;
    }

    if (draftedCoins.find(c => c.symbol === coin.symbol)) {
      alert('You have already drafted this coin');
      return;
    }

    const draftedCoin = {
      ...coin,
      draftRound: currentRound,
      status: 'bench', // All newly drafted coins start on bench
      draftedAt: new Date().toISOString()
    };

    setDraftedCoins([...draftedCoins, draftedCoin]);
    setCurrentRound(currentRound + 1);
    setIsMyTurn(false);

    // Simulate opponent drafting
    setTimeout(() => {
      setIsMyTurn(true);
      setTimeRemaining(180);
    }, 2000 + Math.random() * 3000);
  };

  const handleCompleteDraft = async () => {
    try {
      const response = await fetch(`/api/matches/${match.id}/complete-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftedCoins })
      });

      if (response.ok) {
        onDraftComplete();
      }
    } catch (error) {
      console.error('Error completing draft:', error);
    }
  };

  const moveCoinToLineup = (coinSymbol, position) => {
    setDraftedCoins(coins => 
      coins.map(coin => 
        coin.symbol === coinSymbol 
          ? { ...coin, status: position }
          : coin
      )
    );
  };

  const cutCoin = (coinSymbol) => {
    if (window.confirm('Are you sure you want to cut this coin? This action cannot be undone and will realize any P&L.')) {
      setDraftedCoins(coins => 
        coins.map(coin => 
          coin.symbol === coinSymbol 
            ? { ...coin, status: 'cut' }
            : coin
        )
      );
    }
  };

  const getLineupCounts = () => {
    const counts = { long: 0, short: 0, bench: 0, cut: 0 };
    draftedCoins.forEach(coin => {
      counts[coin.status] = (counts[coin.status] || 0) + 1;
    });
    return counts;
  };

  const lineupCounts = getLineupCounts();
  const canStartMatch = lineupCounts.long === 6 && lineupCounts.short === 6;

  return (
    <div className="space-y-6">
      {/* Draft Status Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Draft Phase</h2>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">
              Round {currentRound} of {maxCoins}
            </div>
            <div className="text-sm text-gray-600">
              {draftedCoins.length} / {maxCoins} coins drafted
            </div>
          </div>
        </div>

        {/* Turn Indicator */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-3">
            {isMyTurn ? (
              <>
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-green-800">Your Turn</span>
                <span className="text-gray-600">- Select a coin from the table below</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-yellow-800">Opponent's Turn</span>
                <span className="text-gray-600">- Waiting for opponent to draft...</span>
              </>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Time Remaining</div>
            <div className="text-xl font-bold text-fantasy-primary">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Draft Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Draft Progress</span>
            <span>{draftedCoins.length}/{maxCoins}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-fantasy-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(draftedCoins.length / maxCoins) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Drafted Coins Management */}
      {draftedCoins.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Your Drafted Coins</h3>
            <div className="text-sm text-gray-600">
              Long: {lineupCounts.long}/6 • Short: {lineupCounts.short}/6 • Bench: {lineupCounts.bench}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {draftedCoins.map((coin) => (
              <motion.div
                key={coin.symbol}
                className={`draft-coin-card ${coin.status === 'cut' ? 'opacity-50' : ''}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-gray-900">{coin.symbol}</div>
                    <div className="text-sm text-gray-600">{coin.name}</div>
                    <div className="text-xs text-gray-500">Round {coin.draftRound}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    coin.status === 'long' ? 'bg-green-100 text-green-800' :
                    coin.status === 'short' ? 'bg-red-100 text-red-800' :
                    coin.status === 'bench' ? 'bg-gray-100 text-gray-800' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {coin.status.toUpperCase()}
                  </span>
                </div>

                {coin.status === 'bench' && (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => moveCoinToLineup(coin.symbol, 'long')}
                        disabled={lineupCounts.long >= 6}
                        className="flex-1 btn-fantasy-secondary text-xs py-1 disabled:opacity-50"
                      >
                        Long
                      </button>
                      <button
                        onClick={() => moveCoinToLineup(coin.symbol, 'short')}
                        disabled={lineupCounts.short >= 6}
                        className="flex-1 btn-fantasy-danger text-xs py-1 disabled:opacity-50"
                      >
                        Short
                      </button>
                    </div>
                    <button
                      onClick={() => cutCoin(coin.symbol)}
                      className="w-full text-xs py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    >
                      Cut
                    </button>
                  </div>
                )}

                {(coin.status === 'long' || coin.status === 'short') && (
                  <div className="space-y-2">
                    <button
                      onClick={() => moveCoinToLineup(coin.symbol, coin.status === 'long' ? 'short' : 'long')}
                      disabled={(coin.status === 'long' && lineupCounts.short >= 6) || (coin.status === 'short' && lineupCounts.long >= 6)}
                      className="w-full text-xs py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                    >
                      Switch to {coin.status === 'long' ? 'Short' : 'Long'}
                    </button>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => moveCoinToLineup(coin.symbol, 'bench')}
                        className="flex-1 text-xs py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        Bench
                      </button>
                      <button
                        onClick={() => cutCoin(coin.symbol)}
                        className="flex-1 text-xs py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        Cut
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Start Match Button */}
          {draftedCoins.length === maxCoins && (
            <div className="text-center">
              <button
                onClick={handleCompleteDraft}
                disabled={!canStartMatch}
                className={`px-8 py-3 rounded-lg font-bold text-lg ${
                  canStartMatch 
                    ? 'bg-gradient-to-r from-fantasy-secondary to-green-600 text-white hover:shadow-lg transform hover:scale-105'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                } transition-all duration-200`}
              >
                {canStartMatch ? 'Start Match!' : `Set ${6 - lineupCounts.long} Long & ${6 - lineupCounts.short} Short positions`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Available Coins for Drafting */}
      {draftedCoins.length < maxCoins && (
        <CoinTable 
          onCoinSelect={isMyTurn ? handleCoinSelect : null}
          selectedCoins={draftedCoins.map(c => c.symbol)}
          maxSelections={maxCoins}
        />
      )}
    </div>
  );
}
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function PvPInterface({ balances, userClass, onMatchingStart, onMatchFound }) {
  const [wagerAmount, setWagerAmount] = useState(0.1);
  const [positionSize, setPositionSize] = useState(1000);
  const [isSearching, setIsSearching] = useState(false);
  const [notificationMethod, setNotificationMethod] = useState(null);
  const [username, setUsername] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const wagerOptions = [0.1, 1, 100, 1000];
  const positionOptions = [1000, 10000, 100000, 1000000];

  const handleFindOpponent = async () => {
    // Validate balances
    const requiredETH = wagerAmount;
    const currentETH = parseFloat(balances.ETH) || 0;

    if (currentETH < requiredETH) {
      alert(`Insufficient ETH balance. You need ${requiredETH} ETH but only have ${currentETH} ETH`);
      return;
    }

    setIsSearching(true);
    onMatchingStart();

    try {
      const response = await fetch('/api/matches/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wagerAmount,
          positionSize,
          userClass
        })
      });

      if (response.ok) {
        // Start searching animation
        setTimeout(() => {
          if (Math.random() > 0.3) { // 70% chance of finding match quickly
            setIsSearching(false);
            onMatchFound();
          } else {
            // Show notification modal after 20 seconds
            setShowNotificationModal(true);
          }
        }, Math.random() * 15000 + 5000); // 5-20 seconds
      }
    } catch (error) {
      console.error('Error finding opponent:', error);
      setIsSearching(false);
    }
  };

  const handleNotificationSubmit = () => {
    // Store notification preferences
    console.log('Notification method:', notificationMethod, 'Username:', username);
    setShowNotificationModal(false);
    // Continue searching in background
  };

  return (
    <div className="space-y-6">
      {/* Main Interface Card */}
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
        <div className="px-8 py-6 bg-gradient-to-r from-fantasy-primary to-fantasy-secondary">
          <h3 className="text-2xl font-bold text-white">Setup Your Match</h3>
          <p className="text-blue-100 mt-1">Configure your wager and position size to find an opponent</p>
        </div>

        <div className="px-8 py-6">
          {!isSearching ? (
            <div className="space-y-8">
              {/* Wager Size Slider */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  Wager Amount (ETH)
                </label>
                <div className="grid grid-cols-4 gap-4">
                  {wagerOptions.map((option) => (
                    <motion.button
                      key={option}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        wagerAmount === option
                          ? 'border-fantasy-primary bg-fantasy-primary text-white shadow-lg'
                          : 'border-gray-200 bg-white hover:border-fantasy-primary hover:bg-blue-50'
                      }`}
                      onClick={() => setWagerAmount(option)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-xl font-bold">{option}</div>
                      <div className="text-sm opacity-75">ETH</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Position Size Slider */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  Position Size (USD)
                </label>
                <div className="grid grid-cols-4 gap-4">
                  {positionOptions.map((option) => (
                    <motion.button
                      key={option}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        positionSize === option
                          ? 'border-fantasy-secondary bg-fantasy-secondary text-white shadow-lg'
                          : 'border-gray-200 bg-white hover:border-fantasy-secondary hover:bg-green-50'
                      }`}
                      onClick={() => setPositionSize(option)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-xl font-bold">
                        ${option >= 1000000 ? `${option/1000000}M+` : `${option/1000}K`}
                      </div>
                      <div className="text-sm opacity-75">USD</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Current Class Display */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Your Current Class</h4>
                    <p className="text-gray-600 mt-1">Class affects matchmaking priority</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-lg font-bold ${getClassStyle(userClass)}`}>
                    {userClass}
                  </span>
                </div>
              </div>

              {/* Find Opponent Button */}
              <motion.button
                className="w-full bg-gradient-to-r from-fantasy-primary to-fantasy-secondary text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={handleFindOpponent}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Find Opponent
              </motion.button>
            </div>
          ) : (
            /* Searching Animation */
            <div className="text-center py-16">
              <div className="searching-animation w-full h-4 rounded-full mb-8"></div>
              <div className="text-2xl font-bold text-gray-900 mb-2">Searching for Opponent...</div>
              <p className="text-gray-600">Finding a trader with similar wager and position size</p>
              <div className="mt-8">
                <div className="text-lg font-semibold text-gray-700">Match Criteria:</div>
                <div className="text-gray-600 mt-2">
                  Wager: {wagerAmount} ETH • Position: ${positionSize.toLocaleString()} • Class: {userClass}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Taking a while to find a match</h3>
            <p className="text-gray-600 mb-6">
              Would you like to be notified when we find you an opponent?
            </p>
            
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button
                  className={`flex items-center justify-center p-4 border-2 rounded-xl transition-all ${
                    notificationMethod === 'telegram' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setNotificationMethod('telegram')}
                >
                  <span className="text-2xl mr-2">📱</span>
                  <span>Telegram</span>
                </button>
                
                <button
                  className={`flex items-center justify-center p-4 border-2 rounded-xl transition-all ${
                    notificationMethod === 'twitter' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setNotificationMethod('twitter')}
                >
                  <span className="text-2xl mr-2">🐦</span>
                  <span>Twitter/X</span>
                </button>
              </div>
              
              {notificationMethod && (
                <input
                  type="text"
                  placeholder={`@${notificationMethod === 'telegram' ? 'telegram' : 'twitter'}_username`}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fantasy-primary focus:border-transparent"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              )}
              
              <div className="flex space-x-3 mt-6">
                <button
                  className="flex-1 py-3 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  onClick={() => setShowNotificationModal(false)}
                >
                  Continue Searching
                </button>
                <button
                  className="flex-1 py-3 px-4 bg-fantasy-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={handleNotificationSubmit}
                  disabled={!notificationMethod || !username}
                >
                  Notify Me
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function getClassStyle(userClass) {
  const styles = {
    'Barnacle': 'bg-gray-200 text-gray-800',
    'Guppie': 'bg-blue-200 text-blue-800',
    'Shark': 'bg-green-200 text-green-800',
    'Whale': 'bg-purple-200 text-purple-800',
    'Poseidon': 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900'
  };
  return styles[userClass] || styles['Barnacle'];
}
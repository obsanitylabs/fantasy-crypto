import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const MOCK_COINS = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 43250.00,
    change24h: 2.34,
    volume24h: 15234567890,
    openInterest: 2345678901,
    marketCap: 847000000000,
    maxLeverage: 100
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 2650.75,
    change24h: -1.23,
    volume24h: 8765432109,
    openInterest: 1234567890,
    marketCap: 318000000000,
    maxLeverage: 50
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    price: 98.45,
    change24h: 5.67,
    volume24h: 2345678901,
    openInterest: 567890123,
    marketCap: 42000000000,
    maxLeverage: 25
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    price: 24.80,
    change24h: -3.12,
    volume24h: 1234567890,
    openInterest: 345678901,
    marketCap: 9800000000,
    maxLeverage: 20
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    price: 0.82,
    change24h: 1.89,
    volume24h: 987654321,
    openInterest: 234567890,
    marketCap: 7600000000,
    maxLeverage: 15
  }
];

export default function CoinTable({ 
  showActions = false, 
  matchId = null, 
  onCoinSelect = null,
  onLineupChange = null,
  selectedCoins = [],
  maxSelections = null
}) {
  const [coins, setCoins] = useState(MOCK_COINS);
  const [sortBy, setSortBy] = useState('marketCap');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [lineup, setLineup] = useState({});
  const [rosterPanel, setRosterPanel] = useState(false);

  const coinsPerPage = 20;

  useEffect(() => {
    fetchCoins();
  }, []);

  const fetchCoins = async () => {
    setLoading(true);
    try {
      // In production, this would fetch from Pear Protocol API
      // const response = await fetch('/api/trading/coins');
      // const data = await response.json();
      // setCoins(data);
      
      // For now, use mock data
      setTimeout(() => {
        setCoins(MOCK_COINS);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching coins:', error);
      setCoins(MOCK_COINS);
      setLoading(false);
    }
  };

  const sortedCoins = [...coins].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    if (sortBy === 'marketCap' || sortBy === 'volume24h' || sortBy === 'openInterest') {
      aVal = parseFloat(aVal) || 0;
      bVal = parseFloat(bVal) || 0;
    }
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  const paginatedCoins = sortedCoins.slice(
    (currentPage - 1) * coinsPerPage,
    currentPage * coinsPerPage
  );

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const handleCoinAction = (coin, action) => {
    if (onCoinSelect) {
      onCoinSelect(coin, action);
      return;
    }

    // Handle lineup management
    const newLineup = { ...lineup };
    newLineup[coin.symbol] = action;
    setLineup(newLineup);

    if (onLineupChange) {
      onLineupChange(newLineup);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span className="text-gray-400">↕️</span>;
    return sortDirection === 'asc' ? <span className="text-fantasy-primary">↑</span> : <span className="text-fantasy-primary">↓</span>;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fantasy-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading available coins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-fantasy-primary to-fantasy-secondary">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Available Coins</h3>
          <div className="text-white text-sm">
            Showing {paginatedCoins.length} of {coins.length} coins
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('symbol')}
              >
                <div className="flex items-center space-x-1">
                  <span>Coin/Pair</span>
                  <SortIcon field="symbol" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center space-x-1">
                  <span>Price</span>
                  <SortIcon field="price" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('change24h')}
              >
                <div className="flex items-center space-x-1">
                  <span>24hr Change</span>
                  <SortIcon field="change24h" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('volume24h')}
              >
                <div className="flex items-center space-x-1">
                  <span>Volume</span>
                  <SortIcon field="volume24h" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('openInterest')}
              >
                <div className="flex items-center space-x-1">
                  <span>Open Interest</span>
                  <SortIcon field="openInterest" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Max Leverage
              </th>
              {showActions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedCoins.map((coin, index) => (
              <motion.tr
                key={coin.symbol}
                className="coin-row hover:bg-gray-50 cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-fantasy-primary to-fantasy-secondary flex items-center justify-center text-white font-bold">
                        {coin.symbol.slice(0, 2)}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{coin.symbol}</div>
                      <div className="text-sm text-gray-500">{coin.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    ${coin.price.toFixed(2)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    coin.change24h >= 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {coin.change24h >= 0 ? '+' : ''}{coin.change24h}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatNumber(coin.volume24h)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatNumber(coin.openInterest)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {coin.maxLeverage}x
                  </span>
                </td>
                {showActions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        className="btn-fantasy-secondary text-xs py-1 px-3"
                        onClick={() => handleCoinAction(coin, 'long')}
                        disabled={selectedCoins?.includes(coin.symbol) && maxSelections && selectedCoins.length >= maxSelections}
                      >
                        Long
                      </button>
                      <button
                        className="btn-fantasy-danger text-xs py-1 px-3"
                        onClick={() => handleCoinAction(coin, 'short')}
                        disabled={selectedCoins?.includes(coin.symbol) && maxSelections && selectedCoins.length >= maxSelections}
                      >
                        Short
                      </button>
                    </div>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage * coinsPerPage >= coins.length}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">{(currentPage - 1) * coinsPerPage + 1}</span>
              {' '}to{' '}
              <span className="font-medium">
                {Math.min(currentPage * coinsPerPage, coins.length)}
              </span>
              {' '}of{' '}
              <span className="font-medium">{coins.length}</span>
              {' '}results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage * coinsPerPage >= coins.length}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Collapsible Roster Panel */}
      {Object.keys(lineup).length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            onClick={() => setRosterPanel(!rosterPanel)}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="text-sm font-medium text-gray-900">Current Roster ({Object.keys(lineup).length})</h4>
            <span className="text-gray-500">{rosterPanel ? '▴' : '▾'}</span>
          </button>
          {rosterPanel && (
            <div className="mt-4 space-y-2">
              {Object.entries(lineup).map(([symbol, position]) => (
                <div key={symbol} className="flex justify-between items-center bg-white rounded p-2">
                  <span className="text-sm font-medium">{symbol}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    position === 'long' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {position.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
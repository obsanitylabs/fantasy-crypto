// Utility hooks and functions for the Fantasy Crypto platform
import { useState, useEffect } from 'react';
import mockApi from './mockApi';

// Custom hook for API calls with mock fallback
export const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await mockApi.fetchWithFallback(url, options);
        setData(result);
      } catch (err) {
        setError(err.message);
        console.error('API Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchData();
    }
  }, [url]);

  return { data, loading, error };
};

// Format ETH amounts
export const formatETH = (amount) => {
  if (typeof amount === 'string') {
    amount = parseFloat(amount);
  }
  
  if (isNaN(amount)) return '0.00';
  
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });
};

// Format USD amounts
export const formatUSD = (amount) => {
  if (typeof amount === 'string') {
    amount = parseFloat(amount);
  }
  
  if (isNaN(amount)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format wallet addresses
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Format time remaining
export const formatTimeRemaining = (endTime) => {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end - now;
  
  if (diff <= 0) return 'Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Get user class styling
export const getClassStyle = (userClass) => {
  const styles = {
    'Barnacle': 'bg-gray-100 text-gray-800 border-gray-300',
    'Guppie': 'bg-blue-100 text-blue-800 border-blue-300',
    'Shark': 'bg-green-100 text-green-800 border-green-300',
    'Whale': 'bg-purple-100 text-purple-800 border-purple-300',
    'Poseidon': 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 border-yellow-400'
  };
  return styles[userClass] || styles['Barnacle'];
};

// Get status styling
export const getStatusStyle = (status) => {
  const styles = {
    'waiting': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'matched': 'bg-blue-100 text-blue-800 border-blue-300',
    'active': 'bg-green-100 text-green-800 border-green-300',
    'completed': 'bg-gray-100 text-gray-800 border-gray-300',
    'filling': 'bg-orange-100 text-orange-800 border-orange-300',
    'drafting': 'bg-purple-100 text-purple-800 border-purple-300'
  };
  return styles[status] || styles['waiting'];
};

// Validate Ethereum address
export const isValidAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Generate mock data for development
export const generateMockData = (type, count = 1) => {
  const mockData = {
    user: () => ({
      id: Math.floor(Math.random() * 10000),
      wallet_address: `0x${Math.random().toString(16).substr(2, 40)}`,
      username: `User${Math.floor(Math.random() * 1000)}`,
      user_class: ['Barnacle', 'Guppie', 'Shark', 'Whale', 'Poseidon'][Math.floor(Math.random() * 5)],
      total_wins: Math.floor(Math.random() * 100),
      total_eth_won: Math.random() * 50
    }),
    
    match: () => ({
      id: Math.floor(Math.random() * 10000),
      wager_amount: [0.1, 1, 100, 1000][Math.floor(Math.random() * 4)],
      position_size: [1000, 10000, 100000, 1000000][Math.floor(Math.random() * 4)],
      status: ['waiting', 'matched', 'active', 'completed'][Math.floor(Math.random() * 4)],
      your_pnl: (Math.random() - 0.5) * 1000,
      opponent_pnl: (Math.random() - 0.5) * 1000
    })
  };

  const generator = mockData[type];
  if (!generator) return null;

  return count === 1 ? generator() : Array.from({ length: count }, generator);
};

// Local storage helpers
export const storage = {
  get: (key) => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return null;
    }
  },
  
  set: (key, value) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('LocalStorage set error:', error);
    }
  },
  
  remove: (key) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('LocalStorage remove error:', error);
    }
  }
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Toast notification helper
export const toast = {
  success: (message) => {
    // You can integrate with react-hot-toast or similar library
    console.log('✅', message);
    if (typeof window !== 'undefined' && window.alert) {
      // Fallback for demo
      setTimeout(() => alert(`Success: ${message}`), 100);
    }
  },
  
  error: (message) => {
    console.error('❌', message);
    if (typeof window !== 'undefined' && window.alert) {
      setTimeout(() => alert(`Error: ${message}`), 100);
    }
  },
  
  info: (message) => {
    console.info('ℹ️', message);
  }
};

export default {
  useApi,
  formatETH,
  formatUSD,
  formatAddress,
  formatTimeRemaining,
  getClassStyle,
  getStatusStyle,
  isValidAddress,
  generateMockData,
  storage,
  debounce,
  toast
};
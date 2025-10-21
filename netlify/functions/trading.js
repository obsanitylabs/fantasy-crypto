import { getAvailableCoins } from '../../lib/supabase';

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const path = event.path.replace('/.netlify/functions/trading/', '');

    // Get wallet balances
    if (event.httpMethod === 'GET' && path.startsWith('balances/')) {
      const address = path.split('balances/')[1];
      
      // TODO: Integrate with actual blockchain to get real balances
      // For now, return mock data
      const mockBalances = {
        ETH: '2.45',
        USDT: '5000.00', 
        USDC: '3500.50'
      };
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(mockBalances)
      };
    }

    // Get available coins
    if (event.httpMethod === 'GET' && path === 'coins') {
      const { data: coins, error } = await getAvailableCoins();
      
      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          coins: coins || [],
          total: coins?.length || 0
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Route not found' })
    };

  } catch (error) {
    console.error('Trading function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
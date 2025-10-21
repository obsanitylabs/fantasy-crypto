import { getLeaderboard } from '../../lib/supabase';

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
    const path = event.path.replace('/.netlify/functions/leaderboard/', '') || 'total_eth_won';
    const { limit = '100', page = '1' } = event.queryStringParameters || {};
    
    const validSortFields = [
      'total_wins', 
      'total_eth_won', 
      'total_eth_wagered',
      'win_percentage', 
      'total_matches', 
      'season_wins',
      'realized_pnl',
      'match_wins',
      'winning_amount'
    ];
    
    const sortBy = validSortFields.includes(path) ? path : 'total_eth_won';
    
    const { data: leaderboard, error } = await getLeaderboard(sortBy, parseInt(limit));
    
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
        data: leaderboard || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: leaderboard?.length || 0
        }
      })
    };

  } catch (error) {
    console.error('Leaderboard function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
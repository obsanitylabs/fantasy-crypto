import { supabaseAdmin } from '../../lib/supabase';

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
    const path = event.path.replace('/.netlify/functions/matches/', '');

    // Create new match
    if (event.httpMethod === 'POST' && path === 'create') {
      const { address, wagerAmount, positionSize, userClass } = JSON.parse(event.body || '{}');
      
      if (!address || !wagerAmount || !positionSize) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields' })
        };
      }

      // Get user
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('wallet_address', address.toLowerCase())
        .single();

      if (!user) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'User not found' })
        };
      }

      // Try to find an existing opponent
      const { data: opponent } = await supabaseAdmin
        .from('matches')
        .select('*, player1:users!matches_player1_id_fkey(wallet_address)')
        .eq('status', 'waiting')
        .eq('wager_amount', wagerAmount)
        .eq('position_size', positionSize)
        .neq('player1_id', user.id)
        .limit(1)
        .single();

      if (opponent) {
        // Found a match, update it
        const { data: match, error } = await supabaseAdmin
          .from('matches')
          .update({
            player2_id: user.id,
            status: 'matched',
            start_time: new Date().toISOString()
          })
          .eq('id', opponent.id)
          .select('*, player1:users!matches_player1_id_fkey(*), player2:users!matches_player2_id_fkey(*)')
          .single();

        if (error) throw error;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ matched: true, match })
        };
      } else {
        // No opponent found, create waiting match
        const { data: match, error } = await supabaseAdmin
          .from('matches')
          .insert([
            {
              player1_id: user.id,
              wager_amount: wagerAmount,
              position_size: positionSize,
              status: 'waiting'
            }
          ])
          .select()
          .single();

        if (error) throw error;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ matched: false, queuePosition: match })
        };
      }
    }

    // Get user matches
    if (event.httpMethod === 'GET' && path.startsWith('user/')) {
      const walletAddress = path.split('user/')[1];
      
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();

      if (!user) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify([])
        };
      }

      const { data: matches, error } = await supabaseAdmin
        .from('matches')
        .select(`
          *,
          player1:users!matches_player1_id_fkey(wallet_address, username),
          player2:users!matches_player2_id_fkey(wallet_address, username)
        `)
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate opponent PnL and your PnL for each match
      const matchesWithPnL = matches.map(match => {
        const isPlayer1 = match.player1_id === user.id;
        return {
          ...match,
          your_pnl: isPlayer1 ? match.player1_pnl : match.player2_pnl,
          opponent_pnl: isPlayer1 ? match.player2_pnl : match.player1_pnl
        };
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(matchesWithPnL)
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Route not found' })
    };

  } catch (error) {
    console.error('Matches function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
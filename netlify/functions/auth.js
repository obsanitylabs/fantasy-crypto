import { supabaseAdmin, findUserByWallet, createUser } from '../../lib/supabase';

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { address } = event.queryStringParameters || {};
    const path = event.path.replace('/.netlify/functions/auth/', '');

    // Get user profile
    if (event.httpMethod === 'GET' && path.startsWith('user/')) {
      const walletAddress = path.split('user/')[1];
      
      if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid wallet address' })
        };
      }

      let { data: user, error } = await findUserByWallet(walletAddress);
      
      if (error && error.code === 'PGRST116') {
        // User not found, create new user
        const { data: newUser, error: createError } = await createUser(walletAddress);
        if (createError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: createError.message })
          };
        }
        user = newUser;
      } else if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ user })
      };
    }

    // Update user profile
    if (event.httpMethod === 'PUT' && path.startsWith('user/')) {
      const walletAddress = path.split('user/')[1];
      const { username, telegram_username, x_username } = JSON.parse(event.body || '{}');
      
      if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid wallet address' })
        };
      }

      // Check username uniqueness if provided
      if (username) {
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('username', username)
          .neq('wallet_address', walletAddress.toLowerCase())
          .single();
        
        if (existingUser) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Username already taken' })
          };
        }
      }

      // Update user
      const updates = {};
      if (username) updates.username = username;
      if (telegram_username) updates.telegram_username = telegram_username;
      if (x_username) updates.x_username = x_username;

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .update(updates)
        .eq('wallet_address', walletAddress.toLowerCase())
        .select()
        .single();

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
        body: JSON.stringify({ user })
      };
    }

    // Wallet signature verification
    if (event.httpMethod === 'POST' && path === 'verify') {
      const { address, signature, message } = JSON.parse(event.body || '{}');
      
      // TODO: Implement actual signature verification
      // For now, just return success
      const isValid = true;
      
      if (!isValid) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid signature' })
        };
      }
      
      let { data: user } = await findUserByWallet(address);
      if (!user) {
        const { data: newUser } = await createUser(address);
        user = newUser;
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          verified: true, 
          user
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Route not found' })
    };

  } catch (error) {
    console.error('Auth function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper functions
export const findUserByWallet = async (walletAddress) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .single();
  
  return { data, error };
};

export const createUser = async (walletAddress, userId = null) => {
  const userData = {
    wallet_address: walletAddress.toLowerCase(),
    ...(userId && { id: userId })
  };
  
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single();
  
  return { data, error };
};

export const getLeaderboard = async (sortBy = 'total_eth_won', limit = 100) => {
  const { data, error } = await supabase
    .from('leaderboard_view')
    .select('*')
    .order(sortBy, { ascending: false })
    .limit(limit);
  
  return { data, error };
};

export const getUserMatches = async (userId) => {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      player1:users!matches_player1_id_fkey(
        id,
        wallet_address,
        username
      ),
      player2:users!matches_player2_id_fkey(
        id,
        wallet_address,
        username
      )
    `)
    .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  
  return { data, error };
};

export const getAvailableCoins = async () => {
  const { data, error } = await supabase
    .from('coins')
    .select('*')
    .eq('is_available', true)
    .order('market_cap', { ascending: false });
  
  return { data, error };
};

export const getPlatformStats = async () => {
  const { data, error } = await supabase
    .from('platform_stats')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
  
  return { data, error };
};

// Real-time subscriptions
export const subscribeToMatches = (userId, callback) => {
  return supabase
    .channel('matches')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'matches',
        filter: `player1_id=eq.${userId}` 
      }, 
      callback
    )
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'matches',
        filter: `player2_id=eq.${userId}` 
      }, 
      callback
    )
    .subscribe();
};

export const subscribeToLeaderboard = (callback) => {
  return supabase
    .channel('leaderboard')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'users' 
      }, 
      callback
    )
    .subscribe();
};

// Types for TypeScript (optional)
export interface User {
  id: string;
  wallet_address: string;
  username?: string;
  user_class: string;
  total_wins: number;
  total_eth_won: number;
  unite_tokens_staked: number;
  created_at: string;
}

export interface Match {
  id: string;
  player1_id: string;
  player2_id: string;
  wager_amount: number;
  position_size: number;
  status: string;
  winner_id?: string;
  created_at: string;
}

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  change_24h: number;
  market_cap: number;
  max_leverage: number;
}
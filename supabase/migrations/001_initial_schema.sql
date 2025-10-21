-- Fantasy Crypto Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    telegram_username TEXT,
    x_username TEXT,
    user_class TEXT DEFAULT 'Barnacle',
    total_wins INTEGER DEFAULT 0,
    total_eth_won DECIMAL(18, 8) DEFAULT 0,
    total_eth_wagered DECIMAL(18, 8) DEFAULT 0,
    average_position_size DECIMAL(18, 2) DEFAULT 0,
    unite_tokens_staked DECIMAL(18, 8) DEFAULT 0,
    unite_tokens_balance DECIMAL(18, 8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view public user data" ON public.users
    FOR SELECT USING (true);

-- Matches table
CREATE TABLE public.matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    player1_id UUID REFERENCES public.users(id),
    player2_id UUID REFERENCES public.users(id),
    wager_amount DECIMAL(18, 8) NOT NULL,
    position_size DECIMAL(18, 2) NOT NULL,
    match_type TEXT DEFAULT 'pvp',
    status TEXT DEFAULT 'waiting',
    winner_id UUID REFERENCES public.users(id),
    player1_pnl DECIMAL(18, 8) DEFAULT 0,
    player2_pnl DECIMAL(18, 8) DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    escrow_contract_address TEXT,
    escrow_amount DECIMAL(18, 8),
    platform_fee DECIMAL(18, 8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own matches" ON public.matches
    FOR SELECT USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Users can view public match data" ON public.matches
    FOR SELECT USING (true);

-- Leagues table
CREATE TABLE public.leagues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    league_class TEXT NOT NULL,
    wager_amount DECIMAL(18, 8) NOT NULL,
    position_size DECIMAL(18, 2) NOT NULL,
    season_start TIMESTAMP WITH TIME ZONE NOT NULL,
    season_end TIMESTAMP WITH TIME ZONE NOT NULL,
    draft_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'filling',
    max_participants INTEGER DEFAULT 12,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view leagues" ON public.leagues FOR SELECT USING (true);

-- League participants
CREATE TABLE public.league_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    league_id UUID REFERENCES public.leagues(id),
    user_id UUID REFERENCES public.users(id),
    draft_position INTEGER,
    final_position INTEGER,
    realized_pnl DECIMAL(18, 8) DEFAULT 0,
    open_pnl DECIMAL(18, 8) DEFAULT 0,
    total_invested DECIMAL(18, 8) DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, user_id)
);

ALTER TABLE public.league_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view league participation" ON public.league_participants
    FOR SELECT USING (true);
CREATE POLICY "Users can manage their participation" ON public.league_participants
    FOR ALL USING (auth.uid() = user_id);

-- Drafted coins
CREATE TABLE public.drafted_coins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id UUID REFERENCES public.matches(id),
    league_id UUID REFERENCES public.leagues(id),
    user_id UUID REFERENCES public.users(id),
    coin_symbol TEXT NOT NULL,
    coin_name TEXT,
    status TEXT DEFAULT 'bench',
    draft_order INTEGER,
    draft_price DECIMAL(18, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.drafted_coins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their drafted coins" ON public.drafted_coins
    FOR ALL USING (auth.uid() = user_id);

-- Lineups
CREATE TABLE public.lineups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id UUID REFERENCES public.matches(id),
    league_id UUID REFERENCES public.leagues(id),
    user_id UUID REFERENCES public.users(id),
    lineup_date DATE NOT NULL,
    coin_symbol TEXT NOT NULL,
    position_type TEXT NOT NULL,
    position_size DECIMAL(18, 8),
    entry_price DECIMAL(18, 8),
    current_price DECIMAL(18, 8),
    pnl DECIMAL(18, 8) DEFAULT 0,
    leverage INTEGER DEFAULT 1,
    is_boost_position BOOLEAN DEFAULT FALSE,
    is_closed BOOLEAN DEFAULT FALSE,
    closed_price DECIMAL(18, 8),
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.lineups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their lineups" ON public.lineups
    FOR ALL USING (auth.uid() = user_id);

-- Coins table
CREATE TABLE public.coins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    symbol TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    current_price DECIMAL(18, 8),
    change_24h DECIMAL(8, 4),
    volume_24h DECIMAL(18, 2),
    open_interest DECIMAL(18, 2),
    market_cap DECIMAL(18, 2),
    max_leverage INTEGER DEFAULT 1,
    is_available BOOLEAN DEFAULT TRUE,
    data_source TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.coins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view coins" ON public.coins FOR SELECT USING (true);

-- UNITE rewards
CREATE TABLE public.unite_rewards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    reward_type TEXT NOT NULL,
    amount DECIMAL(18, 8) NOT NULL,
    match_id UUID REFERENCES public.matches(id),
    league_id UUID REFERENCES public.leagues(id),
    is_claimed BOOLEAN DEFAULT FALSE,
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    claimed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.unite_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their rewards" ON public.unite_rewards
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can claim their rewards" ON public.unite_rewards
    FOR UPDATE USING (auth.uid() = user_id);

-- Platform stats
CREATE TABLE public.platform_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    total_volume_eth DECIMAL(18, 8) DEFAULT 0,
    total_fees_collected DECIMAL(18, 8) DEFAULT 0,
    total_matches_played INTEGER DEFAULT 0,
    active_traders INTEGER DEFAULT 0,
    total_escrow_deposits DECIMAL(18, 8) DEFAULT 0,
    total_escrow_withdrawals DECIMAL(18, 8) DEFAULT 0,
    insurance_fund_balance DECIMAL(18, 8) DEFAULT 0,
    unite_rewards_distributed DECIMAL(18, 8) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.platform_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view platform stats" ON public.platform_stats FOR SELECT USING (true);

-- Insert initial data
INSERT INTO public.platform_stats (total_volume_eth) VALUES (0);

-- Insert initial coins
INSERT INTO public.coins (symbol, name, current_price, change_24h, volume_24h, open_interest, market_cap, max_leverage, data_source) VALUES
('BTC', 'Bitcoin', 43250.00, 2.34, 15234567890, 2345678901, 847000000000, 100, 'hyperliquid'),
('ETH', 'Ethereum', 2650.75, -1.23, 8765432109, 1234567890, 318000000000, 50, 'hyperliquid'),
('SOL', 'Solana', 98.45, 5.67, 2345678901, 567890123, 42000000000, 25, 'hyperliquid'),
('AVAX', 'Avalanche', 24.80, -3.12, 1234567890, 345678901, 9800000000, 20, 'hyperliquid'),
('MATIC', 'Polygon', 0.82, 1.89, 987654321, 234567890, 7600000000, 15, 'hyperliquid'),
('DOT', 'Polkadot', 5.45, 0.78, 654321098, 123456789, 6700000000, 15, 'gmx'),
('LINK', 'Chainlink', 12.34, 4.56, 543210987, 87654321, 5800000000, 20, 'gmx'),
('UNI', 'Uniswap', 6.78, -2.34, 432109876, 76543210, 4200000000, 10, 'symm'),
('AAVE', 'Aave', 89.12, 1.23, 321098765, 65432109, 1300000000, 12, 'symm'),
('COMP', 'Compound', 45.67, -0.89, 210987654, 54321098, 900000000, 8, 'symm');

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.leagues FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.drafted_coins FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.lineups FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.coins FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.platform_stats FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Leaderboard view
CREATE VIEW public.leaderboard_view AS
SELECT 
    u.id,
    u.wallet_address,
    u.username,
    u.user_class,
    u.total_wins,
    u.total_eth_won,
    u.total_eth_wagered,
    u.average_position_size,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.matches WHERE player1_id = u.id OR player2_id = u.id) > 0 
        THEN (u.total_wins::DECIMAL / (SELECT COUNT(*) FROM public.matches WHERE player1_id = u.id OR player2_id = u.id)) * 100
        ELSE 0
    END as win_percentage,
    (SELECT COUNT(*) FROM public.matches WHERE player1_id = u.id OR player2_id = u.id) as total_matches,
    (SELECT COUNT(*) FROM public.league_participants lp 
     JOIN public.leagues l ON lp.league_id = l.id 
     WHERE lp.user_id = u.id AND l.status = 'completed' AND lp.final_position = 1
    ) as season_wins
FROM public.users u
WHERE u.total_wins > 0 OR u.total_eth_wagered > 0;

-- Grant permissions for the leaderboard view
GRANT SELECT ON public.leaderboard_view TO anon;
GRANT SELECT ON public.leaderboard_view TO authenticated;

-- Create indexes
CREATE INDEX idx_users_wallet ON public.users(wallet_address);
CREATE INDEX idx_matches_players ON public.matches(player1_id, player2_id);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_leagues_status ON public.leagues(status);
CREATE INDEX idx_lineups_user_date ON public.lineups(user_id, lineup_date);
CREATE INDEX idx_coins_symbol ON public.coins(symbol);

COMMIT;
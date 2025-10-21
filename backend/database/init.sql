-- Fantasy Crypto Database Schema
-- PostgreSQL database initialization script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    username VARCHAR(50),
    telegram_username VARCHAR(50),
    x_username VARCHAR(50),
    user_class VARCHAR(20) DEFAULT 'Barnacle',
    total_wins INTEGER DEFAULT 0,
    total_eth_won DECIMAL(18, 8) DEFAULT 0,
    total_eth_wagered DECIMAL(18, 8) DEFAULT 0,
    average_position_size DECIMAL(18, 2) DEFAULT 0,
    unite_tokens_staked DECIMAL(18, 8) DEFAULT 0,
    unite_tokens_balance DECIMAL(18, 8) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Matches table for PvP
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    player1_id INTEGER REFERENCES users(id),
    player2_id INTEGER REFERENCES users(id),
    wager_amount DECIMAL(18, 8) NOT NULL,
    position_size DECIMAL(18, 2) NOT NULL,
    match_type VARCHAR(10) DEFAULT 'pvp',
    status VARCHAR(20) DEFAULT 'waiting', -- 'waiting', 'matched', 'active', 'completed'
    winner_id INTEGER REFERENCES users(id),
    player1_pnl DECIMAL(18, 8) DEFAULT 0,
    player2_pnl DECIMAL(18, 8) DEFAULT 0,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    escrow_contract_address VARCHAR(42),
    escrow_amount DECIMAL(18, 8),
    platform_fee DECIMAL(18, 8) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PvE Leagues table
CREATE TABLE leagues (
    id SERIAL PRIMARY KEY,
    league_class VARCHAR(20) NOT NULL,
    wager_amount DECIMAL(18, 8) NOT NULL,
    position_size DECIMAL(18, 2) NOT NULL,
    season_start TIMESTAMP NOT NULL,
    season_end TIMESTAMP NOT NULL,
    draft_time TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'filling', -- 'filling', 'drafting', 'active', 'completed'
    max_participants INTEGER DEFAULT 12,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- League participants
CREATE TABLE league_participants (
    id SERIAL PRIMARY KEY,
    league_id INTEGER REFERENCES leagues(id),
    user_id INTEGER REFERENCES users(id),
    draft_position INTEGER,
    final_position INTEGER,
    realized_pnl DECIMAL(18, 8) DEFAULT 0,
    open_pnl DECIMAL(18, 8) DEFAULT 0,
    total_invested DECIMAL(18, 8) DEFAULT 0,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(league_id, user_id)
);

-- Drafted coins for matches/leagues
CREATE TABLE drafted_coins (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id),
    league_id INTEGER REFERENCES leagues(id),
    user_id INTEGER REFERENCES users(id),
    coin_symbol VARCHAR(20) NOT NULL,
    coin_name VARCHAR(100),
    status VARCHAR(10) DEFAULT 'bench', -- 'bench', 'long', 'short', 'cut'
    draft_order INTEGER,
    draft_price DECIMAL(18, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily lineups and positions
CREATE TABLE lineups (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id),
    league_id INTEGER REFERENCES leagues(id),
    user_id INTEGER REFERENCES users(id),
    lineup_date DATE NOT NULL,
    coin_symbol VARCHAR(20) NOT NULL,
    position_type VARCHAR(10) NOT NULL, -- 'long' or 'short'
    position_size DECIMAL(18, 8),
    entry_price DECIMAL(18, 8),
    current_price DECIMAL(18, 8),
    pnl DECIMAL(18, 8) DEFAULT 0,
    leverage INTEGER DEFAULT 1,
    is_boost_position BOOLEAN DEFAULT FALSE,
    is_closed BOOLEAN DEFAULT FALSE,
    closed_price DECIMAL(18, 8),
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Available coins data (cached from external APIs)
CREATE TABLE coins (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    current_price DECIMAL(18, 8),
    change_24h DECIMAL(8, 4),
    volume_24h DECIMAL(18, 2),
    open_interest DECIMAL(18, 2),
    market_cap DECIMAL(18, 2),
    max_leverage INTEGER DEFAULT 1,
    is_available BOOLEAN DEFAULT TRUE,
    data_source VARCHAR(50), -- 'hyperliquid', 'gmx', 'symm'
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- UNITE token rewards tracking
CREATE TABLE unite_rewards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    reward_type VARCHAR(20) NOT NULL, -- 'pvp_win', 'pvp_lose', 'pve_1st', 'pve_2nd', 'pve_3rd', 'pve_other'
    amount DECIMAL(18, 8) NOT NULL,
    match_id INTEGER REFERENCES matches(id),
    league_id INTEGER REFERENCES leagues(id),
    is_claimed BOOLEAN DEFAULT FALSE,
    transaction_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    claimed_at TIMESTAMP
);

-- Boost tracking
CREATE TABLE boosts_used (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    match_id INTEGER REFERENCES matches(id),
    league_id INTEGER REFERENCES leagues(id),
    coin_symbol VARCHAR(20),
    leverage_amount INTEGER,
    boosts_consumed INTEGER,
    position_size DECIMAL(18, 8),
    duration_hours INTEGER DEFAULT 16,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staking records
CREATE TABLE staking_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(10) NOT NULL, -- 'stake', 'unstake', 'reward'
    amount DECIMAL(18, 8) NOT NULL,
    transaction_hash VARCHAR(66),
    block_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform statistics
CREATE TABLE platform_stats (
    id SERIAL PRIMARY KEY,
    total_volume_eth DECIMAL(18, 8) DEFAULT 0,
    total_fees_collected DECIMAL(18, 8) DEFAULT 0,
    total_matches_played INTEGER DEFAULT 0,
    active_traders INTEGER DEFAULT 0,
    total_escrow_deposits DECIMAL(18, 8) DEFAULT 0,
    total_escrow_withdrawals DECIMAL(18, 8) DEFAULT 0,
    insurance_fund_balance DECIMAL(18, 8) DEFAULT 0,
    unite_rewards_distributed DECIMAL(18, 8) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Telegram notifications
CREATE TABLE telegram_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    telegram_chat_id VARCHAR(50),
    message TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Matchmaking queue
CREATE TABLE matchmaking_queue (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    wager_amount DECIMAL(18, 8) NOT NULL,
    position_size DECIMAL(18, 2) NOT NULL,
    user_class VARCHAR(20),
    notification_method VARCHAR(20), -- 'telegram', 'twitter'
    notification_username VARCHAR(50),
    status VARCHAR(20) DEFAULT 'waiting', -- 'waiting', 'matched', 'expired'
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_class ON users(user_class);
CREATE INDEX idx_matches_players ON matches(player1_id, player2_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_created ON matches(created_at);
CREATE INDEX idx_leagues_status ON leagues(status);
CREATE INDEX idx_leagues_class ON leagues(league_class);
CREATE INDEX idx_league_participants_league ON league_participants(league_id);
CREATE INDEX idx_league_participants_user ON league_participants(user_id);
CREATE INDEX idx_lineups_user_date ON lineups(user_id, lineup_date);
CREATE INDEX idx_lineups_match ON lineups(match_id);
CREATE INDEX idx_lineups_league ON lineups(league_id);
CREATE INDEX idx_drafted_coins_user ON drafted_coins(user_id);
CREATE INDEX idx_drafted_coins_match ON drafted_coins(match_id);
CREATE INDEX idx_drafted_coins_league ON drafted_coins(league_id);
CREATE INDEX idx_unite_rewards_user ON unite_rewards(user_id);
CREATE INDEX idx_unite_rewards_claimed ON unite_rewards(is_claimed);
CREATE INDEX idx_coins_symbol ON coins(symbol);
CREATE INDEX idx_coins_available ON coins(is_available);
CREATE INDEX idx_matchmaking_status ON matchmaking_queue(status);
CREATE INDEX idx_matchmaking_created ON matchmaking_queue(created_at);

-- Insert initial data
INSERT INTO platform_stats (total_volume_eth) VALUES (0);

-- Insert some initial coins (mock data)
INSERT INTO coins (symbol, name, current_price, change_24h, volume_24h, open_interest, market_cap, max_leverage, data_source) VALUES
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

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drafted_coins_updated_at BEFORE UPDATE ON drafted_coins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lineups_updated_at BEFORE UPDATE ON lineups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coins_updated_at BEFORE UPDATE ON coins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_platform_stats_updated_at BEFORE UPDATE ON platform_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate user class based on stats
CREATE OR REPLACE FUNCTION calculate_user_class(
    p_total_wins INTEGER,
    p_total_eth_won DECIMAL(18, 8),
    p_total_eth_wagered DECIMAL(18, 8),
    p_average_position_size DECIMAL(18, 2)
)
RETURNS VARCHAR(20) AS $$
DECLARE
    class_score DECIMAL;
BEGIN
    -- Quadratic ranking calculation
    class_score := SQRT(p_total_wins * 10) + 
                   SQRT(COALESCE(p_total_eth_won, 0) * 100) + 
                   SQRT(COALESCE(p_total_eth_wagered, 0) * 50) + 
                   SQRT(COALESCE(p_average_position_size, 0) / 1000);
    
    -- Auto-promotion for large bets
    IF p_total_eth_wagered >= 100 OR p_average_position_size >= 100000 THEN
        RETURN 'Shark';
    END IF;
    
    -- Class determination
    IF class_score >= 100 THEN
        RETURN 'Poseidon';
    ELSIF class_score >= 50 THEN
        RETURN 'Whale';
    ELSIF class_score >= 20 THEN
        RETURN 'Shark';
    ELSIF class_score >= 5 THEN
        RETURN 'Guppie';
    ELSE
        RETURN 'Barnacle';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update user class
CREATE OR REPLACE FUNCTION update_user_class(p_user_id INTEGER)
RETURNS VOID AS $$
DECLARE
    user_record RECORD;
    new_class VARCHAR(20);
BEGIN
    SELECT * INTO user_record FROM users WHERE id = p_user_id;
    
    new_class := calculate_user_class(
        user_record.total_wins,
        user_record.total_eth_won,
        user_record.total_eth_wagered,
        user_record.average_position_size
    );
    
    UPDATE users 
    SET user_class = new_class 
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Views for common queries
CREATE VIEW leaderboard_view AS
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
        WHEN (SELECT COUNT(*) FROM matches WHERE player1_id = u.id OR player2_id = u.id) > 0 
        THEN (u.total_wins::DECIMAL / (SELECT COUNT(*) FROM matches WHERE player1_id = u.id OR player2_id = u.id)) * 100
        ELSE 0
    END as win_percentage,
    (SELECT COUNT(*) FROM matches WHERE player1_id = u.id OR player2_id = u.id) as total_matches,
    (SELECT COUNT(*) FROM league_participants lp 
     JOIN leagues l ON lp.league_id = l.id 
     WHERE lp.user_id = u.id AND l.status = 'completed' AND lp.final_position = 1
    ) as season_wins
FROM users u
WHERE u.total_wins > 0 OR u.total_eth_wagered > 0;

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fantasy_crypto_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fantasy_crypto_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO fantasy_crypto_user;

COMMIT;
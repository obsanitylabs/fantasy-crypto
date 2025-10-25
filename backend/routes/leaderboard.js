const express = require('express');
const { query, getLeaderboard } = require('../database/connection');
const router = express.Router();

// Get leaderboard data
router.get('/:sortBy?', async (req, res) => {
  try {
    const { sortBy = 'total_eth_won' } = req.params;
    const { limit = 100, page = 1 } = req.query;
    
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
    
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'total_eth_won';
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const leaderboard = await getLeaderboard(safeSortBy, parseInt(limit), offset);
    
    res.json({
      data: leaderboard,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: leaderboard.length
      }
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user ranking
router.get('/user/:address/ranking', async (req, res) => {
  try {
    const { address } = req.params;
    const { sortBy = 'total_eth_won' } = req.query;
    
    const validSortFields = [
      'total_wins', 'total_eth_won', 'total_eth_wagered',
      'win_percentage', 'total_matches', 'season_wins'
    ];
    
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'total_eth_won';
    
    // Get user's ranking in the specified category using parameterized query
    const result = await query(
      `WITH ranked_users AS (
         SELECT 
           *,
           ROW_NUMBER() OVER (
             ORDER BY 
               CASE WHEN $1 = 'total_wins' THEN total_wins END DESC,
               CASE WHEN $1 = 'total_eth_won' THEN total_eth_won END DESC,
               CASE WHEN $1 = 'total_eth_wagered' THEN total_eth_wagered END DESC,
               CASE WHEN $1 = 'win_percentage' THEN win_percentage END DESC,
               CASE WHEN $1 = 'total_matches' THEN total_matches END DESC,
               CASE WHEN $1 = 'season_wins' THEN season_wins END DESC,
               total_wins DESC
           ) as rank
         FROM leaderboard_view
       )
       SELECT * FROM ranked_users 
       WHERE wallet_address = $2`,
      [safeSortBy, address.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found in leaderboard' });
    }

    res.json({
      user: result.rows[0],
      category: safeSortBy
    });
  } catch (error) {
    console.error('User ranking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get top performers by category
router.get('/top/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 10 } = req.query;
    
    const queries = {
      'traders': `
        SELECT u.*, COUNT(m.id) as total_matches
        FROM users u
        LEFT JOIN matches m ON (m.player1_id = u.id OR m.player2_id = u.id)
        WHERE u.total_wins > 0
        GROUP BY u.id
        ORDER BY total_matches DESC
        LIMIT $1
      `,
      'earners': `
        SELECT * FROM leaderboard_view
        WHERE total_eth_won > 0
        ORDER BY total_eth_won DESC
        LIMIT $1
      `,
      'winners': `
        SELECT * FROM leaderboard_view
        WHERE total_wins > 0
        ORDER BY total_wins DESC
        LIMIT $1
      `,
      'consistent': `
        SELECT * FROM leaderboard_view
        WHERE total_matches >= 10
        ORDER BY win_percentage DESC, total_wins DESC
        LIMIT $1
      `
    };
    
    const queryText = queries[category];
    if (!queryText) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    const result = await query(queryText, [parseInt(limit)]);
    
    res.json({
      category,
      data: result.rows
    });
  } catch (error) {
    console.error('Top performers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const statsResult = await query(
      `SELECT 
         COUNT(*) as total_users,
         COUNT(CASE WHEN total_wins > 0 THEN 1 END) as active_traders,
         AVG(win_percentage) as avg_win_rate,
         MAX(total_eth_won) as highest_earnings,
         MAX(total_wins) as most_wins,
         COUNT(CASE WHEN user_class = 'Poseidon' THEN 1 END) as poseidon_count,
         COUNT(CASE WHEN user_class = 'Whale' THEN 1 END) as whale_count,
         COUNT(CASE WHEN user_class = 'Shark' THEN 1 END) as shark_count,
         COUNT(CASE WHEN user_class = 'Guppie' THEN 1 END) as guppie_count,
         COUNT(CASE WHEN user_class = 'Barnacle' THEN 1 END) as barnacle_count
       FROM leaderboard_view`
    );
    
    const matchStatsResult = await query(
      `SELECT 
         COUNT(*) as total_matches,
         COUNT(CASE WHEN status = 'active' THEN 1 END) as active_matches,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_matches,
         AVG(wager_amount) as avg_wager,
         SUM(wager_amount) as total_wagered
       FROM matches`
    );
    
    res.json({
      users: statsResult.rows[0],
      matches: matchStatsResult.rows[0]
    });
  } catch (error) {
    console.error('Leaderboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get historical performance data
router.get('/user/:address/history', async (req, res) => {
  try {
    const { address } = req.params;
    const { days = 30 } = req.query;
    
    // Validate days parameter
    const validDays = Math.max(1, Math.min(365, parseInt(days)));
    
    const result = await query(
      `SELECT 
         DATE(m.created_at) as date,
         COUNT(*) as matches_played,
         COUNT(CASE WHEN m.winner_id = u.id THEN 1 END) as matches_won,
         SUM(CASE WHEN m.winner_id = u.id THEN m.wager_amount ELSE 0 END) as eth_won,
         SUM(m.wager_amount) as eth_wagered
       FROM matches m
       JOIN users u ON (m.player1_id = u.id OR m.player2_id = u.id)
       WHERE u.wallet_address = $1
         AND m.created_at >= CURRENT_DATE - INTERVAL '1 day' * $2
         AND m.status = 'completed'
       GROUP BY DATE(m.created_at)
       ORDER BY date DESC`,
      [address.toLowerCase(), validDays]
    );
    
    res.json({
      history: result.rows,
      period_days: validDays
    });
  } catch (error) {
    console.error('User history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
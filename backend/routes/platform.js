const express = require('express');
const { query, getPlatformStats, updatePlatformStats } = require('../database/connection');
const router = express.Router();

// Get platform statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await getPlatformStats();
    
    // Get additional real-time stats
    const additionalStats = await query(
      `SELECT 
         COUNT(DISTINCT u.id) as active_traders,
         COUNT(m.id) as total_matches_played,
         COUNT(CASE WHEN m.status = 'active' THEN 1 END) as active_matches,
         COUNT(l.id) as total_leagues,
         COUNT(CASE WHEN l.status = 'active' THEN 1 END) as active_leagues
       FROM users u
       LEFT JOIN matches m ON (m.player1_id = u.id OR m.player2_id = u.id)
       LEFT JOIN leagues l ON EXISTS (
         SELECT 1 FROM league_participants lp WHERE lp.league_id = l.id AND lp.user_id = u.id
       )
       WHERE u.total_wins > 0 OR u.total_eth_wagered > 0`
    );
    
    res.json({
      ...stats,
      ...additionalStats.rows[0]
    });
  } catch (error) {
    console.error('Platform stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update platform statistics (internal)
router.post('/stats/update', async (req, res) => {
  try {
    const updates = req.body;
    await updatePlatformStats(updates);
    res.json({ success: true });
  } catch (error) {
    console.error('Platform stats update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get trading activity
router.get('/activity', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const activityResult = await query(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as matches_created,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as matches_completed,
         SUM(wager_amount) as total_wagered,
         COUNT(DISTINCT player1_id) + COUNT(DISTINCT player2_id) as unique_players
       FROM matches 
       WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      []
    );
    
    res.json({
      activity: activityResult.rows,
      period_days: parseInt(days)
    });
  } catch (error) {
    console.error('Platform activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
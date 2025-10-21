const express = require('express');
const { query, findUserByAddress, getPlatformStats } = require('../database/connection');
const router = express.Router();

// Get available leagues for a user class
router.get('/available/:userClass', async (req, res) => {
  try {
    const { userClass } = req.params;
    
    const validClasses = ['Barnacle', 'Shark', 'Whale', 'Poseidon'];
    if (!validClasses.includes(userClass)) {
      return res.status(400).json({ error: 'Invalid user class' });
    }

    const result = await query(
      `SELECT 
         l.*,
         COUNT(lp.user_id) as participants
       FROM leagues l
       LEFT JOIN league_participants lp ON l.id = lp.league_id
       WHERE l.league_class = $1 
         AND l.status = 'filling'
         AND l.season_start > CURRENT_TIMESTAMP
       GROUP BY l.id
       HAVING COUNT(lp.user_id) < l.max_participants
       ORDER BY l.season_start ASC`,
      [userClass]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Available leagues error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's active leagues
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    const user = await findUserByAddress(address);
    if (!user) {
      return res.json([]);
    }

    const result = await query(
      `SELECT 
         l.*,
         lp.draft_position,
         lp.final_position,
         lp.realized_pnl,
         lp.open_pnl,
         lp.joined_at,
         COUNT(lp2.user_id) as total_participants
       FROM leagues l
       JOIN league_participants lp ON l.id = lp.league_id
       LEFT JOIN league_participants lp2 ON l.id = lp2.league_id
       WHERE lp.user_id = $1
       GROUP BY l.id, lp.draft_position, lp.final_position, lp.realized_pnl, lp.open_pnl, lp.joined_at
       ORDER BY l.season_start DESC`,
      [user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('User leagues error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join a league
router.post('/:leagueId/join', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { address } = req.body;
    
    const user = await findUserByAddress(address);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get league details
    const leagueResult = await query(
      'SELECT * FROM leagues WHERE id = $1',
      [leagueId]
    );
    
    if (leagueResult.rows.length === 0) {
      return res.status(404).json({ error: 'League not found' });
    }
    
    const league = leagueResult.rows[0];
    
    // Check if user class matches league class
    if (user.user_class !== league.league_class) {
      return res.status(403).json({ error: 'User class does not match league requirements' });
    }

    // Check if league is still accepting players
    if (league.status !== 'filling') {
      return res.status(400).json({ error: 'League is not accepting new players' });
    }

    // Check current participant count
    const participantResult = await query(
      'SELECT COUNT(*) as count FROM league_participants WHERE league_id = $1',
      [leagueId]
    );
    
    if (parseInt(participantResult.rows[0].count) >= league.max_participants) {
      return res.status(400).json({ error: 'League is full' });
    }

    // Check if user is already in this league
    const existingResult = await query(
      'SELECT id FROM league_participants WHERE league_id = $1 AND user_id = $2',
      [leagueId, user.id]
    );
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'User already joined this league' });
    }

    // Add user to league
    await query(
      'INSERT INTO league_participants (league_id, user_id) VALUES ($1, $2)',
      [leagueId, user.id]
    );

    // Check if league is now full and update status
    const newCountResult = await query(
      'SELECT COUNT(*) as count FROM league_participants WHERE league_id = $1',
      [leagueId]
    );
    
    if (parseInt(newCountResult.rows[0].count) >= league.max_participants) {
      // League is full, schedule draft
      const draftTime = new Date();
      draftTime.setDate(draftTime.getDate() + 3); // 3 days from now
      draftTime.setUTCHours(14, 0, 0, 0); // 2 PM UTC
      
      await query(
        `UPDATE leagues 
         SET status = 'filled', draft_time = $1
         WHERE id = $2`,
        [draftTime, leagueId]
      );
      
      // Assign draft positions with UNITE staker priority
      await assignDraftPositions(leagueId);
    }

    res.json({ success: true, league_id: leagueId });
  } catch (error) {
    console.error('Join league error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get league details and participants
router.get('/:leagueId', async (req, res) => {
  try {
    const { leagueId } = req.params;
    
    const leagueResult = await query(
      'SELECT * FROM leagues WHERE id = $1',
      [leagueId]
    );
    
    if (leagueResult.rows.length === 0) {
      return res.status(404).json({ error: 'League not found' });
    }

    const participantsResult = await query(
      `SELECT 
         lp.*,
         u.wallet_address,
         u.username,
         u.user_class,
         u.unite_tokens_staked
       FROM league_participants lp
       JOIN users u ON lp.user_id = u.id
       WHERE lp.league_id = $1
       ORDER BY lp.draft_position ASC`,
      [leagueId]
    );

    res.json({
      league: leagueResult.rows[0],
      participants: participantsResult.rows
    });
  } catch (error) {
    console.error('League details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get league rankings
router.get('/:leagueId/rankings', async (req, res) => {
  try {
    const { leagueId } = req.params;
    
    const result = await query(
      `SELECT 
         lp.*,
         u.wallet_address,
         u.username,
         u.user_class,
         ROW_NUMBER() OVER (
           ORDER BY lp.realized_pnl DESC, lp.open_pnl DESC
         ) as current_position
       FROM league_participants lp
       JOIN users u ON lp.user_id = u.id
       WHERE lp.league_id = $1
       ORDER BY current_position ASC`,
      [leagueId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('League rankings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new league (admin function)
router.post('/create', async (req, res) => {
  try {
    const {
      league_class,
      season_start,
      season_end,
      max_participants = 12
    } = req.body;
    
    if (!league_class || !season_start || !season_end) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get league configuration based on class
    const leagueConfigs = {
      'Barnacle': { wager: 0.1, position: 1000 },
      'Shark': { wager: 1, position: 10000 },
      'Whale': { wager: 100, position: 100000 },
      'Poseidon': { wager: 1000, position: 1000000 }
    };
    
    const config = leagueConfigs[league_class];
    if (!config) {
      return res.status(400).json({ error: 'Invalid league class' });
    }

    const result = await query(
      `INSERT INTO leagues 
       (league_class, wager_amount, position_size, season_start, season_end, max_participants)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        league_class,
        config.wager,
        config.position,
        season_start,
        season_end,
        max_participants
      ]
    );

    res.json({ league: result.rows[0] });
  } catch (error) {
    console.error('Create league error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to assign draft positions with UNITE staker priority
async function assignDraftPositions(leagueId) {
  try {
    // Get all participants with their UNITE stake amounts
    const participants = await query(
      `SELECT 
         lp.user_id,
         u.unite_tokens_staked,
         RANDOM() as random_factor
       FROM league_participants lp
       JOIN users u ON lp.user_id = u.id
       WHERE lp.league_id = $1`,
      [leagueId]
    );
    
    // Calculate weighted random positions
    const weightedParticipants = participants.rows.map(p => ({
      ...p,
      weight: getStakeWeight(parseFloat(p.unite_tokens_staked || 0)) + parseFloat(p.random_factor)
    }));
    
    // Sort by weight (higher = better draft position)
    weightedParticipants.sort((a, b) => b.weight - a.weight);
    
    // Assign draft positions
    for (let i = 0; i < weightedParticipants.length; i++) {
      await query(
        'UPDATE league_participants SET draft_position = $1 WHERE user_id = $2 AND league_id = $3',
        [i + 1, weightedParticipants[i].user_id, leagueId]
      );
    }
  } catch (error) {
    console.error('Draft position assignment error:', error);
  }
}

function getStakeWeight(stakedAmount) {
  if (stakedAmount >= 50000) return 0.5;
  if (stakedAmount >= 40000) return 0.4;
  if (stakedAmount >= 30000) return 0.3;
  if (stakedAmount >= 20000) return 0.2;
  if (stakedAmount >= 10000) return 0.1;
  return 0.05;
}

module.exports = router;
const express = require('express');
const { query, findUserByAddress, createUser } = require('../database/connection');
const router = express.Router();

// Create a new PvP match request
router.post('/create', async (req, res) => {
  try {
    const { address, wagerAmount, positionSize, userClass } = req.body;
    
    if (!address || !wagerAmount || !positionSize) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let user = await findUserByAddress(address);
    if (!user) {
      user = await createUser(address);
    }

    // Add to matchmaking queue
    const result = await query(
      `INSERT INTO matchmaking_queue 
       (user_id, wager_amount, position_size, user_class, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        user.id, 
        wagerAmount, 
        positionSize, 
        userClass,
        new Date(Date.now() + 30 * 60 * 1000) // 30 minutes expiry
      ]
    );

    // Try to find a match immediately
    const matchResult = await findMatch(user.id, wagerAmount, positionSize, userClass);
    
    if (matchResult) {
      // Create the match
      const match = await createMatch(user.id, matchResult.user_id, wagerAmount, positionSize);
      
      // Remove both users from queue
      await query(
        'UPDATE matchmaking_queue SET status = \'matched\' WHERE user_id IN ($1, $2)',
        [user.id, matchResult.user_id]
      );
      
      // Notify both players via WebSocket
      const { wss, clients } = req.app.locals;
      notifyMatchFound(clients, address, match);
      notifyMatchFound(clients, matchResult.wallet_address, match);
      
      res.json({ matched: true, match });
    } else {
      res.json({ matched: false, queuePosition: result.rows[0] });
    }
  } catch (error) {
    console.error('Match creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's current matches
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    const user = await findUserByAddress(address);
    if (!user) {
      return res.json([]);
    }

    const result = await query(
      `SELECT 
         m.*,
         u1.wallet_address as player1_address,
         u1.username as player1_username,
         u2.wallet_address as player2_address,
         u2.username as player2_username,
         CASE 
           WHEN m.player1_id = $1 THEN m.player2_pnl
           ELSE m.player1_pnl
         END as opponent_pnl,
         CASE 
           WHEN m.player1_id = $1 THEN m.player1_pnl
           ELSE m.player2_pnl
         END as your_pnl
       FROM matches m
       JOIN users u1 ON m.player1_id = u1.id
       LEFT JOIN users u2 ON m.player2_id = u2.id
       WHERE m.player1_id = $1 OR m.player2_id = $1
       ORDER BY m.created_at DESC`,
      [user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get match details
router.get('/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const result = await query(
      `SELECT 
         m.*,
         u1.wallet_address as player1_address,
         u1.username as player1_username,
         u2.wallet_address as player2_address,
         u2.username as player2_username
       FROM matches m
       JOIN users u1 ON m.player1_id = u1.id
       LEFT JOIN users u2 ON m.player2_id = u2.id
       WHERE m.id = $1`,
      [matchId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete draft for a match
router.post('/:matchId/complete-draft', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { address, draftedCoins } = req.body;
    
    const user = await findUserByAddress(address);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify user is part of this match
    const matchResult = await query(
      'SELECT * FROM matches WHERE id = $1 AND (player1_id = $2 OR player2_id = $2)',
      [matchId, user.id]
    );
    
    if (matchResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized for this match' });
    }

    // Save drafted coins
    for (const coin of draftedCoins) {
      await query(
        `INSERT INTO drafted_coins 
         (match_id, user_id, coin_symbol, coin_name, status, draft_order, draft_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          matchId,
          user.id,
          coin.symbol,
          coin.name,
          coin.status,
          coin.draftRound,
          coin.price
        ]
      );
    }

    // Check if both players have completed draft
    const draftStatusResult = await query(
      `SELECT 
         COUNT(DISTINCT user_id) as players_drafted
       FROM drafted_coins 
       WHERE match_id = $1`,
      [matchId]
    );
    
    if (draftStatusResult.rows[0].players_drafted >= 2) {
      // Both players drafted, start the match
      await query(
        `UPDATE matches 
         SET status = 'active', start_time = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [matchId]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Complete draft error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update notification preferences
router.post('/notifications', async (req, res) => {
  try {
    const { address, method, username } = req.body;
    
    const user = await findUserByAddress(address);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user's notification preferences
    await query(
      `UPDATE matchmaking_queue 
       SET notification_method = $1, notification_username = $2
       WHERE user_id = $3 AND status = 'waiting'`,
      [method, username, user.id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Notification update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions
const findMatch = async (userId, wagerAmount, positionSize, userClass) => {
  // Find waiting opponents with similar parameters
  const result = await query(
    `SELECT mq.*, u.wallet_address
     FROM matchmaking_queue mq
     JOIN users u ON mq.user_id = u.id
     WHERE mq.user_id != $1 
       AND mq.status = 'waiting'
       AND mq.expires_at > CURRENT_TIMESTAMP
       AND ABS(mq.wager_amount - $2) < 0.1
       AND mq.user_class = $4
     ORDER BY 
       ABS(mq.position_size - $3) ASC,
       mq.created_at ASC
     LIMIT 1`,
    [userId, wagerAmount, positionSize, userClass]
  );
  
  return result.rows[0];
};

const createMatch = async (player1Id, player2Id, wagerAmount, positionSize) => {
  const result = await query(
    `INSERT INTO matches 
     (player1_id, player2_id, wager_amount, position_size, status, escrow_amount)
     VALUES ($1, $2, $3, $4, 'matched', $5)
     RETURNING *`,
    [player1Id, player2Id, wagerAmount, positionSize, wagerAmount * 2]
  );
  
  return result.rows[0];
};

const notifyMatchFound = (clients, address, match) => {
  const client = clients.get(address);
  if (client && client.readyState === 1) { // WebSocket.OPEN
    client.send(JSON.stringify({
      type: 'match_found',
      match
    }));
  }
};

module.exports = router;
const express = require('express');
const { findUserByAddress, createUser, query } = require('../database/connection');
const router = express.Router();

// Get or create user
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    let user = await findUserByAddress(address);
    
    if (!user) {
      user = await createUser(address);
    }

    res.json({ user });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { username, telegram_username, x_username } = req.body;
    
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    // Validate username uniqueness if provided
    if (username) {
      const existingUser = await query(
        'SELECT id FROM users WHERE username = $1 AND wallet_address != $2',
        [username, address.toLowerCase()]
      );
      
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    // Update user
    const result = await query(
      `UPDATE users 
       SET username = COALESCE($1, username),
           telegram_username = COALESCE($2, telegram_username),
           x_username = COALESCE($3, x_username)
       WHERE wallet_address = $4
       RETURNING *`,
      [username, telegram_username, x_username, address.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user statistics
router.get('/user/:address/stats', async (req, res) => {
  try {
    const { address } = req.params;
    
    const user = await findUserByAddress(address);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get detailed stats
    const statsQuery = `
      SELECT 
        u.*,
        COALESCE(m.total_matches, 0) as total_matches,
        COALESCE(m.active_matches, 0) as active_matches,
        COALESCE(l.active_leagues, 0) as active_leagues,
        COALESCE(r.pending_rewards, 0) as pending_unite_rewards
      FROM users u
      LEFT JOIN (
        SELECT 
          CASE 
            WHEN player1_id = $1 THEN player1_id
            WHEN player2_id = $1 THEN player2_id
          END as user_id,
          COUNT(*) as total_matches,
          COUNT(CASE WHEN status IN ('waiting', 'matched', 'active') THEN 1 END) as active_matches
        FROM matches 
        WHERE player1_id = $1 OR player2_id = $1
      ) m ON m.user_id = u.id
      LEFT JOIN (
        SELECT 
          user_id,
          COUNT(*) as active_leagues
        FROM league_participants lp
        JOIN leagues l ON lp.league_id = l.id
        WHERE user_id = $1 AND l.status IN ('filling', 'drafting', 'active')
      ) l ON l.user_id = u.id
      LEFT JOIN (
        SELECT 
          user_id,
          SUM(amount) as pending_rewards
        FROM unite_rewards
        WHERE user_id = $1 AND is_claimed = FALSE
      ) r ON r.user_id = u.id
      WHERE u.id = $1
    `;
    
    const result = await query(statsQuery, [user.id]);
    
    res.json({ stats: result.rows[0] });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify wallet signature (for future authentication)
router.post('/verify', async (req, res) => {
  try {
    const { address, signature, message } = req.body;
    
    // TODO: Implement signature verification using ethers.js
    // const isValid = ethers.utils.verifyMessage(message, signature) === address;
    
    // For now, just return success
    const isValid = true;
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const user = await findUserByAddress(address) || await createUser(address);
    
    res.json({ 
      verified: true, 
      user,
      // TODO: Generate JWT token for authenticated requests
      // token: jwt.sign({ userId: user.id, address }, process.env.JWT_SECRET, { expiresIn: '24h' })
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
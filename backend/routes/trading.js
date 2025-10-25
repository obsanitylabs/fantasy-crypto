const express = require('express');
const { query, findUserByAddress, getPlatformStats } = require('../database/connection');
const router = express.Router();

// Get user trading balances (mock implementation)
router.get('/balances/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    // Mock balances - in production, this would fetch from actual wallet/contract
    const balances = {
      ETH: '2.45',
      USDT: '5000.00', 
      USDC: '3500.50'
    };

    res.json(balances);
  } catch (error) {
    console.error('Trading balances error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available coins for trading
router.get('/coins', async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const result = await query(
      `SELECT * FROM coins 
       WHERE is_available = TRUE 
       ORDER BY market_cap DESC 
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );

    const totalResult = await query(
      'SELECT COUNT(*) as total FROM coins WHERE is_available = TRUE'
    );

    res.json({
      coins: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(totalResult.rows[0].total),
        pages: Math.ceil(parseInt(totalResult.rows[0].total) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get coins error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update coin prices (internal function for price feeds)
router.post('/coins/update', async (req, res) => {
  try {
    const { coins } = req.body;
    
    if (!Array.isArray(coins)) {
      return res.status(400).json({ error: 'Coins must be an array' });
    }

    // Update coins in batch
    for (const coin of coins) {
      await query(
        `UPDATE coins 
         SET current_price = $1, 
             change_24h = $2, 
             volume_24h = $3, 
             open_interest = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE symbol = $5`,
        [
          coin.current_price,
          coin.change_24h,
          coin.volume_24h,
          coin.open_interest,
          coin.symbol
        ]
      );
    }

    res.json({ success: true, updated: coins.length });
  } catch (error) {
    console.error('Update coins error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get trading positions for a match/league
router.get('/positions/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ error: 'Address parameter required' });
    }

    const user = await findUserByAddress(address);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await query(
      `SELECT 
         l.*,
         c.current_price,
         c.name as coin_name
       FROM lineups l
       JOIN coins c ON l.coin_symbol = c.symbol
       WHERE l.match_id = $1 AND l.user_id = $2
       ORDER BY l.created_at DESC`,
      [matchId, user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update lineup positions
router.post('/positions/update', async (req, res) => {
  try {
    const { address, matchId, leagueId, positions } = req.body;
    
    const user = await findUserByAddress(address);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Start transaction
    await query('BEGIN');
    
    try {
      // Clear existing positions for today
      const today = new Date().toISOString().split('T')[0];
      
      await query(
        `DELETE FROM lineups 
         WHERE user_id = $1 
           AND (match_id = $2 OR league_id = $3)
           AND lineup_date = $4`,
        [user.id, matchId, leagueId, today]
      );

      // Insert new positions
      for (const position of positions) {
        await query(
          `INSERT INTO lineups 
           (user_id, match_id, league_id, lineup_date, coin_symbol, position_type, position_size, entry_price)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            user.id,
            matchId,
            leagueId,
            today,
            position.coin_symbol,
            position.position_type,
            position.position_size,
            position.entry_price
          ]
        );
      }

      await query('COMMIT');
      res.json({ success: true });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Update positions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
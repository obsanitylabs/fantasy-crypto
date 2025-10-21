const express = require('express');
const { query } = require('../database/connection');
const axios = require('axios');
const router = express.Router();

// Get user wallet balances
router.get('/balances/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // TODO: Integrate with actual blockchain to get real balances
    // For now, return mock data
    const mockBalances = {
      ETH: '2.45',
      USDT: '5000.00', 
      USDC: '3500.50'
    };
    
    res.json(mockBalances);
  } catch (error) {
    console.error('Balance fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available coins for trading
router.get('/coins', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    const result = await query(
      `SELECT * FROM coins 
       WHERE is_available = TRUE 
       ORDER BY market_cap DESC 
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), parseInt(offset)]
    );
    
    res.json({
      coins: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Coins fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update coin prices (would be called by cron job)
router.post('/coins/update', async (req, res) => {
  try {
    // TODO: Fetch real data from Pear Protocol, CoinMarketCap, CoinGecko
    // For now, simulate price updates
    
    const coins = await query('SELECT symbol FROM coins WHERE is_available = TRUE');
    
    for (const coin of coins.rows) {
      // Mock price update (±5% random change)
      const priceChange = (Math.random() - 0.5) * 0.1; // ±5%
      
      await query(
        `UPDATE coins 
         SET current_price = current_price * (1 + $1),
             change_24h = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE symbol = $3`,
        [priceChange, priceChange * 100, coin.symbol]
      );
    }
    
    res.json({ success: true, updated: coins.rows.length });
  } catch (error) {
    console.error('Coin update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get trading positions for a match/league
router.get('/positions/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params; // type: 'match' or 'league'
    
    const whereClause = type === 'match' ? 'match_id = $1' : 'league_id = $1';
    
    const result = await query(
      `SELECT 
         l.*,
         u.wallet_address,
         u.username,
         c.name as coin_name,
         c.current_price
       FROM lineups l
       JOIN users u ON l.user_id = u.id
       LEFT JOIN coins c ON l.coin_symbol = c.symbol
       WHERE ${whereClause}
       ORDER BY l.lineup_date DESC, l.created_at ASC`,
      [parseInt(id)]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Positions fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create/update lineup position
router.post('/positions', async (req, res) => {
  try {
    const {
      address,
      matchId = null,
      leagueId = null,
      coinSymbol,
      positionType, // 'long' or 'short'
      positionSize,
      leverage = 1
    } = req.body;
    
    const user = await findUserByAddress(address);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get current coin price
    const coinResult = await query(
      'SELECT current_price FROM coins WHERE symbol = $1',
      [coinSymbol]
    );
    
    if (coinResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid coin symbol' });
    }
    
    const entryPrice = coinResult.rows[0].current_price;
    const today = new Date().toISOString().split('T')[0];
    
    // Insert or update position
    await query(
      `INSERT INTO lineups 
       (match_id, league_id, user_id, lineup_date, coin_symbol, position_type, 
        position_size, entry_price, current_price, leverage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9)
       ON CONFLICT (user_id, lineup_date, coin_symbol) 
       DO UPDATE SET 
         position_type = $6,
         position_size = $7,
         entry_price = $8,
         current_price = $8,
         leverage = $9`,
      [
        matchId, leagueId, user.id, today, coinSymbol, 
        positionType, positionSize, entryPrice, leverage
      ]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Position creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
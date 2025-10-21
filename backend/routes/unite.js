const express = require('express');
const { query, findUserByAddress } = require('../database/connection');
const router = express.Router();

// Get user UNITE token data
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    const user = await findUserByAddress(address);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get staking history
    const stakingHistory = await query(
      `SELECT * FROM staking_records 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [user.id]
    );

    // Get unclaimed rewards
    const rewardsResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as unclaimed_rewards
       FROM unite_rewards 
       WHERE user_id = $1 AND is_claimed = FALSE`,
      [user.id]
    );

    // Get current tier info
    const stakedAmount = parseFloat(user.unite_tokens_staked || 0);
    const currentTier = calculateTier(stakedAmount);
    const nextTier = getNextTier(stakedAmount);

    res.json({
      user: {
        unite_balance: user.unite_tokens_balance || 0,
        staked_amount: user.unite_tokens_staked || 0,
        unclaimed_rewards: rewardsResult.rows[0].unclaimed_rewards,
        current_tier: currentTier,
        next_tier: nextTier
      },
      staking_history: stakingHistory.rows
    });
  } catch (error) {
    console.error('UNITE user data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stake UNITE tokens
router.post('/stake', async (req, res) => {
  try {
    const { address, amount } = req.body;
    
    if (!address || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const user = await findUserByAddress(address);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has enough balance
    const currentBalance = parseFloat(user.unite_tokens_balance || 0);
    if (currentBalance < amount) {
      return res.status(400).json({ error: 'Insufficient UNITE balance' });
    }

    // Update user balances
    await query(
      `UPDATE users 
       SET unite_tokens_balance = unite_tokens_balance - $1,
           unite_tokens_staked = unite_tokens_staked + $1
       WHERE id = $2`,
      [amount, user.id]
    );

    // Record staking transaction
    await query(
      `INSERT INTO staking_records (user_id, action, amount)
       VALUES ($1, 'stake', $2)`,
      [user.id, amount]
    );

    res.json({ success: true, amount_staked: amount });
  } catch (error) {
    console.error('UNITE staking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Claim UNITE rewards
router.post('/claim', async (req, res) => {
  try {
    const { address } = req.body;
    
    const user = await findUserByAddress(address);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get unclaimed rewards
    const rewardsResult = await query(
      `SELECT id, amount FROM unite_rewards 
       WHERE user_id = $1 AND is_claimed = FALSE`,
      [user.id]
    );

    if (rewardsResult.rows.length === 0) {
      return res.status(400).json({ error: 'No rewards to claim' });
    }

    const totalRewards = rewardsResult.rows.reduce((sum, reward) => sum + parseFloat(reward.amount), 0);
    const rewardIds = rewardsResult.rows.map(r => r.id);

    // Mark rewards as claimed and update user balance
    await query('BEGIN');
    
    try {
      // Update user balance
      await query(
        `UPDATE users 
         SET unite_tokens_balance = unite_tokens_balance + $1
         WHERE id = $2`,
        [totalRewards, user.id]
      );

      // Mark rewards as claimed
      await query(
        `UPDATE unite_rewards 
         SET is_claimed = TRUE, claimed_at = CURRENT_TIMESTAMP
         WHERE id = ANY($1)`,
        [rewardIds]
      );

      // Record claim transaction
      await query(
        `INSERT INTO staking_records (user_id, action, amount)
         VALUES ($1, 'reward', $2)`,
        [user.id, totalRewards]
      );

      await query('COMMIT');
      
      res.json({ 
        success: true, 
        claimed_amount: totalRewards,
        rewards_count: rewardIds.length
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('UNITE claim error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get UNITE token statistics
router.get('/stats', async (req, res) => {
  try {
    const result = await query(
      `SELECT 
         COUNT(DISTINCT user_id) as total_stakers,
         COALESCE(SUM(unite_tokens_staked), 0) as total_staked,
         COALESCE(SUM(unite_tokens_balance), 0) as total_circulating,
         COUNT(CASE WHEN unite_tokens_staked >= 50000 THEN 1 END) as poseidon_stakers,
         COUNT(CASE WHEN unite_tokens_staked >= 40000 THEN 1 END) as tier4_stakers,
         COUNT(CASE WHEN unite_tokens_staked >= 30000 THEN 1 END) as tier3_stakers,
         COUNT(CASE WHEN unite_tokens_staked >= 20000 THEN 1 END) as tier2_stakers,
         COUNT(CASE WHEN unite_tokens_staked >= 10000 THEN 1 END) as tier1_stakers
       FROM users
       WHERE unite_tokens_staked > 0 OR unite_tokens_balance > 0`
    );

    const rewardsResult = await query(
      `SELECT 
         COALESCE(SUM(amount), 0) as total_distributed,
         COALESCE(SUM(CASE WHEN is_claimed THEN amount ELSE 0 END), 0) as total_claimed,
         COALESCE(SUM(CASE WHEN NOT is_claimed THEN amount ELSE 0 END), 0) as total_pending
       FROM unite_rewards`
    );

    res.json({
      staking: result.rows[0],
      rewards: rewardsResult.rows[0],
      total_supply: 1000000, // 1M UNITE tokens
      reward_pool_remaining: 1000000 - parseFloat(rewardsResult.rows[0].total_distributed)
    });
  } catch (error) {
    console.error('UNITE stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Award UNITE rewards (internal function, would be called by match/league completion)
router.post('/award', async (req, res) => {
  try {
    const { userId, rewardType, amount, matchId = null, leagueId = null } = req.body;
    
    if (!userId || !rewardType || !amount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Check if reward pool has tokens remaining
    const totalDistributedResult = await query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM unite_rewards'
    );
    
    const totalDistributed = parseFloat(totalDistributedResult.rows[0].total);
    if (totalDistributed + amount > 1000000) { // 1M token limit
      return res.status(400).json({ error: 'Reward pool exhausted' });
    }

    // Create reward record
    await query(
      `INSERT INTO unite_rewards (user_id, reward_type, amount, match_id, league_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, rewardType, amount, matchId, leagueId]
    );

    res.json({ success: true, reward_amount: amount });
  } catch (error) {
    console.error('UNITE award error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions
function calculateTier(stakedAmount) {
  const tiers = [
    { amount: 50000, tier: 5, leverage: '10x', label: 'Poseidon' },
    { amount: 40000, tier: 4, leverage: '5x', label: 'Tier 4' },
    { amount: 30000, tier: 3, leverage: '4x', label: 'Tier 3' },
    { amount: 20000, tier: 2, leverage: '3x', label: 'Tier 2' },
    { amount: 10000, tier: 1, leverage: '2x', label: 'Tier 1' },
  ];
  
  for (const tier of tiers) {
    if (stakedAmount >= tier.amount) {
      return tier;
    }
  }
  
  return { amount: 0, tier: 0, leverage: '1x', label: 'No Tier' };
}

function getNextTier(stakedAmount) {
  const tiers = [
    { amount: 10000, tier: 1, leverage: '2x', label: 'Tier 1' },
    { amount: 20000, tier: 2, leverage: '3x', label: 'Tier 2' },
    { amount: 30000, tier: 3, leverage: '4x', label: 'Tier 3' },
    { amount: 40000, tier: 4, leverage: '5x', label: 'Tier 4' },
    { amount: 50000, tier: 5, leverage: '10x', label: 'Poseidon' },
  ];
  
  for (const tier of tiers) {
    if (stakedAmount < tier.amount) {
      return tier;
    }
  }
  
  return null; // Already at highest tier
}

module.exports = router;
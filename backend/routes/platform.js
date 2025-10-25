const express = require('express');
const { getPlatformStats, updatePlatformStats } = require('../database/connection');
const router = express.Router();

// Get platform statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await getPlatformStats();
    res.json(stats);
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
    console.error('Update platform stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
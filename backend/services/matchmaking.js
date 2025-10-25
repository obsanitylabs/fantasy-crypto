const { query } = require('../database/connection');

class MatchmakingService {
  constructor() {
    this.searchTimeouts = new Map();
    this.notificationService = null; // Will be set when needed
  }

  // Find a suitable opponent for PvP match
  async findOpponent(userId, wagerAmount, positionSize, userClass) {
    try {
      // Look for waiting opponents with similar parameters
      const result = await query(
        `SELECT mq.*, u.wallet_address, u.username
         FROM matchmaking_queue mq
         JOIN users u ON mq.user_id = u.id
         WHERE mq.user_id != $1 
           AND mq.status = 'waiting'
           AND mq.expires_at > CURRENT_TIMESTAMP
           AND ABS(mq.wager_amount - $2) <= $2 * 0.1  -- Within 10%
           AND mq.user_class = $4
         ORDER BY 
           ABS(mq.position_size - $3) ASC,
           mq.created_at ASC
         LIMIT 1`,
        [userId, wagerAmount, positionSize, userClass]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error finding opponent:', error);
      return null;
    }
  }

  // Add user to matchmaking queue
  async addToQueue(userId, wagerAmount, positionSize, userClass, notificationPrefs = {}) {
    try {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      
      const result = await query(
        `INSERT INTO matchmaking_queue 
         (user_id, wager_amount, position_size, user_class, expires_at, notification_method, notification_username)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          userId,
          wagerAmount,
          positionSize,
          userClass,
          expiresAt,
          notificationPrefs.method || null,
          notificationPrefs.username || null
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw new Error('Failed to add to matchmaking queue');
    }
  }

  // Remove user from queue
  async removeFromQueue(userId) {
    try {
      await query(
        'DELETE FROM matchmaking_queue WHERE user_id = $1',
        [userId]
      );
    } catch (error) {
      console.error('Error removing from queue:', error);
    }
  }

  // Update queue status
  async updateQueueStatus(userId, status) {
    try {
      await query(
        'UPDATE matchmaking_queue SET status = $1 WHERE user_id = $2',
        [status, userId]
      );
    } catch (error) {
      console.error('Error updating queue status:', error);
    }
  }

  // Clean expired queue entries
  async cleanExpiredEntries() {
    try {
      const result = await query(
        `DELETE FROM matchmaking_queue 
         WHERE expires_at < CURRENT_TIMESTAMP 
           AND status = 'waiting'
         RETURNING *`
      );

      console.log(`Cleaned ${result.rows.length} expired queue entries`);
      return result.rows;
    } catch (error) {
      console.error('Error cleaning expired entries:', error);
    }
  }

  // Get queue statistics
  async getQueueStats() {
    try {
      const result = await query(
        `SELECT 
           COUNT(*) as total_waiting,
           COUNT(CASE WHEN user_class = 'Barnacle' THEN 1 END) as barnacle_waiting,
           COUNT(CASE WHEN user_class = 'Guppie' THEN 1 END) as guppie_waiting,
           COUNT(CASE WHEN user_class = 'Shark' THEN 1 END) as shark_waiting,
           COUNT(CASE WHEN user_class = 'Whale' THEN 1 END) as whale_waiting,
           COUNT(CASE WHEN user_class = 'Poseidon' THEN 1 END) as poseidon_waiting,
           AVG(wager_amount) as avg_wager,
           AVG(position_size) as avg_position
         FROM matchmaking_queue 
         WHERE status = 'waiting' AND expires_at > CURRENT_TIMESTAMP`
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return {};
    }
  }

  // Start periodic cleanup
  startCleanupTask() {
    // Clean expired entries every 5 minutes
    setInterval(() => {
      this.cleanExpiredEntries();
    }, 5 * 60 * 1000);
  }

  // Set notification service
  setNotificationService(service) {
    this.notificationService = service;
  }

  // Notify user about match found
  async notifyMatchFound(userId, matchId) {
    if (!this.notificationService) return;

    try {
      const userResult = await query(
        `SELECT mq.notification_method, mq.notification_username, u.wallet_address
         FROM matchmaking_queue mq
         JOIN users u ON mq.user_id = u.id
         WHERE mq.user_id = $1`,
        [userId]
      );

      const user = userResult.rows[0];
      if (!user || !user.notification_method) return;

      const message = `🎯 Match Found! Your PvP match (ID: ${matchId}) is ready. Join now to start drafting!`;

      if (user.notification_method === 'telegram') {
        await this.notificationService.sendTelegramMessage(user.notification_username, message);
      }
      // Add other notification methods as needed

    } catch (error) {
      console.error('Error sending match notification:', error);
    }
  }
}

module.exports = new MatchmakingService();
// Mock API service for demo mode
class MockApiService {
  constructor() {
    this.isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  }

  async fetchWithFallback(url, options = {}) {
    if (!this.isDemo) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (error) {
        console.warn(`API call failed, falling back to mock data:`, error);
        return this.getMockData(url);
      }
    }
    
    // Always return mock data in demo mode
    return this.getMockData(url);
  }

  getMockData(url) {
    // Extract endpoint from URL
    const endpoint = url.split('/api/')[1] || url;
    
    switch (true) {
      case endpoint.includes('auth/user'):
        return {
          user: {
            id: 1,
            wallet_address: '0x1234567890123456789012345678901234567890',
            username: 'DemoUser',
            user_class: 'Shark',
            total_wins: 25,
            total_eth_won: 15.5,
            unite_tokens_staked: 25000,
            unite_tokens_balance: 5000
          }
        };

      case endpoint.includes('trading/balances'):
        return {
          ETH: '2.45',
          USDT: '5000.00',
          USDC: '3500.50'
        };

      case endpoint.includes('matches/user'):
        return [
          {
            id: 1,
            player2_address: '0x9876543210987654321098765432109876543210',
            player2_username: 'CryptoTrader',
            wager_amount: 1.0,
            position_size: 10000,
            status: 'active',
            your_pnl: 250.75,
            opponent_pnl: -125.50,
            end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];

      case endpoint.includes('leaderboard'):
        return {
          data: [
            {
              id: 1,
              wallet_address: '0x1111111111111111111111111111111111111111',
              username: 'CryptoKing',
              user_class: 'Poseidon',
              total_eth_won: 89.5,
              total_wins: 142,
              win_percentage: 78.2,
              total_matches: 182
            },
            {
              id: 2,
              wallet_address: '0x2222222222222222222222222222222222222222',
              username: 'DiamondHands',
              user_class: 'Whale',
              total_eth_won: 65.2,
              total_wins: 98,
              win_percentage: 72.1,
              total_matches: 136
            }
          ]
        };

      case endpoint.includes('unite/user'):
        return {
          user: {
            unite_balance: 5000,
            staked_amount: 25000,
            unclaimed_rewards: 150,
            current_tier: { tier: 2, leverage: '3x', amount: 20000 },
            next_tier: { tier: 3, leverage: '4x', amount: 30000 }
          },
          staking_history: [
            {
              action: 'stake',
              amount: 10000,
              created_at: '2024-01-15T10:00:00Z'
            }
          ]
        };

      case endpoint.includes('leagues/available'):
        return [
          {
            id: 1,
            league_class: 'Shark',
            participants: 8,
            max_participants: 12,
            season_start: '2024-04-01T00:00:00Z',
            season_end: '2024-06-30T23:59:59Z',
            draft_time: '2024-03-29T14:00:00Z',
            status: 'filling'
          }
        ];

      case endpoint.includes('platform/stats'):
        return {
          total_volume_eth: 15420.75,
          total_matches_played: 8924,
          active_traders: 1245,
          total_fees_collected: 1542.08,
          insurance_fund_balance: 2345.67,
          unite_rewards_distributed: 125000
        };

      default:
        return { message: 'Mock API response', endpoint };
    }
  }

  // Simulate async delay for more realistic feel
  async delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new MockApiService();
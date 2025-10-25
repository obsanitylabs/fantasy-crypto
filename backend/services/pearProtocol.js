const axios = require('axios');

class PearProtocolService {
  constructor() {
    this.baseURL = process.env.PEAR_PROTOCOL_API_URL || 'https://api.pearprotocol.io';
    this.apiKey = process.env.PEAR_PROTOCOL_API_KEY;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  // Get available trading pairs from Pear Protocol
  async getAvailablePairs() {
    try {
      const response = await this.client.get('/pairs');
      return response.data;
    } catch (error) {
      console.error('Error fetching available pairs:', error);
      throw new Error('Failed to fetch trading pairs');
    }
  }

  // Execute a trade through Pear Protocol
  async executeTrade(params) {
    try {
      const {
        walletAddress,
        pair,
        direction, // 'long' or 'short'
        size,
        leverage = 1,
        stopLoss,
        takeProfit
      } = params;

      const tradeData = {
        wallet: walletAddress,
        symbol: pair,
        side: direction === 'long' ? 'buy' : 'sell',
        amount: size,
        leverage,
        ...(stopLoss && { stopLoss }),
        ...(takeProfit && { takeProfit })
      };

      const response = await this.client.post('/trade', tradeData);
      return response.data;
    } catch (error) {
      console.error('Error executing trade:', error);
      throw new Error('Trade execution failed');
    }
  }

  // Close a position
  async closePosition(positionId, walletAddress) {
    try {
      const response = await this.client.post(`/positions/${positionId}/close`, {
        wallet: walletAddress
      });
      return response.data;
    } catch (error) {
      console.error('Error closing position:', error);
      throw new Error('Failed to close position');
    }
  }

  // Get position details
  async getPosition(positionId) {
    try {
      const response = await this.client.get(`/positions/${positionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching position:', error);
      throw new Error('Failed to fetch position');
    }
  }

  // Get user's positions
  async getUserPositions(walletAddress) {
    try {
      const response = await this.client.get(`/positions?wallet=${walletAddress}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user positions:', error);
      throw new Error('Failed to fetch user positions');
    }
  }

  // Get market data for a pair
  async getMarketData(pair) {
    try {
      const response = await this.client.get(`/market/${pair}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching market data:', error);
      throw new Error('Failed to fetch market data');
    }
  }

  // Calculate PnL for a position
  calculatePnL(position, currentPrice) {
    const { entryPrice, size, direction } = position;
    const priceDiff = currentPrice - entryPrice;
    const multiplier = direction === 'long' ? 1 : -1;
    return (priceDiff * size * multiplier);
  }
}

module.exports = new PearProtocolService();
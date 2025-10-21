# Fantasy Crypto

> Fantasy Football meets Crypto Trading - A DeFi platform for competitive cryptocurrency trading

![Fantasy Crypto Logo](https://via.placeholder.com/200x200?text=🏈)

## 🌟 Overview

Fantasy Crypto is a revolutionary DeFi platform that combines the excitement of fantasy football with cryptocurrency trading. Players draft digital assets, create lineups, and compete in weekly matches or seasonal leagues for real ETH prizes.

### 🎯 Key Features

- **PvP Trading Competitions**: Head-to-head weekly matches with other traders
- **PvE League Play**: 12-player seasonal leagues running for 90 days
- **UNITE Token Staking**: Unlock leverage, boosting, and priority draft picks
- **Class-Based Matchmaking**: From Barnacle to Poseidon based on trading performance
- **Real-Time Price Integration**: Built on top of Pear Protocol for accurate market data
- **Smart Contract Escrow**: Secure, trustless prize distribution

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- MetaMask or compatible Web3 wallet
- Arbitrum network access

### Installation

```bash
# Clone the repository
git clone https://github.com/obsanitylabs/fantasy-crypto.git
cd fantasy-crypto

# Install dependencies
npm install

# Set up environment variables
cp api.conf .env
# Edit .env with your configuration

# Initialize database
psql -d your_database_name -f backend/database/init.sql

# Start development servers
npm run dev:all
```

### Environment Setup

Copy `api.conf` to `.env` and configure:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/fantasy_crypto
JWT_SECRET=your-super-secret-jwt-key
NEXT_PUBLIC_REOWN_PROJECT_ID=your-reown-project-id
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
```

## 🏗️ Architecture

### Frontend (Next.js + React)
- **Framework**: Next.js 14 with React 18
- **Styling**: Tailwind CSS with custom components
- **Wallet Integration**: Reown AppKit (formerly WalletConnect)
- **State Management**: React hooks + TanStack Query
- **Animations**: Framer Motion

### Backend (Node.js + Express)
- **API Server**: Express.js with RESTful endpoints
- **Database**: PostgreSQL with connection pooling
- **Real-time**: WebSocket connections for live updates
- **Authentication**: JWT tokens with wallet signature verification

### Smart Contracts (Solidity)
- **UNITE Token**: ERC-20 token with staking functionality
- **Fantasy Crypto**: Main contract for matches and escrow
- **Network**: Deployed on Arbitrum for low fees

### External Integrations
- **Pear Protocol**: Trading data and order routing
- **Telegram Bot**: Match notifications
- **CoinMarketCap/CoinGecko**: Additional market data

## 🎮 How to Play

### PvP Matches

1. **Connect Wallet**: Support for MetaMask, Phantom, and WalletConnect
2. **Set Parameters**: Choose wager amount (0.1-1000 ETH) and position size ($1K-$1M+)
3. **Find Opponent**: Automated matchmaking based on class and preferences
4. **Draft Phase**: Each player drafts 12 coins in snake format
5. **Daily Management**: Set 6 long and 6 short positions daily
6. **Settlement**: Winner takes ~80% of pot, platform keeps 10%, remaining goes to insurance

### PvE Leagues

1. **Join League**: 12-player leagues by class (Barnacle, Shark, Whale, Poseidon)
2. **Live Draft**: Snake draft with UNITE staker priority
3. **Season Play**: 90-day competitions with daily lineup management
4. **Boosting**: UNITE stakers can use leverage for 16-hour periods
5. **Final Rankings**: Top 3 win ETH prizes, all participants earn UNITE tokens

### User Classes

- **🪨 Barnacle**: New traders (0.1 ETH wagers, $1K positions)
- **🐠 Guppie**: Learning traders
- **🦈 Shark**: Experienced traders (1 ETH wagers, $10K positions)
- **🐋 Whale**: Serious competitors (100 ETH wagers, $100K positions)
- **🔱 Poseidon**: Elite traders (1000 ETH wagers, $1M positions)

## 💎 UNITE Token Economics

### Staking Tiers

| Tier | UNITE Required | Leverage | Draft Priority | Boosting |
|------|----------------|----------|----------------|---------|
| 1 | 10,000 | 2x | +0.1 | ❌ |
| 2 | 20,000 | 3x | +0.2 | ❌ |
| 3 | 30,000 | 4x | +0.3 | ❌ |
| 4 | 40,000 | 5x | +0.4 | ❌ |
| 5 | 50,000+ | 10x | +0.5 | ✅ |

### Token Distribution

- **Total Supply**: 1,000,000 UNITE
- **Reward Pool**: 1,000,000 UNITE for competition prizes
- **PvP Rewards**: 90 UNITE (winner) / 10 UNITE (loser)
- **PvE Rewards**: 10K/3K/1K UNITE for top 3, 100 UNITE for others

## 🛠️ Development

### Project Structure

```
fantasy-crypto/
├── pages/              # Next.js pages
├── components/         # React components
├── styles/            # Global CSS and Tailwind
├── backend/           # Express.js API server
│   ├── routes/        # API route handlers
│   ├── database/      # DB schema and connection
│   ├── services/      # Business logic
│   └── utils/         # Helper functions
├── contracts/         # Solidity smart contracts
└── public/           # Static assets
```

### API Endpoints

- `GET /api/auth/user/:address` - Get/create user profile
- `POST /api/matches/create` - Create PvP match
- `GET /api/matches/user/:address` - Get user's matches
- `GET /api/leaderboard/:sortBy` - Get leaderboard data
- `POST /api/unite/stake` - Stake UNITE tokens
- `GET /api/leagues/available/:class` - Get available leagues
- `GET /api/platform/stats` - Platform statistics

### Database Schema

Key tables:
- `users` - User profiles and stats
- `matches` - PvP match data
- `leagues` - PvE league information
- `drafted_coins` - Player coin selections
- `lineups` - Daily position management
- `unite_rewards` - Token reward tracking

### Smart Contract Addresses

*Contracts will be deployed to Arbitrum mainnet*

- UNITE Token: `TBD`
- Fantasy Crypto: `TBD`

## 🔒 Security

- **Smart Contract Audits**: Professional audit required before mainnet
- **Wallet Signature Verification**: Secure authentication
- **Escrow Protection**: All funds held in smart contracts
- **Insurance Fund**: 5% of all fees go to insurance pool
- **Emergency Functions**: Pause/unpause capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

### Phase 1 (Q1 2024)
- [x] Core platform development
- [x] Smart contract deployment
- [ ] Beta testing program
- [ ] Security audit

### Phase 2 (Q2 2024)
- [ ] Mainnet launch
- [ ] Mobile app development
- [ ] Advanced trading features
- [ ] Partnership integrations

### Phase 3 (Q3 2024)
- [ ] NFT integration
- [ ] Cross-chain expansion
- [ ] Advanced analytics
- [ ] Community governance

## 🎉 Community

- **Website**: [fantasycrypto.io](https://fantasycrypto.io)
- **Discord**: [Join our community](https://discord.gg/fantasycrypto)
- **Twitter**: [@FantasyCrypto](https://twitter.com/fantasycrypto)
- **Telegram**: [t.me/fantasycrypto](https://t.me/fantasycrypto)

## ⚠️ Disclaimer

*Fantasy Crypto is a experimental DeFi platform. Cryptocurrency trading involves substantial risk of loss. Never risk more than you can afford to lose. This platform is for entertainment and educational purposes. Users must comply with local regulations.*

---

**"It's now or never"** - Trade responsibly and may the best trader win! 🏈💎
# Fantasy Crypto Platform

> Fantasy Football meets Crypto Trading - A DeFi trading competition platform built on Arbitrum

## Overview

Fantasy Crypto is a revolutionary platform that combines the excitement of fantasy sports with decentralized trading. Users can compete in PvP matches or join PvE leagues, trading crypto positions while earning UNITE tokens and ETH rewards.

## Features

### 🏈 Game Modes
- **PvP (Player vs Player)**: Weekly head-to-head trading competitions
- **PvE (Player vs Environment)**: 90-day league seasons with up to 12 participants

### 💰 Trading Classes
- **Barnacle**: 0.1 ETH wager, $1K positions
- **Guppie**: Entry level with small wagers
- **Shark**: 1 ETH wager, $10K positions
- **Whale**: 100 ETH wager, $100K positions  
- **Poseidon**: 1000 ETH wager, $1M positions

### 🚀 UNITE Token Features
- **Staking Rewards**: Earn UNITE tokens from match/league performance
- **Leverage Unlocking**: Higher staking tiers unlock increased leverage (up to 10x)
- **Draft Priority**: UNITE stakers get priority in league draft order
- **Boosting**: High-tier stakers can use temporary leverage boosts

## Technology Stack

### Frontend
- **Next.js 14** - React framework
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Wagmi + Reown AppKit** - Wallet integration
- **Recharts** - Data visualization

### Backend
- **Node.js + Express** - API server
- **PostgreSQL** - Database
- **WebSocket** - Real-time updates
- **Pear Protocol** - Trading execution

### Smart Contracts
- **Solidity 0.8.19** - Contract language
- **OpenZeppelin** - Security standards
- **Hardhat** - Development framework
- **Arbitrum** - L2 deployment

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/obsanitylabs/fantasy-crypto.git
cd fantasy-crypto

# Install dependencies
npm install

# Setup environment variables
cp api.conf .env
# Edit .env with your actual values

# Initialize database
psql -c "CREATE DATABASE fantasy_crypto;"
npm run db:init

# Start development servers
npm run dev:all
```

### Environment Setup

Copy `api.conf` to `.env` and configure:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/fantasy_crypto

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Reown Project ID
NEXT_PUBLIC_REOWN_PROJECT_ID=your-reown-project-id

# API Keys
COINMARKETCAP_API_KEY=your-cmc-key
COINGECKO_API_KEY=your-coingecko-key

# Pear Protocol
PEAR_PROTOCOL_API_KEY=contact-pear-for-access
```

### Smart Contract Deployment

```bash
# Compile contracts
npm run compile

# Deploy to Arbitrum
npm run deploy
```

## Architecture

### Database Schema
- **Users**: Wallet addresses, stats, UNITE balances
- **Matches**: PvP match data and results
- **Leagues**: PvE league information
- **Lineups**: Daily trading positions
- **Drafted Coins**: User's selected trading pairs
- **UNITE Rewards**: Token distribution tracking

### API Endpoints
- `/api/auth` - User authentication
- `/api/matches` - PvP match management
- `/api/leagues` - PvE league operations
- `/api/trading` - Position management
- `/api/unite` - Token staking/rewards
- `/api/leaderboard` - Rankings and stats

### Smart Contracts
- **UniteToken.sol**: ERC20 token with staking features
- **FantasyCrypto.sol**: Main platform contract with escrow

## Game Flow

### PvP Matches
1. Users set wager amount and position size
2. Matching system finds suitable opponents
3. Draft phase: Select 12 coins for trading
4. Active trading: Daily lineup management (6 long, 6 short)
5. Settlement: Winner takes pot minus platform fees

### PvE Leagues
1. Join class-appropriate league (12 players max)
2. Live snake draft when league fills
3. 90-day season with daily lineup changes
4. Rankings based on realized + open P&L
5. Prize distribution to top performers

### UNITE Token Economy
- **1M Total Supply**: Fixed token cap
- **Reward Distribution**: 
  - PvP Winner: 90 UNITE
  - PvP Loser: 10 UNITE
  - PvE 1st: 10,000 UNITE
  - PvE 2nd: 3,000 UNITE
  - PvE 3rd: 1,000 UNITE
  - Others: 100 UNITE
- **Platform Fees**: 10% total (5% insurance, 5% UNITE stakers)

## Security Features

- **Wallet-based Authentication**: No passwords needed
- **Smart Contract Escrow**: Automated fund management
- **SQL Injection Protection**: Parameterized queries
- **Input Validation**: Comprehensive data sanitization
- **Rate Limiting**: API abuse prevention

## Development

### Running Tests
```bash
# Backend tests
npm run test:backend

# Contract tests
npm run test:contracts

# Integration tests
npm run test:integration
```

### Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Deployment

### Production Setup
1. Configure environment variables
2. Deploy smart contracts to Arbitrum mainnet
3. Set up PostgreSQL database
4. Deploy backend to your preferred hosting
5. Deploy frontend to Vercel/Netlify
6. Configure monitoring and logging

### Monitoring
- Database performance monitoring
- API endpoint monitoring  
- Smart contract event tracking
- WebSocket connection health
- Trading volume and user metrics

## Roadmap

- **Phase 1**: Core PvP and PvE functionality
- **Phase 2**: Mobile app development
- **Phase 3**: Advanced trading features
- **Phase 4**: Cross-chain expansion
- **Phase 5**: DAO governance implementation

## License

MIT License - see [LICENSE](LICENSE) for details

## Support

For questions and support:
- Email: support@fantasycrypto.io
- Discord: [Fantasy Crypto Community](https://discord.gg/fantasycrypto)
- Telegram: [@FantasyCrypto](https://t.me/FantasyCrypto)

---

**"It's now or never" - Start your Fantasy Crypto journey today!** 🏈⚡
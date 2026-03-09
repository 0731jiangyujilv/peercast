# Peercast

**Peercast** — A social-native prediction network powered by Chainlink CRE.

## Overview

Peercast is a decentralized peer-to-peer betting platform that enables users to create and settle bets through multiple interfaces: Telegram bot, Web app, and World Mini App. The platform leverages blockchain technology for transparent and trustless bet management, with Chainlink CRE (Compute Runtime Environment) providing secure off-chain computation, data verification, and automated settlement.

## Architecture

The project consists of five main components:

### 🤖 Telegram Bot (`/bot`)
- **Tech Stack**: Node.js, TypeScript, Telegraf, Prisma, Express, OpenAI
- **Purpose**: Provides the primary user interface through Telegram
- **Features**:
  - Interactive bet creation and management
  - Real-time bet status updates
  - User wallet integration
  - Database persistence with Prisma ORM
  - AI-powered bet suggestions and analysis
  - RESTful API for external integrations
  - CORS-enabled for cross-platform access

### ⛓️ Smart Contracts (`/contracts`)
- **Tech Stack**: Solidity, Foundry, OpenZeppelin
- **Networks**: Base Sepolia (Testnet), Base Mainnet
- **Core Contracts**:
  - `BetFactory.sol`: Factory contract for creating bet instances with operator management
  - `Bet.sol`: Individual bet contract logic with Chainlink price feed integration
  - `PeercastPoR.sol`: Proof of Reserve contract for verified statistics and leaderboard data
- **Features**:
  - Decentralized bet creation and settlement
  - Chainlink Data Feeds for price oracles (BTC/USD, ETH/USD, etc.)
  - Proof of Reserve for transparent platform statistics
  - Multi-token support (ERC20)
  - Configurable fee structure and duration limits
  - Gas-optimized contract design

### 🌐 Web Application (`/webapp`)
- **Tech Stack**: React 19, TypeScript, Vite, TailwindCSS 4, Wagmi 3
- **Purpose**: Web-based interface for bet management
- **Features**:
  - Telegram Mini App integration (`@tma.js/sdk-react`)
  - Wallet connectivity with Wagmi and Viem
  - Modern, responsive UI with Lucide icons
  - Real-time data fetching with TanStack Query
  - React Router for navigation
  - X402 integration for blockchain interactions

### 🌍 World Mini App (`/world-miniapp`)
- **Tech Stack**: Next.js 16, React 19, TypeScript, TailwindCSS 4, Worldcoin MiniKit
- **Purpose**: World App Mini App integration for Worldcoin ecosystem
- **Features**:
  - Worldcoin authentication and verification
  - MiniKit React integration for World App
  - NextAuth for session management
  - Modern UI with Worldcoin UI Kit
  - Iconoir icons for consistent design
  - Viem for blockchain interactions

### ⚡ Chainlink CRE Workflows (`/cre`)
- **Tech Stack**: Chainlink CRE, Bun runtime
- **Purpose**: Off-chain computation and automation
- **Workflows**:
  - **Automated Settlement**: Automated settlement using price feeds
  - **Proof of Reserve**: Statistics aggregation and verification
- **Features**:
  - Secure off-chain computation
  - Multi-chain support (Base Sepolia, Base Mainnet, Ethereum)
  - Staging and production environments
  - Automated workflow deployment and simulation

## Prerequisites

- **Node.js** (v18 or higher)
- **Bun** (for CRE workflows)
- **Foundry** (for smart contract development)
- **PostgreSQL** (for bot database)
- **PM2** (for process management)
- **Telegram Bot Token** (from [@BotFather](https://t.me/botfather))
- **Base Sepolia/Mainnet RPC URL** and **Private Key**
- **Chainlink CRE CLI** (for workflow deployment)
- **OpenAI API Key** (for AI features, optional)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd peercast
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install bot dependencies
npm run bot:install

# Install contract dependencies (Foundry)
npm run contracts:build

# Install CRE workflow dependencies
npm run cre:install

# Install webapp dependencies
cd webapp && npm install

# Install world-miniapp dependencies
cd world-miniapp && npm install
```

### 3. Environment Setup

Create `.env` files in each component directory:

#### Bot (`/bot/.env`)
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
DATABASE_URL=postgresql://user:password@localhost:5432/peercast
BASE_SEPOLIA_RPC_URL=your_rpc_url
PRIVATE_KEY=your_private_key
OPENAI_API_KEY=your_openai_api_key
PORT=3000
```

#### Contracts (`/contracts/.env`)
```env
BASE_SEPOLIA_RPC_URL=your_rpc_url
PRIVATE_KEY=your_private_key
BASESCAN_API_KEY=your_basescan_api_key
```

#### WebApp (`/webapp/.env`)
```env
VITE_BOT_API_URL=http://localhost:3000
VITE_CHAIN_ID=84532
```

#### World Mini App (`/world-miniapp/.env`)
```env
NEXT_PUBLIC_APP_ID=your_world_app_id
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3090
```

#### CRE Workflows (`/cre/.env`)
```env
# Configured via project.yaml and secrets.yaml
```

## Usage

### Process Management (PM2)

```bash
# Start all services in development
npm run dev

# Start all services in production
npm start

# Stop all services
npm stop

# Restart all services
npm restart

# View logs
npm run logs

# Check status
npm run status

# Delete all processes
npm run delete
```

### Smart Contracts

```bash
# Build contracts
npm run contracts:build

# Run tests
npm run contracts:test

# Run tests with verbose output
npm run contracts:test:v

# Generate gas report
npm run contracts:test:gas

# Generate gas snapshot
npm run contracts:snapshot

# Format code
npm run contracts:fmt

# Deploy to Base Sepolia
npm run contracts:deploy:base-sepolia

# Verify contract
npm run contracts:verify
```

### Telegram Bot

```bash
# Setup database
npm run bot:db:push

# Run in development mode
npm run bot:dev

# Build for production
npm run bot:build

# Start production server
npm run bot:start

# Open Prisma Studio
npm run bot:db:studio
```

### Web Application

```bash
# Navigate to webapp directory
cd webapp

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### World Mini App

```bash
# Navigate to world-miniapp directory
cd world-miniapp

# Run development server
npm run dev

# Build for production
npm run build

# Start production server (port 3090)
npm start

# Lint code
npm run lint
```

### Chainlink CRE Workflows

```bash
# Install CRE dependencies
npm run cre:install

# Simulate bet creation workflow
npm run cre:simulate:bet-creation

# Simulate bet settlement workflow
npm run cre:simulate:bet-settlement

# Deploy bet creation workflow
npm run cre:deploy:bet-creation

# Deploy bet settlement workflow
npm run cre:deploy:bet-settlement
```

## Project Structure

```
peercast/
├── bot/                    # Telegram bot backend
│   ├── src/
│   │   ├── bot.ts         # Bot logic
│   │   ├── api.ts         # Express API
│   │   ├── services/      # Business logic
│   │   └── scripts/       # Utility scripts
│   ├── prisma/            # Database schema & migrations
│   └── abis/              # Contract ABIs
├── contracts/             # Smart contracts
│   ├── src/
│   │   ├── Bet.sol
│   │   ├── BetFactory.sol
│   │   ├── PeercastPoR.sol
│   │   └── interfaces/
│   ├── script/            # Deployment scripts
│   │   ├── DeployBetFactory.s.sol
│   │   ├── DeployPeercastPoR.s.sol
│   │   └── DeployWorldChain.s.sol
│   ├── test/              # Contract tests
│   └── lib/               # Dependencies (OpenZeppelin, Chainlink, Forge-std)
├── webapp/                # Web frontend (Vite + React)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── config/        # Configuration
│   └── public/            # Static assets
├── world-miniapp/         # World App Mini App (Next.js)
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── auth/          # Authentication
│   │   ├── abi/           # Contract ABIs
│   │   └── components/    # React components
│   └── public/            # Static assets
├── cre/                   # Chainlink CRE workflows
│   ├── por/               # Proof of Reserve workflow
│   ├── project.yaml       # CRE configuration
│   └── secrets.yaml       # CRE secrets
└── package.json           # Root package configuration
```

## Features

- ✅ **Decentralized Betting**: Trustless bet creation and settlement on-chain
- ✅ **Multi-Platform Access**: Telegram bot, Web app, and World Mini App
- ✅ **Chainlink CRE Integration**: Off-chain computation for bet validation and settlement
- ✅ **Chainlink Price Feeds**: Real-time price data for accurate settlements
- ✅ **Proof of Reserve**: Transparent platform statistics and leaderboard verification
- ✅ **AI-Powered Features**: OpenAI integration for bet suggestions and analysis
- ✅ **World ID Integration**: Worldcoin authentication and verification
- ✅ **Multi-Token Support**: Bet with various ERC20 tokens
- ✅ **Wallet Support**: Connect with popular Web3 wallets (Wagmi, Viem)
- ✅ **Real-time Updates**: Live bet status and notifications
- ✅ **Gas Optimized**: Efficient smart contract design
- ✅ **Production Ready**: PM2 process management for reliable deployment
- ✅ **Database Persistence**: PostgreSQL with Prisma ORM
- ✅ **RESTful API**: Express backend for external integrations

## Development

### Running Tests

```bash
# Contract tests
npm run contracts:test

# Contract tests with gas reporting
npm run contracts:test:gas
```

### Code Formatting

```bash
# Format Solidity contracts
npm run contracts:fmt
```

### Database Management

```bash
# Generate Prisma client
npm run bot:db:generate

# Push schema changes
npm run bot:db:push

# Create migration
npm run bot:db:migrate

# Open Prisma Studio
npm run bot:db:studio
```

## Technology Stack

### Blockchain & Smart Contracts
- **Solidity**: Smart contract development
- **Foundry**: Testing and deployment framework
- **OpenZeppelin**: Security-audited contract libraries
- **Base**: Layer 2 network (Sepolia testnet & Mainnet)
- **Chainlink**: Price feeds and CRE workflows

### Backend
- **Node.js**: Runtime environment
- **TypeScript**: Type-safe development
- **Express**: RESTful API server
- **Prisma**: Database ORM
- **PostgreSQL**: Relational database
- **PM2**: Process management
- **OpenAI**: AI-powered features

### Frontend
- **React 19**: UI framework
- **Next.js 16**: World Mini App framework
- **Vite**: Build tool for webapp
- **TailwindCSS 4**: Utility-first CSS
- **Wagmi 3**: React hooks for Ethereum
- **Viem**: TypeScript Ethereum library
- **TanStack Query**: Data fetching and caching
- **React Router**: Navigation (webapp)

### Telegram & World Integration
- **Telegraf**: Telegram bot framework
- **@tma.js/sdk-react**: Telegram Mini App SDK
- **Worldcoin MiniKit**: World App integration
- **NextAuth**: Authentication for World Mini App

### Chainlink CRE
- **Bun**: JavaScript runtime for workflows
- **CRE CLI**: Workflow deployment and simulation

### Development Tools
- **TypeScript**: Type safety across all components
- **ESLint**: Code linting
- **Prettier**: Code formatting (via Foundry for Solidity)

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For questions or issues, please open an issue in the repository or contact the development team.

---

Built with ❤️ using Chainlink CRE, Worldcoin, Base, and X402.

# Peercast

**Peercast** — A social-native prediction network powered by Chainlink CRE.

## Overview

Peercast is a peer-to-peer betting platform that enables users to create and settle bets through a Telegram bot interface. The platform leverages blockchain technology for transparent and trustless bet management, with Chainlink providing secure off-chain data and automation.

## Architecture

The project consists of three main components:

### 🤖 Telegram Bot (`/bot`)
- **Tech Stack**: Node.js, TypeScript, Telegraf, Prisma, Express
- **Purpose**: Provides the user interface through Telegram
- **Features**:
  - Interactive bet creation and management
  - Real-time bet status updates
  - User wallet integration
  - Database persistence with Prisma ORM

### ⛓️ Smart Contracts (`/contracts`)
- **Tech Stack**: Solidity, Foundry
- **Network**: Base Sepolia (Testnet)
- **Core Contracts**:
  - `BetFactory.sol`: Factory contract for creating bet instances
  - `Bet.sol`: Individual bet contract logic
- **Features**:
  - Decentralized bet creation and settlement
  - Chainlink integration for automation and data feeds
  - Gas-optimized contract design

### 🌐 Web Application (`/webapp`)
- **Tech Stack**: React, TypeScript, Vite, TailwindCSS
- **Purpose**: Web-based interface for bet management
- **Features**:
  - Telegram Mini App integration (`@tma.js/sdk-react`)
  - Wallet connectivity with Wagmi
  - Modern, responsive UI with Lucide icons
  - Real-time data fetching with TanStack Query

## Prerequisites

- **Node.js** (v18 or higher)
- **Foundry** (for smart contract development)
- **PostgreSQL** (for bot database)
- **Telegram Bot Token** (from [@BotFather](https://t.me/botfather))
- **Base Sepolia RPC URL** and **Private Key**

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd peercast
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# Install bot dependencies
npm run bot:install

# Install contract dependencies (Foundry)
npm run contracts:build
```

### 3. Environment Setup

Create `.env` files in each component directory:

#### Bot (`/bot/.env`)
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
DATABASE_URL=postgresql://user:password@localhost:5432/peercast
BASE_SEPOLIA_RPC_URL=your_rpc_url
PRIVATE_KEY=your_private_key
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

## Usage

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
│   ├── prisma/            # Database schema
│   └── abis/              # Contract ABIs
├── contracts/             # Smart contracts
│   ├── src/
│   │   ├── Bet.sol
│   │   ├── BetFactory.sol
│   │   └── interfaces/
│   ├── script/            # Deployment scripts
│   └── test/              # Contract tests
├── webapp/                # Web frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   └── hooks/         # Custom hooks
│   └── public/            # Static assets
└── package.json           # Root package configuration
```

## Features

- ✅ **Decentralized Betting**: Trustless bet creation and settlement on-chain
- ✅ **Telegram Integration**: Seamless user experience through Telegram bot
- ✅ **Chainlink Automation**: Automated bet settlement and data verification
- ✅ **Multi-Platform**: Access via Telegram bot or web application
- ✅ **Wallet Support**: Connect with popular Web3 wallets
- ✅ **Real-time Updates**: Live bet status and notifications
- ✅ **Gas Optimized**: Efficient smart contract design

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

- **Blockchain**: Solidity, Foundry, Base (L2)
- **Backend**: Node.js, TypeScript, Express, Prisma
- **Frontend**: React, Vite, TailwindCSS, Wagmi
- **Bot Framework**: Telegraf
- **Oracle**: Chainlink
- **Database**: PostgreSQL
- **Web3 Libraries**: Viem, Wagmi

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

Built with ❤️ using Chainlink, World Mini App, and Base x402.

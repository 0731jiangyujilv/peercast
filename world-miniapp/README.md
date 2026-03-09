# Peercast - Peer-to-Peer Prediction Market

Peercast is a decentralized prediction market built as a World App Mini App. Users can create 1v1 price predictions on crypto assets (BTC, ETH, LINK), stake USDC, and share predictions via World Chat to challenge friends.

## Features

- 🎯 **Create Predictions**: Choose asset, direction (UP/DOWN), amount, and duration
- 💰 **Stake USDC**: Both parties deposit equal amounts to create a prize pool
- 🔗 **Share via World Chat**: Deep link sharing to invite opponents directly in chat
- ⛓️ **World Chain Integration**: Full EVM blockchain integration with MiniKit
- 📊 **Chainlink Price Feeds**: Accurate, tamper-proof price data
- 🤖 **Chainlink Automation**: Automatic settlement when duration expires
- 📈 **Proof of Reserve**: On-chain statistics via Chainlink CRE

## Architecture

### Smart Contracts (World Chain)
- **BetFactory**: Creates and manages prediction contracts
- **Bet**: Individual 1v1 prediction logic with deposits and settlement
- **PeercastPoR**: Stores platform statistics verified by Chainlink

### Frontend (Next.js + MiniKit)
- **Create Page**: UI for creating new predictions
- **Prediction Detail**: View and accept predictions, deposit funds
- **Predictions List**: Dashboard showing active and past predictions
- **Share Integration**: MiniKit share command for viral growth

### Blockchain Integration
- **MiniKit Transactions**: Approve USDC and deposit to bet contracts
- **World Chain RPC**: Read contract state and listen for events
- **Deep Linking**: Universal links for seamless chat-to-app flow

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: World App UI Kit, TailwindCSS
- **Blockchain**: World Chain (OP Stack), Viem, MiniKit
- **Auth**: NextAuth with MiniKit Wallet Auth
- **Smart Contracts**: Solidity, Foundry

## Getting Started

### Prerequisites
- Node.js 18+
- World App installed on mobile device
- USDC on World Chain (for testing)

### Setup

1. **Clone and Install**
   ```bash
   cd my-first-mini-app
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.sample .env.local
   ```
   
   Update `.env.local` with:
   - `NEXT_PUBLIC_APP_ID`: Your app ID from developer.worldcoin.org
   - `NEXT_PUBLIC_BET_FACTORY_ADDRESS`: Deployed BetFactory contract address
   - `NEXT_PUBLIC_USDC_ADDRESS`: USDC token address on World Chain
   - `AUTH_SECRET`: Run `npx auth secret` to generate
   - `AUTH_URL`: Your ngrok URL for testing

3. **Deploy Smart Contracts** (if not already deployed)
   ```bash
   cd ../../contracts
   forge script script/DeployBetFactory.s.sol --rpc-url worldchain --broadcast
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Expose with ngrok**
   ```bash
   ngrok http 3000
   ```

6. **Configure Developer Portal**
   - Go to developer.worldcoin.org
   - Update your app's URL to the ngrok URL
   - Add contract addresses to Advanced settings:
     - Contract Entrypoints: BetFactory address
     - Permit2 Tokens: USDC address

### Backend API (Required)

The app requires a backend API for operator functions (creating predictions). Deploy the bot backend:

```bash
cd ../../bot
npm install
npm run dev
```

Update `NEXT_PUBLIC_API_URL` in `.env.local` to point to your backend.

## Authentication

This starter kit uses [Minikit's](https://github.com/worldcoin/minikit-js) wallet auth to authenticate users, and [next-auth](https://authjs.dev/getting-started) to manage sessions.

## UI Library

This starter kit uses [Mini Apps UI Kit](https://github.com/worldcoin/mini-apps-ui-kit) to style the app. We recommend using the UI kit to make sure you are compliant with [World App's design system](https://docs.world.org/mini-apps/design/app-guidelines).

## Eruda

[Eruda](https://github.com/liriliri/eruda) is a tool that allows you to inspect the console while building as a mini app. You should disable this in production.

## User Flow

1. **Create Prediction**
   - User selects asset (BTC/USD, ETH/USD, LINK/USD)
   - Chooses direction (UP or DOWN)
   - Sets bet amount (1-100 USDC)
   - Picks duration (5m - 1d)
   - Clicks "Create Prediction"

2. **Share to Opponent**
   - After creation, share dialog opens automatically
   - User shares deep link via World Chat or other apps
   - Link format: `https://world.org/mini-app?app_id={id}&path=/prediction/{betId}`

3. **Opponent Accepts**
   - Opponent clicks link in chat
   - World App opens directly to prediction detail page
   - Reviews prediction details
   - Clicks "Accept & Deposit" to join

4. **Both Deposit**
   - MiniKit prompts for USDC approval
   - MiniKit prompts for deposit transaction
   - When both deposit, bet automatically locks
   - Start price recorded from Chainlink Price Feed

5. **Wait for Settlement**
   - Countdown timer shows time remaining
   - Chainlink Automation monitors the bet
   - When duration expires, settlement is triggered automatically

6. **Winner Receives Payout**
   - End price compared to start price
   - Winner receives 2x stake (minus 2.5% fee)
   - Loser receives nothing
   - If price unchanged, both get refunds

## Key Technical Decisions

### Why World Chain?
- **EVM Compatible**: Use existing Solidity contracts
- **Low Fees**: Affordable for small bets
- **World App Integration**: Native MiniKit support
- **Chainlink Support**: Price Feeds and Automation available

### Why MiniKit?
- **Wallet Auth**: Seamless authentication with World ID
- **Transactions**: Easy EVM transaction signing
- **Share Command**: Built-in viral growth mechanism
- **Deep Links**: Smooth chat-to-app transitions

### Why Chainlink?
- **Price Feeds**: Decentralized, tamper-proof price data
- **Automation**: Trustless settlement without backend
- **Proof of Reserve**: Verifiable platform statistics

## Project Structure

```
my-first-mini-app/
├── src/
│   ├── app/
│   │   ├── (protected)/
│   │   │   ├── create/          # Create prediction page
│   │   │   ├── prediction/[id]/ # Prediction detail page
│   │   │   ├── predictions/     # List of predictions
│   │   │   └── mock/            # Mock chat demo
│   │   └── page.tsx             # Landing page
│   ├── components/
│   │   ├── Navigation/          # Bottom navigation
│   │   └── PageLayout/          # Layout wrapper
│   ├── lib/
│   │   └── blockchain.ts        # Blockchain integration
│   ├── config/
│   │   └── contracts.ts         # Contract addresses & config
│   ├── types/
│   │   └── prediction.ts        # TypeScript types
│   └── abi/                     # Contract ABIs
├── .env.sample                  # Environment template
└── README.md
```

## Contributing

Built with World App Mini Apps SDK and Chainlink infrastructure.


# Chatutu Proof of Reserve (PoR)

A Chainlink CRE-based Proof of Reserve system for the Chatutu betting platform.

## Features

- ✅ Periodic verification of on-chain and off-chain data consistency
- ✅ Fetches platform stats (total bets, active bets, settled bets, etc.)
- ✅ Fetches profit leaderboard data (using TG usernames)
- ✅ Writes verification results to the on-chain PoR contract
- ✅ Provides historical verification record queries

## Architecture

```
Scheduled Trigger (Cron: every 10 minutes)
    ↓
1. Fetch off-chain data (HTTP)
   - Bot API: /api/stats (stats)
   - Bot API: /api/stats/leaderboard (leaderboard)
    ↓
2. Fetch on-chain data (EVM Read)
   - BetFactory.getBetCount() (total bets)
    ↓
3. Verify data consistency
   - Compare on-chain and off-chain total bet counts
    ↓
4. Write on-chain (EVM Write)
   - ChatutuPoR contract stores verification results
```

## Data Structures

### Data stored in the PoR contract

```solidity
struct PoRData {
    uint256 totalBets;        // Total bet count
    uint256 activeBets;       // Active bet count
    uint256 settledBets;      // Settled bet count
    uint256 totalVolume;      // Total volume (wei)
    uint256 topPlayerProfit;  // Top player profit (wei)
    bool isValid;             // Whether data verification passed
    uint256 timestamp;        // Verification timestamp
    uint256 updateCount;      // Update count
}
```

## Installation

### 1. Install dependencies

```bash
cd chatutu-por/por
bun install
```

### 2. Configure environment variables

```bash
cp .env.sample .env
```

Edit `.env` and set:
- `CRE_ETH_PRIVATE_KEY`: Private key for EVM writes
- `BOT_API_URL`: Bot API URL (for local testing)

### 3. Update config

Edit `por/config.staging.json` and set:
- `botApiUrl`: Bot API URL
- `evms[0].porAddress`: Deployed ChatutuPoR contract address
- `evms[0].betFactoryAddress`: BetFactory contract address

## Usage

### Local simulation (no real transactions)

```bash
cd chatutu-por
cre workflow simulate por
```

### Local simulation (broadcast real transactions)

```bash
cre workflow simulate por --broadcast
```

### Deploy to production

```bash
# 1. Set production config
# Edit por/config.production.json

# 2. Deploy workflow
cre workflow deploy por --target production-settings

# 3. Set secrets
cre secret set BOT_API_URL https://your-production-api.com
```

## Contract Deployment

### 1. Deploy ChatutuPoR

```bash
cd ../../contracts

# Deploy to Base Sepolia
forge create src/ChatutuPoR.sol:ChatutuPoR \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args <FORWARDER_ADDRESS>
```

**Forwarder address:**
- Base Sepolia Testnet: `0x...` (see [CRE docs](https://docs.chain.link/cre/guides/workflow/using-evm-client/forwarder-directory-ts))

### 2. Verify contract

```bash
forge verify-contract \
  --chain-id 84532 \
  --compiler-version v0.8.24 \
  <CONTRACT_ADDRESS> \
  src/ChatutuPoR.sol:ChatutuPoR \
  --constructor-args $(cast abi-encode "constructor(address)" <FORWARDER_ADDRESS>)
```

## API Endpoints

The bot must expose the following endpoints:

### 1. Stats
```
GET /api/stats
```

Response:
```json
{
  "activeBetsCount": 10,
  "totalBetsCount": 100,
  "totalVolume": "50000.00",
  "settledBetsCount": 85,
  "cancelledBetsCount": 5
}
```

### 2. Leaderboard
```
GET /api/stats/leaderboard?limit=10
```

Response:
```json
[
  {
    "username": "alice",
    "wins": 15,
    "losses": 5,
    "totalProfit": "1250.50",
    "winRate": 75.0,
    "totalBets": 20
  }
]
```

## Monitoring

### Get latest PoR data

```solidity
// Call the ChatutuPoR contract
function getLatestData() external view returns (PoRData memory)
```

### Get historical data

```solidity
function getHistoricalData(uint256 updateId) external view returns (PoRData memory)
```

### Event listening

```solidity
event PoRUpdated(
    uint256 indexed updateId,
    uint256 totalBets,
    uint256 activeBets,
    uint256 settledBets,
    uint256 totalVolume,
    uint256 topPlayerProfit,
    bool isValid,
    uint256 timestamp
)
```

## Troubleshooting

### Data mismatch

If `isValid = false`, check:
1. Whether the bot database is in sync with on-chain data
2. Whether the BetFactory contract address is correct
3. Whether the Bot API returns data correctly

### Workflow execution failed

Check:
1. Whether the Bot API is reachable
2. Whether the contract addresses are correct
3. Whether the gas limit is sufficient
4. Whether the Forwarder address is correct

## Related Resources

- [Chainlink CRE docs](https://docs.chain.link/cre)
- [CRE PoR example](https://github.com/Nalon/cre-por-llm-demo)
- [Chatutu project docs](../README.md)

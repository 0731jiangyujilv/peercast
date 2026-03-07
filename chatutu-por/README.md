# Chatutu Proof of Reserve (PoR)

基于 Chainlink CRE 的 Chatutu 赌局平台储备证明系统。

## 功能

- ✅ 定期验证链上和链下数据一致性
- ✅ 获取平台统计数据（总赌局数、活跃赌局、已结算赌局等）
- ✅ 获取盈利排行榜数据（使用 TG username）
- ✅ 将验证结果写入链上 PoR 合约
- ✅ 提供历史验证记录查询

## 架构

```
定时触发 (Cron: 每10分钟)
    ↓
1. 获取链下数据 (HTTP)
   - Bot API: /api/stats (统计数据)
   - Bot API: /api/stats/leaderboard (排行榜)
    ↓
2. 获取链上数据 (EVM Read)
   - BetFactory.getBetCount() (总赌局数)
    ↓
3. 验证数据一致性
   - 对比链上和链下的总赌局数
    ↓
4. 写入链上 (EVM Write)
   - ChatutuPoR 合约存储验证结果
```

## 数据结构

### PoR 合约存储的数据

```solidity
struct PoRData {
    uint256 totalBets;        // 总赌局数
    uint256 activeBets;       // 活跃赌局数
    uint256 settledBets;      // 已结算赌局数
    uint256 totalVolume;      // 总交易量 (wei)
    uint256 topPlayerProfit;  // 榜首玩家盈利 (wei)
    bool isValid;             // 数据是否验证通过
    uint256 timestamp;        // 验证时间戳
    uint256 updateCount;      // 更新次数
}
```

## 安装

### 1. 安装依赖

```bash
cd chatutu-por/por
bun install
```

### 2. 配置环境变量

```bash
cp .env.sample .env
```

编辑 `.env` 文件，设置：
- `CRE_ETH_PRIVATE_KEY`: 用于 EVM 写入的私钥
- `BOT_API_URL`: Bot API 地址（本地测试用）

### 3. 更新配置

编辑 `por/config.staging.json`，设置：
- `botApiUrl`: Bot API 地址
- `evms[0].porAddress`: 已部署的 ChatutuPoR 合约地址
- `evms[0].betFactoryAddress`: BetFactory 合约地址

## 使用

### 本地模拟（不发送真实交易）

```bash
cd chatutu-por
cre workflow simulate por
```

### 本地模拟（发送真实交易）

```bash
cre workflow simulate por --broadcast
```

### 部署到生产环境

```bash
# 1. 设置生产环境配置
# 编辑 por/config.production.json

# 2. 部署工作流
cre workflow deploy por --target production-settings

# 3. 设置 secrets
cre secret set BOT_API_URL https://your-production-api.com
```

## 合约部署

### 1. 部署 ChatutuPoR 合约

```bash
cd ../../contracts

# 部署到 Base Sepolia
forge create src/ChatutuPoR.sol:ChatutuPoR \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args <FORWARDER_ADDRESS>
```

**Forwarder 地址：**
- Base Sepolia Testnet: `0x...` (查看 [CRE 文档](https://docs.chain.link/cre/guides/workflow/using-evm-client/forwarder-directory-ts))

### 2. 验证合约

```bash
forge verify-contract \
  --chain-id 84532 \
  --compiler-version v0.8.24 \
  <CONTRACT_ADDRESS> \
  src/ChatutuPoR.sol:ChatutuPoR \
  --constructor-args $(cast abi-encode "constructor(address)" <FORWARDER_ADDRESS>)
```

## API 端点

Bot 需要提供以下 API 端点：

### 1. 统计数据
```
GET /api/stats
```

响应：
```json
{
  "activeBetsCount": 10,
  "totalBetsCount": 100,
  "totalVolume": "50000.00",
  "settledBetsCount": 85,
  "cancelledBetsCount": 5
}
```

### 2. 排行榜
```
GET /api/stats/leaderboard?limit=10
```

响应：
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

## 监控

### 查看最新 PoR 数据

```solidity
// 调用 ChatutuPoR 合约
function getLatestData() external view returns (PoRData memory)
```

### 查看历史数据

```solidity
function getHistoricalData(uint256 updateId) external view returns (PoRData memory)
```

### 事件监听

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

## 故障排除

### 数据不一致

如果 `isValid = false`，检查：
1. Bot 数据库是否与链上数据同步
2. BetFactory 合约地址是否正确
3. Bot API 是否正常返回数据

### 工作流执行失败

检查：
1. Bot API 是否可访问
2. 合约地址是否正确
3. Gas limit 是否足够
4. Forwarder 地址是否正确

## 相关资源

- [Chainlink CRE 文档](https://docs.chain.link/cre)
- [CRE PoR 示例](https://github.com/Nalon/cre-por-llm-demo)
- [Chatutu 项目文档](../README.md)

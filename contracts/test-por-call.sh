#!/bin/bash
# 测试直接调用 PeercastPoR 合约

# 编码报告数据
# activeBetsCount=0, totalBetsCount=2, settledBetsCount=2, totalVolume=2e18, topPlayerProfit=1e18, isValid=false, timestamp=now
REPORT_DATA=$(cast abi-encode "f(uint256,uint256,uint256,uint256,uint256,bool,uint256)" 0 2 2 2000000000000000000 1000000000000000000 false $(date +%s))

echo "Report data: $REPORT_DATA"

# 调用 onReport 函数（需要从 Forwarder 调用，这里只是测试编码）
cast call 0xc5Fe635977d13193Eb9e36ae967D98115BA4B68F \
  "onReport(bytes,bytes)" \
  "0x" \
  "$REPORT_DATA" \
  --rpc-url https://sepolia.base.org


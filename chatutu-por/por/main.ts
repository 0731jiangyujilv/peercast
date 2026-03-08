import {
  Runner,
  Runtime,
  handler,
  CronCapability,
  CronPayload,
  HTTPClient,
  EVMClient,
  getNetwork,
  TxStatus,
  encodeCallMsg,
  hexToBase64,
  toHex,
  fromHex,
  Address,
  encodeFunctionData,
  decodeFunctionResult,
  zeroAddress,
  Hex,
} from '@chainlink/cre-sdk'
import {
  encodeAbiParameters,
  parseAbiParameters,
  toHex,
  fromHex,
  Address,
  encodeFunctionData,
  decodeFunctionResult,
  zeroAddress,
  Hex,
} from 'viem'

interface Config {
  schedule: string
  botApiUrl: string
  evms: Array<{
    porAddress: string
    betFactoryAddress: string
    chainSelectorName: string
    gasLimit: string
  }>
}

interface BetStats {
  activeBetsCount: number
  totalBetsCount: number
  totalVolume: string
  settledBetsCount: number
  cancelledBetsCount: number
}

interface LeaderboardEntry {
  username: string
  wins: number
  losses: number
  totalProfit: string
  winRate: number
  totalBets: number
}

interface OffchainData {
  stats: BetStats
  leaderboard: LeaderboardEntry[]
  timestamp: number
}

interface OnchainData {
  totalBetsOnChain: bigint
  activeBetsOnChain: bigint
}

const BET_FACTORY_ABI = [
  {
    inputs: [],
    name: 'getBetCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export async function main() {
  const runner = await Runner.newRunner<Config>()
  await runner.run(initWorkflow)
}

const initWorkflow = (config: Config) => {
  const cronTrigger = new CronCapability()

  return [
    handler(
      cronTrigger.trigger({
        schedule: config.schedule,
      }),
      onCronTrigger
    ),
  ]
}

const onCronTrigger = (runtime: Runtime<Config>, payload: CronPayload): string => {
  if (!payload.scheduledExecutionTime) {
    throw new Error('Scheduled execution time is required')
  }

  runtime.log('🚀 Running Chatutu PoR Workflow')

  const offchainData = getOffchainData(runtime)
  const onchainData = getOnchainData(runtime)
  const isValid = verifyData(runtime, offchainData, onchainData)
  const txnHash = updatePoRContract(runtime, offchainData, onchainData, isValid)

  runtime.log('✅ Finished Chatutu PoR Workflow')

  return `PoR Update: ${isValid ? 'VALID' : 'INVALID'} | Tx: ${txnHash}`
}

const getOffchainData = (runtime: Runtime<Config>): OffchainData => {
  runtime.log(`📡 Fetching offchain data from ${runtime.config.botApiUrl}`)

  const httpClient = new HTTPClient()

  // Fetch stats
  const statsResponse = httpClient
    .sendRequest(runtime, {
      method: 'GET',
      url: `${runtime.config.botApiUrl}/api/stats`,
    })
    .result()

  if (statsResponse.statusCode !== 200) {
    throw new Error(`Failed to fetch stats: ${statsResponse.statusCode}`)
  }

  // Fetch leaderboard
  const leaderboardResponse = httpClient
    .sendRequest(runtime, {
      method: 'GET',
      url: `${runtime.config.botApiUrl}/api/stats/leaderboard?limit=10`,
    })
    .result()

  if (leaderboardResponse.statusCode !== 200) {
    throw new Error(`Failed to fetch leaderboard: ${leaderboardResponse.statusCode}`)
  }

  const stats: BetStats = JSON.parse(Buffer.from(statsResponse.body).toString('utf-8'))
  const leaderboard: LeaderboardEntry[] = JSON.parse(Buffer.from(leaderboardResponse.body).toString('utf-8'))

  const data: OffchainData = {
    stats,
    leaderboard,
    timestamp: Date.now(),
  }

  runtime.log(`📊 Offchain Stats: ${JSON.stringify(data.stats)}`)
  runtime.log(`🏆 Leaderboard entries: ${data.leaderboard.length}`)

  return data
}

const getOnchainData = (runtime: Runtime<Config>): OnchainData => {
  runtime.log('⛓️  Reading onchain data')

  const evmConfig = runtime.config.evms[0]
  console.log(evmConfig)
  const network = getNetwork({
    chainFamily: 'evm',
    chainSelectorName: evmConfig.chainSelectorName,
    isTestnet: true,
  })

  if (!network) {
    throw new Error(`Network not found: ${evmConfig.chainSelectorName}`)
  }

  const evmClient = new EVMClient(network.chainSelector.selector)

  const callData = encodeFunctionData({
    abi: BET_FACTORY_ABI,
    functionName: 'getBetCount',
    args: [],
  })

  const contractCall = evmClient
    .callContract(runtime, {
      call: encodeCallMsg({
        from: zeroAddress,
        to: evmConfig.betFactoryAddress as Address,
        data: callData as Hex,
      }),
    })
    .result()

  if (!contractCall.data || contractCall.data.length === 0) {
    throw new Error('Contract call returned no data')
  }

  const totalBets = decodeFunctionResult({
    abi: BET_FACTORY_ABI,
    functionName: 'getBetCount',
    data: toHex(contractCall.data),
  }) as bigint

  runtime.log(`📈 Onchain total bets: ${totalBets.toString()}`)

  return {
    totalBetsOnChain: totalBets,
    activeBetsOnChain: 0n,
  }
}

const verifyData = (
  runtime: Runtime<Config>,
  offchain: OffchainData,
  onchain: OnchainData
): boolean => {
  runtime.log('🔍 Verifying data consistency')

  const offchainTotal = BigInt(offchain.stats.totalBetsCount)
  const onchainTotal = onchain.totalBetsOnChain

  const isValid = offchainTotal === onchainTotal

  if (!isValid) {
    runtime.log(`⚠️  Data mismatch: Offchain=${offchainTotal}, Onchain=${onchainTotal}`)
  } else {
    runtime.log('✅ Data verification passed')
  }

  return isValid
}

const updatePoRContract = (
  runtime: Runtime<Config>,
  offchain: OffchainData,
  onchain: OnchainData,
  isValid: boolean
): string => {
  runtime.log('📝 Updating PoR contract')

  const evmConfig = runtime.config.evms[0]
  const network = getNetwork({
    chainFamily: 'evm',
    chainSelectorName: evmConfig.chainSelectorName,
    isTestnet: true,
  })

  if (!network) {
    throw new Error(`Network not found: ${evmConfig.chainSelectorName}`)
  }

  const evmClient = new EVMClient(network.chainSelector.selector)

  const topPlayer = offchain.leaderboard[0]
  const topPlayerProfit = topPlayer ? BigInt(Math.floor(parseFloat(topPlayer.totalProfit) * 1e18)) : 0n

  const reportData = encodeAbiParameters(
    parseAbiParameters(
      'uint256 totalBets, uint256 activeBets, uint256 settledBets, uint256 totalVolume, uint256 topPlayerProfit, bool isValid, uint256 timestamp'
    ),
    [
      BigInt(offchain.stats.totalBetsCount),
      BigInt(offchain.stats.activeBetsCount),
      BigInt(offchain.stats.settledBetsCount),
      BigInt(Math.floor(parseFloat(offchain.stats.totalVolume) * 1e18)),
      topPlayerProfit,
      isValid,
      BigInt(offchain.timestamp),
    ]
  )

  const reportResponse = runtime
    .report({
      encodedPayload: hexToBase64(reportData),
      encoderName: 'evm',
      signingAlgo: 'ecdsa',
      hashingAlgo: 'keccak256',
    })
    .result()

  const resp = evmClient
    .writeReport(runtime, {
      receiver: evmConfig.porAddress,
      report: reportResponse,
      gasConfig: {
        gasLimit: evmConfig.gasLimit,
      },
    })
    .result()

  if (resp.txStatus !== TxStatus.SUCCESS) {
    throw new Error(`Failed to write report: ${resp.errorMessage || resp.txStatus}`)
  }

  const txHash = resp.txHash || new Uint8Array(32)
  const txHashHex = toHex(txHash)

  runtime.log(`✅ PoR contract updated: ${txHashHex}`)

  return txHashHex
}

import { createPublicClient, createWalletClient, http, getAddress, parseUnits } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { baseSepolia } from "viem/chains"
import { config } from "../config"

const operatorAccount = privateKeyToAccount(
  (config.OPERATOR_PRIVATE_KEY.startsWith("0x")
    ? config.OPERATOR_PRIVATE_KEY
    : `0x${config.OPERATOR_PRIVATE_KEY}`) as `0x${string}`
)

export const walletClient = createWalletClient({
  account: operatorAccount,
  chain: baseSepolia,
  transport: http(config.RPC_URL),
})

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(config.RPC_URL),
})

export const BetFactoryAbi = [
  {
    type: "function",
    name: "createBet",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "duration", type: "uint256" },
      { name: "asset", type: "string" },
      { name: "participant1", type: "address" },
      { name: "participant2", type: "address" },
    ],
    outputs: [
      { name: "betId", type: "uint256" },
      { name: "betContract", type: "address" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getBet",
    inputs: [{ name: "betId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBetCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPriceFeed",
    inputs: [{ name: "asset", type: "string" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "BetCreated",
    inputs: [
      { name: "betId", type: "uint256", indexed: true },
      { name: "betContract", type: "address", indexed: false },
      { name: "participant1", type: "address", indexed: false },
      { name: "participant2", type: "address", indexed: false },
      { name: "token", type: "address", indexed: false },
      { name: "asset", type: "string", indexed: false },
    ],
  },
] as const

export const BetAbi = [
  {
    type: "function",
    name: "status",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "endTime",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "deposit",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancel",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "hasDeposited",
    inputs: [{ name: "participant", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "participant1",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "participant2",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBetInfo",
    inputs: [],
    outputs: [
      {
        name: "info",
        type: "tuple",
        components: [
          { name: "participant1", type: "address" },
          { name: "participant2", type: "address" },
          { name: "token", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "duration", type: "uint256" },
          { name: "priceFeed", type: "address" },
          { name: "startPrice", type: "int256" },
          { name: "endPrice", type: "int256" },
          { name: "startTime", type: "uint256" },
          { name: "endTime", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "winner", type: "address" },
          { name: "feeBps", type: "uint256" },
          { name: "feeRecipient", type: "address" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "checkUpkeep",
    inputs: [{ name: "checkData", type: "bytes" }],
    outputs: [
      { name: "upkeepNeeded", type: "bool" },
      { name: "performData", type: "bytes" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "performUpkeep",
    inputs: [{ name: "performData", type: "bytes" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "FeesCollected",
    inputs: [
      { name: "recipient", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Deposited",
    inputs: [
      { name: "participant", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "BetLocked",
    inputs: [
      { name: "startPrice", type: "int256", indexed: false },
      { name: "startTime", type: "uint256", indexed: false },
      { name: "endTime", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "BetSettled",
    inputs: [
      { name: "winner", type: "address", indexed: true },
      { name: "endPrice", type: "int256", indexed: false },
    ],
  },
  {
    type: "function",
    name: "settle",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "BetCancelled",
    inputs: [],
  },
] as const

export async function getBetCount(): Promise<bigint> {
  return publicClient.readContract({
    address: getAddress(config.BET_FACTORY_ADDRESS),
    abi: BetFactoryAbi,
    functionName: "getBetCount",
  })
}

export async function getBetAddress(betId: number): Promise<string> {
  const addr = await publicClient.readContract({
    address: getAddress(config.BET_FACTORY_ADDRESS),
    abi: BetFactoryAbi,
    functionName: "getBet",
    args: [BigInt(betId)],
  })
  return addr
}

export async function getBetInfo(betAddress: string) {
  return publicClient.readContract({
    address: getAddress(betAddress),
    abi: BetAbi,
    functionName: "getBetInfo",
  })
}

export async function getPriceFeed(asset: string): Promise<string> {
  return publicClient.readContract({
    address: getAddress(config.BET_FACTORY_ADDRESS),
    abi: BetFactoryAbi,
    functionName: "getPriceFeed",
    args: [asset],
  })
}

interface CreateBetParams {
  token: string
  amount: string // human-readable USDC amount (e.g. "100")
  duration: number // seconds
  asset: string // e.g. "BTC/USD"
  participant1: string
  participant2: string
}

export async function createBetOnChain(
  params: CreateBetParams
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const factoryAddr = getAddress(config.BET_FACTORY_ADDRESS)
    const usdcAmount = parseUnits(params.amount, 6)

    console.log("🔗 Sending createBet tx:", {
      factory: factoryAddr,
      token: params.token,
      amount: usdcAmount.toString(),
      duration: params.duration,
      asset: params.asset,
      p1: params.participant1,
      p2: params.participant2,
      operator: operatorAccount.address,
    })

    const txHash = await walletClient.writeContract({
      address: factoryAddr,
      abi: BetFactoryAbi,
      functionName: "createBet",
      args: [
        getAddress(params.token),
        usdcAmount,
        BigInt(params.duration),
        params.asset,
        getAddress(params.participant1),
        getAddress(params.participant2),
      ],
    })

    console.log("🔗 createBet tx sent:", txHash)

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    console.log("🔗 createBet confirmed in block", receipt.blockNumber)

    if (receipt.status === "reverted") {
      return { success: false, txHash, error: "Transaction reverted" }
    }

    return { success: true, txHash }
  } catch (err: any) {
    console.error("🔗 createBet error:", err)
    return { success: false, error: err?.shortMessage || err?.message || String(err) }
  }
}

export async function cancelBetOnChain(
  betAddress: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    console.log(`🚫 Cancelling bet at ${betAddress}...`)

    const txHash = await walletClient.writeContract({
      address: getAddress(betAddress),
      abi: BetAbi,
      functionName: "cancel",
    })

    console.log(`🚫 cancel tx sent: ${txHash}`)

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    console.log(`🚫 cancel confirmed in block ${receipt.blockNumber}`)

    if (receipt.status === "reverted") {
      return { success: false, txHash, error: "Transaction reverted" }
    }

    return { success: true, txHash }
  } catch (err: any) {
    console.error(`🚫 cancel error for ${betAddress}:`, err?.shortMessage || err?.message)
    return { success: false, error: err?.shortMessage || err?.message || String(err) }
  }
}

export async function settleBetOnChain(
  betAddress: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    console.log(`⚖️ Settling bet at ${betAddress}...`)

    const txHash = await walletClient.writeContract({
      address: getAddress(betAddress),
      abi: BetAbi,
      functionName: "settle",
    })

    console.log(`⚖️ settle tx sent: ${txHash}`)

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    console.log(`⚖️ settle confirmed in block ${receipt.blockNumber}`)

    if (receipt.status === "reverted") {
      return { success: false, txHash, error: "Transaction reverted" }
    }

    return { success: true, txHash }
  } catch (err: any) {
    console.error(`⚖️ settle error for ${betAddress}:`, err?.shortMessage || err?.message)
    return { success: false, error: err?.shortMessage || err?.message || String(err) }
  }
}

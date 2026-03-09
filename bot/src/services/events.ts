import { getAddress, formatUnits, encodeAbiParameters } from "viem"
import { Markup } from "telegraf"
import { publicClient, BetFactoryAbi, BetAbi } from "./blockchain"
import { config } from "../config"
import { prisma } from "../db"
import { bot } from "../bot"
import {
  betLockedMessage,
  betSettledMessage,
  betRefundMessage,
} from "../messages"
import { verifyBetContract } from "./verify"
import { registerAutomationUpkeep } from "./automation"

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
const POLL_INTERVAL = 5_000 // 5 seconds

let lastProcessedBlock: bigint | null = null

/**
 * Start polling for on-chain events from BetFactory and individual Bet contracts.
 * Uses log polling instead of WebSocket subscriptions for reliability.
 */
export async function startEventListener() {
  console.log("👁 Starting on-chain event listener...")

  // Start from current block
  lastProcessedBlock = await publicClient.getBlockNumber()
  console.log(`👁 Listening from block ${lastProcessedBlock}`)

  setInterval(pollEvents, POLL_INTERVAL)
}

async function pollEvents() {
  try {
    const currentBlock = await publicClient.getBlockNumber()
    if (lastProcessedBlock === null || currentBlock <= lastProcessedBlock) return

    const fromBlock = lastProcessedBlock + 1n
    const toBlock = currentBlock

    // 1. Poll BetCreated events from BetFactory
    await pollBetCreatedEvents(fromBlock, toBlock)

    // 2. Poll events from active Bet contracts
    await pollBetContractEvents(fromBlock, toBlock)

    lastProcessedBlock = toBlock
  } catch (err) {
    console.error("👁 Event polling error:", err)
  }
}

// --- BetCreated from BetFactory ---

async function pollBetCreatedEvents(fromBlock: bigint, toBlock: bigint) {
  const logs = await publicClient.getLogs({
    address: getAddress(config.BET_FACTORY_ADDRESS),
    event: {
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
    fromBlock,
    toBlock,
  })

  for (const log of logs) {
    await handleBetCreated(log)
  }
}

async function handleBetCreated(log: any) {
  const { betId, betContract, participant1, participant2, asset } = log.args
  const onChainBetId = Number(betId)
  const contractAddr = betContract as string

  console.log(`👁 BetCreated: #${onChainBetId} at ${contractAddr}`)

  // Find the matching DB bet by p1Address + p2Address + asset + status=ACCEPTED
  // (the CRE workflow was triggered with these addresses)
  const bet = await prisma.bet.findFirst({
    where: {
      status: "ACCEPTED",
      p1Address: { not: null },
      p2Address: { not: null },
      asset,
      contractAddress: null, // Not yet linked
    },
    orderBy: { createdAt: "desc" },
  })

  if (!bet) {
    console.warn(`👁 BetCreated #${onChainBetId}: no matching DB bet found`)
    return
  }

  // Update DB with on-chain info
  await prisma.bet.update({
    where: { id: bet.id },
    data: {
      betId: onChainBetId,
      contractAddress: contractAddr,
      status: "CREATED",
      txHash: log.transactionHash,
    },
  })

  // Update Telegram message with deposit buttons
  await updateTelegramBetCreated(bet.id, contractAddr)

  // Verify the Bet contract on Basescan (async, non-blocking)
  try {
    await verifyBetContractOnChain(contractAddr)
  } catch (err) {
    console.error("🔍 Failed to trigger verification:", err)
  }

  // Register Chainlink Automation upkeep (async, non-blocking)
  try {
    const betLabel = `PeerCast #${onChainBetId} (${asset})`
    const result = await registerAutomationUpkeep(contractAddr, betLabel)
    if (result.success) {
      console.log(`⚡ Automation upkeep registered for ${contractAddr}`)
    } else {
      console.warn(`⚡ Automation registration skipped: ${result.error}`)
    }
  } catch (err) {
    console.error("⚡ Failed to register automation:", err)
  }
}

async function verifyBetContractOnChain(contractAddress: string) {
  const addr = getAddress(contractAddress)

  // Read all bet info in one call
  const info = await publicClient.readContract({
    address: addr,
    abi: BetAbi,
    functionName: "getBetInfo",
  }) as any

  const constructorArgs = encodeAbiParameters(
    [
      { type: "address" }, // _token
      { type: "uint256" }, // _amount
      { type: "uint256" }, // _duration
      { type: "address" }, // _priceFeed
      { type: "address" }, // _participant1
      { type: "address" }, // _participant2
      { type: "uint256" }, // _feeBps
      { type: "address" }, // _feeRecipient
    ],
    [
      info.token as `0x${string}`,
      info.amount as bigint,
      info.duration as bigint,
      info.priceFeed as `0x${string}`,
      info.participant1 as `0x${string}`,
      info.participant2 as `0x${string}`,
      info.feeBps as bigint,
      info.feeRecipient as `0x${string}`,
    ]
  )

  verifyBetContract(contractAddress, constructorArgs)
}

async function updateTelegramBetCreated(dbBetId: number, contractAddress: string) {
  const bet = await prisma.bet.findUnique({
    where: { id: dbBetId },
    include: { participant1: true, participant2: true },
  })
  if (!bet || !bet.chatId || !bet.messageId) return

  const p1Name = bet.participant1?.username || String(bet.p1TgId)
  const p2Name = bet.participant2?.username || (bet.p2TgId ? String(bet.p2TgId) : "???")

  const explorerUrl = `https://sepolia.basescan.org/address/${contractAddress}`

  const depositUrl = `${config.WEBAPP_URL}/bet/${contractAddress}`

  try {
    await bot.telegram.editMessageText(
      Number(bet.chatId),
      Number(bet.messageId),
      undefined,
      [
        "📄 *Prediction Created On-Chain!*",
        "",
        `👤 @${p1Name} (${bet.direction === "UP" ? "📈 UP" : "📉 DOWN"}) vs @${p2Name} (${bet.direction === "UP" ? "📉 DOWN" : "📈 UP"})`,
        `📊 ${bet.asset} | 💰 ${bet.amount} USDC | ⏱ ${formatDurationShort(bet.duration)}`,
        "",
        "👉 Both players: tap below to deposit your wager.",
        "⏰ Deposit timeout: 3 min",
      ].join("\n"),
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.url("💳 Deposit Via Base X402", depositUrl)],
          [Markup.button.url("📋 View Contract", explorerUrl)],
        ]),
      }
    )
  } catch (err) {
    console.error("👁 Failed to update Telegram for BetCreated:", err)
  }
}

// --- Deposited / BetLocked / BetSettled / BetCancelled from Bet contracts ---

async function pollBetContractEvents(fromBlock: bigint, toBlock: bigint) {
  // Get all active bet contract addresses
  const activeBets = await prisma.bet.findMany({
    where: {
      contractAddress: { not: null },
      status: { in: ["CREATED", "DEPOSITING", "LOCKED"] },
    },
    select: { id: true, contractAddress: true, p1Address: true, p2Address: true },
  })

  if (activeBets.length === 0) return

  for (const bet of activeBets) {
    if (!bet.contractAddress) continue
    const addr = getAddress(bet.contractAddress)

    // Poll all Bet events for this contract
    const logs = await publicClient.getLogs({
      address: addr,
      events: [
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
          type: "event",
          name: "BetCancelled",
          inputs: [],
        },
      ],
      fromBlock,
      toBlock,
    })

    for (const log of logs) {
      const eventName = (log as any).eventName
      if (eventName === "Deposited") {
        await handleDeposited(bet.id, log as any)
      } else if (eventName === "BetLocked") {
        await handleBetLocked(bet.id, log as any)
      } else if (eventName === "BetSettled") {
        await handleBetSettled(bet.id, log as any)
      } else if (eventName === "BetCancelled") {
        await handleBetCancelled(bet.id)
      }
    }
  }
}

async function handleDeposited(dbBetId: number, log: any) {
  const participantAddr = (log.args.participant as string).toLowerCase()

  const bet = await prisma.bet.findUnique({ where: { id: dbBetId } })
  if (!bet) return

  const isP1 = bet.p1Address?.toLowerCase() === participantAddr
  const isP2 = bet.p2Address?.toLowerCase() === participantAddr

  console.log(`👁 Deposited: bet #${dbBetId} by ${isP1 ? "P1" : "P2"} (${participantAddr})`)

  const updateData: any = {}
  if (isP1) updateData.p1Deposited = true
  if (isP2) updateData.p2Deposited = true

  // If at least one deposited but not both, mark as DEPOSITING
  const newP1 = isP1 ? true : bet.p1Deposited
  const newP2 = isP2 ? true : bet.p2Deposited
  if (newP1 || newP2) {
    updateData.status = "DEPOSITING"
  }

  await prisma.bet.update({ where: { id: dbBetId }, data: updateData })

  // Update Telegram with deposit progress
  await updateTelegramDeposit(dbBetId, newP1, newP2)
}

async function updateTelegramDeposit(dbBetId: number, p1Deposited: boolean, p2Deposited: boolean) {
  const bet = await prisma.bet.findUnique({
    where: { id: dbBetId },
    include: { participant1: true, participant2: true },
  })
  if (!bet || !bet.chatId || !bet.messageId) return

  const p1Name = bet.participant1?.username || String(bet.p1TgId)
  const p2Name = bet.participant2?.username || (bet.p2TgId ? String(bet.p2TgId) : "???")
  const p1Status = p1Deposited ? "✅" : "⏳"
  const p2Status = p2Deposited ? "✅" : "⏳"

  const bothDone = p1Deposited && p2Deposited

  const msgText = [
    "💳 *Deposit Progress*",
    "",
    `${p1Status} @${p1Name}: ${p1Deposited ? "Deposited" : "Pending"}`,
    `${p2Status} @${p2Name}: ${p2Deposited ? "Deposited" : "Pending"}`,
    "",
    `📊 ${bet.asset} | 💰 ${bet.amount} USDC`,
    "",
    bothDone
      ? "🔒 Both deposited! Locking prediction..."
      : "⏳ Waiting for both players to deposit...",
  ].join("\n")

  // Keep deposit button if not both deposited yet
  const extra: any = { parse_mode: "Markdown" }
  if (!bothDone && bet.contractAddress) {
    const depositUrl = `${config.WEBAPP_URL}/bet/${bet.contractAddress}`
    extra.reply_markup = Markup.inlineKeyboard([
      [Markup.button.url("💳 Deposit Now", depositUrl)],
    ]).reply_markup
  }

  try {
    await bot.telegram.editMessageText(
      Number(bet.chatId),
      Number(bet.messageId),
      undefined,
      msgText,
      extra
    )
  } catch (err) {
    console.error("👁 Failed to update Telegram for deposit:", err)
  }
}

async function handleBetLocked(dbBetId: number, log: any) {
  const { startPrice, startTime, endTime } = log.args

  console.log(`👁 BetLocked: bet #${dbBetId}, startPrice=${startPrice}`)

  // Chainlink prices have 8 decimals
  const formattedPrice = formatUnits(startPrice < 0n ? -startPrice : startPrice, 8)
  const endDate = new Date(Number(endTime) * 1000)

  await prisma.bet.update({
    where: { id: dbBetId },
    data: {
      status: "LOCKED",
      startPrice: formattedPrice,
      startTime: new Date(Number(startTime) * 1000),
      endTime: endDate,
    },
  })

  // Update Telegram
  const bet = await prisma.bet.findUnique({ where: { id: dbBetId } })
  if (!bet || !bet.chatId || !bet.messageId) return

  try {
    await bot.telegram.editMessageText(
      Number(bet.chatId),
      Number(bet.messageId),
      undefined,
      betLockedMessage(bet.asset, formattedPrice, endDate.toUTCString()),
      { parse_mode: "Markdown" }
    )
  } catch (err) {
    console.error("👁 Failed to update Telegram for BetLocked:", err)
  }
}

async function handleBetSettled(dbBetId: number, log: any) {
  const { winner: winnerAddr, endPrice } = log.args

  console.log(`👁 BetSettled: bet #${dbBetId}, winner=${winnerAddr}`)

  const formattedEndPrice = formatUnits(endPrice < 0n ? -endPrice : endPrice, 8)

  const bet = await prisma.bet.findUnique({
    where: { id: dbBetId },
    include: { participant1: true, participant2: true },
  })
  if (!bet) return

  // Determine winner by address
  let winnerTgId: bigint | null = null
  let winnerUsername = "Nobody"
  const isRefund = winnerAddr === ZERO_ADDRESS

  if (!isRefund) {
    const winnerAddrLower = (winnerAddr as string).toLowerCase()
    if (bet.p1Address?.toLowerCase() === winnerAddrLower) {
      winnerTgId = bet.p1TgId
      winnerUsername = bet.participant1?.username || String(bet.p1TgId)
    } else if (bet.p2Address?.toLowerCase() === winnerAddrLower) {
      winnerTgId = bet.p2TgId
      winnerUsername = bet.participant2?.username || (bet.p2TgId ? String(bet.p2TgId) : "???")
    }
  }

  await prisma.bet.update({
    where: { id: dbBetId },
    data: {
      status: "SETTLED",
      endPrice: formattedEndPrice,
      winnerTgId,
      txHash: log.transactionHash,
    },
  })

  if (!bet.chatId || !bet.messageId) return

  try {
    const msg = isRefund
      ? betRefundMessage(bet.asset, formattedEndPrice)
      : betSettledMessage(
          winnerUsername,
          bet.asset,
          bet.startPrice || "?",
          formattedEndPrice,
          Number(bet.amount)
        )

    await bot.telegram.editMessageText(
      Number(bet.chatId),
      Number(bet.messageId),
      undefined,
      msg,
      { parse_mode: "Markdown" }
    )
  } catch (err) {
    console.error("👁 Failed to update Telegram for BetSettled:", err)
  }
}

async function handleBetCancelled(dbBetId: number) {
  console.log(`👁 BetCancelled: bet #${dbBetId}`)

  const bet = await prisma.bet.findUnique({
    where: { id: dbBetId },
    include: { participant1: true, participant2: true },
  })
  if (!bet) return

  await prisma.bet.update({
    where: { id: dbBetId },
    data: { status: "CANCELLED" },
  })

  if (!bet.chatId) return

  const p1Name = bet.participant1?.username || String(bet.p1TgId)
  const p2Name = bet.participant2?.username || (bet.p2TgId ? String(bet.p2TgId) : "???")
  const p1Status = bet.p1Deposited ? "✅ deposited" : "❌ not deposited"
  const p2Status = bet.p2Deposited ? "✅ deposited" : "❌ not deposited"

  // Edit original message
  if (bet.messageId) {
    try {
      await bot.telegram.editMessageText(
        Number(bet.chatId),
        Number(bet.messageId),
        undefined,
        "❌ *Prediction Cancelled*\n\nDeposited funds have been refunded.",
        { parse_mode: "Markdown" }
      )
    } catch (err) {
      console.error("👁 Failed to update Telegram for BetCancelled:", err)
    }
  }

  // Send new notification to group
  try {
    await bot.telegram.sendMessage(
      Number(bet.chatId),
      [
        "❌ *Prediction Cancelled — Deposit Timeout*",
        "",
        `📊 ${bet.asset} | 💰 ${bet.amount} USDC`,
        `@${p1Name}: ${p1Status}`,
        `@${p2Name}: ${p2Status}`,
        "",
        "💸 All deposited funds have been refunded on\\-chain\\.",
      ].join("\n"),
      { parse_mode: "MarkdownV2" }
    )
  } catch (_) {
    // Fallback to plain text if MarkdownV2 fails
    try {
      await bot.telegram.sendMessage(
        Number(bet.chatId),
        `❌ Prediction Cancelled — Deposit Timeout\n\n📊 ${bet.asset} | 💰 ${bet.amount} USDC\n@${p1Name}: ${p1Status}\n@${p2Name}: ${p2Status}\n\n💸 All deposited funds have been refunded on-chain.`
      )
    } catch (__) {}
  }
}

// --- Utils ---

function formatDurationShort(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`
  return `${Math.round(seconds / 86400)}d`
}

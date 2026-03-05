import express from "express"
import cors from "cors"
import { prisma } from "./db"
import { getPriceFeed, createBetOnChain } from "./services/blockchain"
import { bot } from "./bot"
import { config } from "./config"

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"

export const app = express()
app.use(cors())
app.use(express.json())

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" })
})

// Get bet by ID
app.get("/api/bet/:id", async (req, res) => {
  try {
    const bet = await prisma.bet.findUnique({
      where: { id: parseInt(req.params.id) },
    })
    if (!bet) {
      res.status(404).json({ error: "Bet not found" })
      return
    }
    // Serialize BigInt fields to string
    res.json(serializeBet(bet))
  } catch (err) {
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get user's bets
app.get("/api/user/:tgId/bets", async (req, res) => {
  try {
    const tgId = BigInt(req.params.tgId)
    const bets = await prisma.bet.findMany({
      where: { OR: [{ p1TgId: tgId }, { p2TgId: tgId }] },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
    res.json(bets.map(serializeBet))
  } catch (err) {
    res.status(500).json({ error: "Internal server error" })
  }
})

// Check if asset is supported
app.get("/api/asset/:asset", async (req, res) => {
  try {
    const asset = decodeURIComponent(req.params.asset)
    const feed = await getPriceFeed(asset)
    const supported = feed !== "0x0000000000000000000000000000000000000000"
    res.json({ asset, supported, priceFeed: feed })
  } catch (err) {
    res.status(500).json({ error: "Internal server error" })
  }
})

// Settlement status webhook (called by CRE workflow or external service)
app.post("/api/webhook/settlement", async (req, res) => {
  try {
    const { betId, contractAddress, status, winner, txHash } = req.body

    if (!betId && !contractAddress) {
      res.status(400).json({ error: "betId or contractAddress required" })
      return
    }

    const where = betId
      ? { betId: parseInt(betId) }
      : { contractAddress: String(contractAddress) }

    const bet = await prisma.bet.findFirst({ where })
    if (!bet) {
      res.status(404).json({ error: "Bet not found" })
      return
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (winner) updateData.winnerTgId = BigInt(winner)
    if (txHash) updateData.txHash = txHash

    await prisma.bet.update({
      where: { id: bet.id },
      data: updateData,
    })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: "Internal server error" })
  }
})

// Register wallet address for a bet (called from WebApp)
app.get("/api/bet/:id/register-wallet", async (req, res) => {
  try {
    const betId = parseInt(req.params.id)
    const tgId = req.query.tgId as string
    const walletAddress = req.query.walletAddress as string
    
    console.log("Register wallet:", { betId, tgId, walletAddress })

    if (!tgId || !walletAddress) {
      res.status(400).json({ error: "tgId and walletAddress required" })
      return
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      res.status(400).json({ error: "Invalid wallet address" })
      return
    }

    const bet = await prisma.bet.findUnique({ where: { id: betId } })
    if (!bet) {
      res.status(404).json({ error: "Bet not found" })
      return
    }
    if (bet.status !== "ACCEPTED") {
      res.status(400).json({ error: `Bet is not in ACCEPTED state (current: ${bet.status})` })
      return
    }

    const tgIdBigInt = BigInt(tgId)

    // Verify user is a participant
    const isP1 = tgIdBigInt === bet.p1TgId
    const isP2 = bet.p2TgId && tgIdBigInt === bet.p2TgId
    console.log("🔍 register-wallet debug:", {
      tgId,
      tgIdBigInt: tgIdBigInt.toString(),
      p1TgId: bet.p1TgId.toString(),
      p2TgId: bet.p2TgId?.toString(),
      isP1,
      isP2,
      betStatus: bet.status,
    })
    if (!isP1 && !isP2) {
      res.status(403).json({ error: "You are not a participant in this bet" })
      return
    }

    // Save wallet address to user and bet
    await prisma.user.upsert({
      where: { tgId: tgIdBigInt },
      update: { walletAddress },
      create: { tgId: tgIdBigInt, walletAddress },
    })

    const updateData: any = {}
    if (isP1) updateData.p1Address = walletAddress
    if (isP2) updateData.p2Address = walletAddress

    await prisma.bet.update({ where: { id: betId }, data: updateData })

    // Reload bet to check if both wallets are now set
    const updatedBet = await prisma.bet.findUnique({
      where: { id: betId },
      include: { participant1: true, participant2: true },
    })

    // Get usernames for notifications
    const user = await prisma.user.findUnique({ where: { tgId: tgIdBigInt } })
    const username = user?.username || String(tgId)

    if (updatedBet && updatedBet.p1Address && updatedBet.p2Address) {
      // Both wallets registered — create bet on-chain
      res.json({ success: true, bothRegistered: true, creating: true })

      // Fire and forget: create on-chain bet and update Telegram
      handleBothWalletsRegistered(updatedBet).catch((err) =>
        console.error("Failed to create on-chain bet after wallet registration:", err)
      )
    } else {
      // Notify group: first player registered, waiting for the other
      const otherTgId = isP1 ? updatedBet?.p2TgId : updatedBet?.p1TgId
      const otherUser = otherTgId
        ? await prisma.user.findUnique({ where: { tgId: otherTgId } })
        : null
      const otherName = otherUser?.username || (otherTgId ? String(otherTgId) : "opponent")

      try {
        await bot.telegram.sendMessage(
          Number(bet.chatId),
          `✅ @${username} has connected their wallet.\n⏳ Waiting for @${otherName} to connect...`
        )
      } catch (_) {}

      res.json({ success: true, bothRegistered: false })
    }
  } catch (err) {
    console.error("register-wallet error:", err)
    res.status(500).json({ error: "Internal server error" })
  }
})

async function handleBothWalletsRegistered(bet: any) {
  const p1Wallet = bet.p1Address!
  const p2Wallet = bet.p2Address!
  const creatorName = bet.participant1?.username || String(bet.p1TgId)
  const acceptorName = bet.participant2?.username || (bet.p2TgId ? String(bet.p2TgId) : "???")
  const dirP1 = bet.direction === "UP" ? "📈 UP" : "📉 DOWN"
  const dirP2 = bet.direction === "UP" ? "📉 DOWN" : "📈 UP"

  // Update Telegram message: creating...
  try {
    await bot.telegram.editMessageText(
      Number(bet.chatId),
      Number(bet.messageId),
      undefined,
      [
        "✅ *Bet Accepted — Wallets Linked!*",
        "",
        `👤 @${creatorName} (${dirP1}) vs @${acceptorName} (${dirP2})`,
        `📊 ${bet.asset} | 💰 ${bet.amount} USDC | ⏱ ${formatDuration(bet.duration)}`,
        "",
        "⏳ Creating on-chain contract...",
      ].join("\n"),
      { parse_mode: "Markdown" }
    )
  } catch (_) {}

  const result = await createBetOnChain({
    token: USDC_ADDRESS,
    amount: String(bet.amount),
    duration: bet.duration,
    asset: bet.asset,
    participant1: p1Wallet,
    participant2: p2Wallet,
  })

  if (!result.success) {
    try {
      await bot.telegram.editMessageText(
        Number(bet.chatId),
        Number(bet.messageId),
        undefined,
        [
          "❌ *Failed to create on-chain bet*",
          "",
          `Error: ${result.error}`,
          "",
          "Please try again or contact support.",
        ].join("\n"),
        { parse_mode: "Markdown" }
      )
    } catch (_) {}
  }
  // On success, the event listener will pick up BetCreated and update the message with deposit buttons
}

function formatDuration(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hr`
  return `${Math.round(seconds / 86400)} day`
}

// Serialize BigInt fields for JSON response
function serializeBet(bet: any) {
  return {
    ...bet,
    p1TgId: String(bet.p1TgId),
    p2TgId: String(bet.p2TgId),
    chatId: String(bet.chatId),
    messageId: bet.messageId ? String(bet.messageId) : null,
    winnerTgId: bet.winnerTgId ? String(bet.winnerTgId) : null,
    amount: String(bet.amount),
  }
}

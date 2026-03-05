import { prisma } from "../db"
import { settleBetOnChain, cancelBetOnChain, publicClient, BetAbi } from "./blockchain"
import { getAddress } from "viem"

const POLL_INTERVAL_MS = 30_000 // Check every 30 seconds
const DEPOSIT_TIMEOUT_S = 300 // 5 minutes (must match contract DEPOSIT_TIMEOUT)

/**
 * Settlement cron job: periodically checks for:
 * 1. LOCKED bets whose endTime has passed → call settle()
 * 2. CREATED/DEPOSITING bets past deposit timeout → call cancel() for refund
 * The existing event listener in events.ts picks up BetSettled/BetCancelled
 * events and updates Telegram + DB.
 */
export function startSettlementCron() {
  console.log("⚖️ Settlement cron started (every 30s)")

  const run = async () => {
    try {
      await checkAndSettleExpiredBets()
      await checkAndCancelTimedOutDeposits()
    } catch (err) {
      console.error("⚖️ Settlement cron error:", err)
    }
  }

  // Run immediately, then on interval
  run()
  setInterval(run, POLL_INTERVAL_MS)
}

async function checkAndSettleExpiredBets() {
  // Find all LOCKED bets with endTime in the past
  const expiredBets = await prisma.bet.findMany({
    where: {
      status: "LOCKED",
      endTime: { not: null, lte: new Date() },
      contractAddress: { not: null },
    },
  })

  if (expiredBets.length === 0) return

  console.log(`⚖️ Found ${expiredBets.length} expired bet(s) to settle`)

  for (const bet of expiredBets) {
    const addr = bet.contractAddress!

    // Double-check on-chain status before settling
    try {
      const onChainStatus = await publicClient.readContract({
        address: getAddress(addr),
        abi: BetAbi,
        functionName: "status",
      })

      // Status 1 = Locked
      if (onChainStatus !== 1) {
        console.log(`⚖️ Bet #${bet.id} (${addr}): on-chain status is ${onChainStatus}, skipping`)
        continue
      }

      const endTime = await publicClient.readContract({
        address: getAddress(addr),
        abi: BetAbi,
        functionName: "endTime",
      })

      const now = BigInt(Math.floor(Date.now() / 1000))
      if (now < endTime) {
        console.log(`⚖️ Bet #${bet.id}: not yet expired on-chain (ends ${endTime}), skipping`)
        continue
      }
    } catch (err: any) {
      console.error(`⚖️ Bet #${bet.id}: failed to read on-chain state:`, err?.shortMessage || err?.message)
      continue
    }

    // Call settle()
    const result = await settleBetOnChain(addr)

    if (result.success) {
      console.log(`⚖️ Bet #${bet.id} settled successfully: ${result.txHash}`)
    } else {
      console.error(`⚖️ Bet #${bet.id} settlement failed: ${result.error}`)
    }
  }
}

async function checkAndCancelTimedOutDeposits() {
  // Find CREATED or DEPOSITING bets where contract exists but deposit timeout has passed
  // DEPOSIT_TIMEOUT = 30 min from contract creation (createdAt on-chain)
  const cutoff = new Date(Date.now() - DEPOSIT_TIMEOUT_S * 1000)

  const timedOutBets = await prisma.bet.findMany({
    where: {
      status: { in: ["CREATED", "DEPOSITING"] },
      contractAddress: { not: null },
      createdAt: { lte: cutoff },
    },
  })

  if (timedOutBets.length === 0) return

  console.log(`🚫 Found ${timedOutBets.length} deposit-timed-out bet(s) to cancel`)

  for (const bet of timedOutBets) {
    const addr = bet.contractAddress!

    // Verify on-chain status is still Created (0)
    try {
      const onChainStatus = await publicClient.readContract({
        address: getAddress(addr),
        abi: BetAbi,
        functionName: "status",
      })

      // Status 0 = Created (deposits still open)
      if (onChainStatus !== 0) {
        console.log(`🚫 Bet #${bet.id} (${addr}): on-chain status is ${onChainStatus}, skipping cancel`)
        continue
      }
    } catch (err: any) {
      console.error(`🚫 Bet #${bet.id}: failed to read on-chain state:`, err?.shortMessage || err?.message)
      continue
    }

    const result = await cancelBetOnChain(addr)

    if (result.success) {
      console.log(`🚫 Bet #${bet.id} cancelled (deposit timeout): ${result.txHash}`)
    } else {
      console.error(`🚫 Bet #${bet.id} cancel failed: ${result.error}`)
    }
  }
}

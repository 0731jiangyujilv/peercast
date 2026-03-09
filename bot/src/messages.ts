import type { ParsedBetIntent } from "./services/openai"

export function welcomeMessage(): string {
  return [
    "🎲 *PeerCast — 1v1 Crypto Prediction*",
    "",
    "Instant crypto price predictions in group chats!",
    "",
    "📝 *Create a prediction:*",
    "Mention me with your prediction description, e.g.:",
    '`@chatutu_bot peercast @alice 100 BTC 5m up`',
    '`@chatutu_bot peercast @bob 50 LINK 1h down`',
    "",
    "📋 *Commands:*",
    "/start — Welcome",
    "/stat — Statistics",
    "/rules — Prediction rules",
    "/mybets — My active predictions",
    "/help — Help",
    "",
    "⚡ Powered by Chainlink Data Feeds",
  ].join("\n")
}

export function rulesMessage(): string {
  return [
    "📜 *Prediction Rules*",
    "",
    "1️⃣ *Supported assets:* BTC/USD, LINK/USD",
    "2️⃣ *Wager token:* USDC",
    "3️⃣ *Duration:* 3 minutes ~ 7 days",
    "4️⃣ *Direction:* Creator picks UP or DOWN",
    "",
    "🔄 *Flow:*",
    "1. Creator proposes a prediction",
    "2. Opponent accepts the challenge",
    "3. Both deposit wager on-chain",
    "4. Chainlink records the start price",
    "5. Chainlink auto-settles at expiry",
    "",
    "💰 *Winner takes all (2x)*",
    "📊 *Price unchanged = refund both*",
    "",
    "⚠️ *Security:*",
    "• All fund logic is on-chain and immutable",
    "• Prices from Chainlink decentralized oracles",
    "• Bot only coordinates, never holds funds",
  ].join("\n")
}

export function helpMessage(): string {
  return [
    "❓ *Help*",
    "",
    "🗣 *Natural language predictions:*",
    "Mention me in a group chat with your prediction description:",
    "/mybets — View your active predictions",
    "/help — Show this help",
    "",
    "*Statistics Commands:*",
    "/stats — Platform statistics",
    "/activebets — Current active predictions",
    "/history — Historical prediction results",
    "/ranking — Profit leaderboard (verified by Chainlink PoR)",
    "",
    "🔗 *Web Interface:*",
    "View full stats and leaderboard with on-chain verification",
  ].join("\n")
}

export function betProposalMessage(
  creatorUsername: string,
  opponentUsername: string,
  intent: ParsedBetIntent
): string {
  const dir = intent.direction === "UP" ? "📈 UP" : "📉 DOWN"
  return [
    "🎯 *New Prediction Proposal*",
    "",
    `👤 Creator: @${creatorUsername} (${dir})`,
    `👤 Opponent: @${opponentUsername} (${intent.direction === "UP" ? "📉 DOWN" : "📈 UP"})`,
    `💰 Wager: ${intent.amount} USDC`,
    `📊 Asset: ${intent.asset}`,
    `⏱ Duration: ${intent.durationText}`,
    "",
    `@${opponentUsername} do you accept the challenge?`,
  ].join("\n")
}

export function betAcceptedMessage(
  creatorUsername: string,
  opponentUsername: string,
  asset: string,
  amount: number
): string {
  return [
    "✅ *Prediction Accepted!*",
    "",
    `👤 ${creatorUsername} vs ${opponentUsername}`,
    `📊 ${asset} | 💰 ${amount} USDC`,
    "",
    "Both players please deposit your wager 👇",
  ].join("\n")
}

export function betLockedMessage(
  asset: string,
  startPrice: string,
  endTimeStr: string
): string {
  return [
    "🔒 *Prediction Locked!*",
    "",
    `📊 Asset: ${asset}`,
    `💹 Start price: $${startPrice}`,
    `⏰ Settlement: ${endTimeStr}`,
    "",
    "Waiting for Chainlink auto-settlement...",
  ].join("\n")
}

export function betSettledMessage(
  winnerUsername: string,
  asset: string,
  startPrice: string,
  endPrice: string,
  amount: number
): string {
  return [
    "🏆 *Prediction Settled!*",
    "",
    `🎉 Winner: @${winnerUsername}`,
    `💰 Won: ${amount * 2} USDC`,
    `📊 ${asset}: $${startPrice} → $${endPrice}`,
  ].join("\n")
}

export function betRefundMessage(asset: string, price: string): string {
  return [
    "🤝 *Price Unchanged — Refund*",
    "",
    `📊 ${asset}: $${price}`,
    "Both wagers have been refunded.",
  ].join("\n")
}

export function parseConfirmMessage(intent: ParsedBetIntent): string {
  const lines = ["🤖 *I understood you want to:*", ""]

  if (intent.opponent) lines.push(`👤 Opponent: @${intent.opponent}`)
  if (intent.asset) lines.push(`📊 Asset: ${intent.asset}`)
  if (intent.amount) lines.push(`💰 Wager: ${intent.amount} USDC`)
  if (intent.durationText) lines.push(`⏱ Duration: ${intent.durationText}`)
  if (intent.direction) lines.push(`📈 Direction: ${intent.direction}`)

  if (intent.error) {
    lines.push("")
    lines.push(`⚠️ ${intent.error}`)
  }

  return lines.join("\n")
}

export function noBetsMessage(): string {
  return "📭 You have no active predictions."
}

export function statsMessage(
  activeBets: number,
  totalBets: number,
  totalVolume: string,
  settledBets: number,
  webappUrl: string
): string {
  return [
    "📊 *Platform Statistics*",
    "",
    `🎲 Active predictions: ${activeBets}`,
    `📈 Total predictions: ${totalBets}`,
    `💰 Total Volume: ${parseFloat(totalVolume).toFixed(2)} USDC`,
    `✅ Settled predictions: ${settledBets}`,
    "",
    `🌐 [View detailed stats](${webappUrl}/stats)`,
  ].join("\n")
}

export function activeBetsMessage(
  bets: Array<{ id: number; asset: string; amount: string; status: string; p1Username: string | null; p2Username: string | null }>,
  totalWagered: string,
  webappUrl: string
): string {
  if (bets.length === 0) {
    return "📭 No active predictions at the moment."
  }

  const lines = [
    "🎲 *Active Predictions*",
    "",
    `💰 Total Wagered: ${totalWagered} USDC`,
    "",
  ]

  bets.slice(0, 5).forEach((bet) => {
    const p1 = bet.p1Username || "Unknown"
    const p2 = bet.p2Username || "Waiting..."
    const statusEmoji =
      bet.status === "PROPOSED" ? "📝" :
      bet.status === "ACCEPTED" ? "✅" :
      bet.status === "CREATED" ? "📄" :
      bet.status === "DEPOSITING" ? "💳" :
      bet.status === "LOCKED" ? "🔒" : "❓"
    
    lines.push(`${statusEmoji} #${bet.id} | ${bet.asset} | ${parseFloat(bet.amount).toFixed(2)} USDC`)
    lines.push(`   @${p1} vs @${p2}`)
  })

  if (bets.length > 5) {
    lines.push("")
    lines.push(`... and ${bets.length - 5} more`)
  }

  lines.push("")
  lines.push(`🌐 [View all active predictions](${webappUrl}/stats)`)

  return lines.join("\n")
}

export function historyMessage(
  bets: Array<{
    id: number
    asset: string
    amount: string
    status: string
    p1Username: string | null
    p2Username: string | null
    winnerUsername: string | null
    startPrice: string | null
    endPrice: string | null
  }>,
  webappUrl: string
): string {
  if (bets.length === 0) {
    return "📭 No historical predictions found."
  }

  const lines = [
    "📜 *Prediction History*",
    "",
  ]

  bets.slice(0, 5).forEach((bet) => {
    const p1 = bet.p1Username || "Unknown"
    const p2 = bet.p2Username || "Unknown"
    const winner = bet.winnerUsername || "Draw"
    const statusEmoji = bet.status === "SETTLED" ? "✅" : "❌"
    
    lines.push(`${statusEmoji} #${bet.id} | ${bet.asset} | ${parseFloat(bet.amount).toFixed(2)} USDC`)
    lines.push(`   @${p1} vs @${p2}`)
    
    if (bet.status === "SETTLED" && bet.startPrice && bet.endPrice) {
      lines.push(`   $${bet.startPrice} → $${bet.endPrice} | Winner: @${winner}`)
    } else {
      lines.push(`   Status: ${bet.status}`)
    }
    lines.push("")
  })

  if (bets.length > 5) {
    lines.push(`... and ${bets.length - 5} more`)
    lines.push("")
  }

  lines.push(`🌐 [View full history](${webappUrl}/stats)`)

  return lines.join("\n")
}

export function leaderboardMessage(
  leaderboard: Array<{
    username: string
    wins: number
    losses: number
    totalProfit: string
    winRate: number
    totalBets: number
  }>,
  webappUrl: string
): string {
  if (leaderboard.length === 0) {
    return "📭 No leaderboard data available yet."
  }

  const lines = [
    "🏆 *Profit Leaderboard*",
    "",
  ]

  leaderboard.forEach((entry, index) => {
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`
    const profit = parseFloat(entry.totalProfit)
    const profitEmoji = profit > 0 ? "📈" : profit < 0 ? "📉" : "➖"
    
    lines.push(`${medal} @${entry.username}`)
    lines.push(`   ${profitEmoji} Profit: ${entry.totalProfit} USDC`)
    lines.push(`   📊 W/L: ${entry.wins}/${entry.losses} (${entry.winRate.toFixed(1)}%)`)
    lines.push("")
  })

  lines.push(`🌐 [View full leaderboard](${webappUrl}/leaderboard)`)

  return lines.join("\n")
}

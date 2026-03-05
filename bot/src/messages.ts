import type { ParsedBetIntent } from "./services/openai"

export function welcomeMessage(): string {
  return [
    "🎲 *Chatutu — 1v1 Crypto Betting*",
    "",
    "Instant crypto price bets in group chats!",
    "",
    "📝 *Create a bet:*",
    "Mention me with your bet description, e.g.:",
    '`@chatutu_bot bet @alice 100 BTC 5m up`',
    '`@chatutu_bot bet @bob 50 LINK 1h down`',
    "",
    "📋 *Commands:*",
    "/start — Welcome",
    "/rules — Betting rules",
    "/mybets — My active bets",
    "/help — Help",
    "",
    "⚡ Powered by Chainlink Data Feeds",
  ].join("\n")
}

export function rulesMessage(): string {
  return [
    "📜 *Betting Rules*",
    "",
    "1️⃣ *Supported assets:* BTC/USD, LINK/USD",
    "2️⃣ *Wager token:* USDC",
    "3️⃣ *Duration:* 3 minutes ~ 7 days",
    "4️⃣ *Direction:* Creator picks UP or DOWN",
    "",
    "🔄 *Flow:*",
    "1. Creator proposes a bet",
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
    "🗣 *Natural language bets:*",
    "Mention me in a group chat with your bet description:",
    '• `@chatutu_bot bet @user 100 BTC 5m up`',
    '• `@chatutu_bot bet @user 50 LINK 1h down`',
    "",
    "AI will parse your intent and confirm the parameters.",
    "",
    "💳 *Wallet connection:*",
    "Tap the Deposit button to open the WebApp and connect your wallet.",
    "",
    "📊 *View bets:*",
    "/mybets — View your active bets",
  ].join("\n")
}

export function betProposalMessage(
  creatorUsername: string,
  opponentUsername: string,
  intent: ParsedBetIntent
): string {
  const dir = intent.direction === "UP" ? "📈 UP" : "📉 DOWN"
  return [
    "🎯 *New Bet Proposal*",
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
    "✅ *Bet Accepted!*",
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
    "🔒 *Bet Locked!*",
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
    "🏆 *Bet Settled!*",
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
  return "📭 You have no active bets."
}

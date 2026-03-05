import { Telegraf, Markup } from "telegraf"
import type { Context } from "telegraf"
import { config } from "./config"
import { prisma } from "./db"
import { parseBetIntent } from "./services/openai"
import {
  welcomeMessage,
  rulesMessage,
  helpMessage,
  betProposalMessage,
  parseConfirmMessage,
  noBetsMessage,
} from "./messages"

export const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN)

// --- Types ---
interface MentionedUser {
  username: string | null
  userId: number | null
  firstName: string | null
}

// Extract mentioned users from message entities (excluding the bot itself)
function extractMentionedUsers(ctx: Context): MentionedUser[] {
  const msg = ctx.message as any
  if (!msg?.entities || !msg?.text) return []

  const botUsername = ctx.botInfo.username
  const users: MentionedUser[] = []

  for (const entity of msg.entities) {
    if (entity.type === "mention") {
      // @username mention — extract username from text
      const username = msg.text.substring(entity.offset + 1, entity.offset + entity.length)
      if (username.toLowerCase() !== botUsername.toLowerCase()) {
        users.push({ username, userId: null, firstName: null })
      }
    } else if (entity.type === "text_mention" && entity.user) {
      // text_mention — user object available (for users without username)
      if (entity.user.username?.toLowerCase() !== botUsername.toLowerCase()) {
        users.push({
          username: entity.user.username || null,
          userId: entity.user.id,
          firstName: entity.user.first_name || null,
        })
      }
    }
  }

  return users
}

// --- /start ---
bot.start(async (ctx) => {
  await ctx.replyWithMarkdown(welcomeMessage())
})

// --- /rules ---
bot.command("rules", async (ctx) => {
  await ctx.replyWithMarkdown(rulesMessage())
})

// --- /help ---
bot.help(async (ctx) => {
  await ctx.replyWithMarkdown(helpMessage())
})

// --- /mybets ---
bot.command("mybets", async (ctx) => {
  const tgId = BigInt(ctx.from.id)

  const bets = await prisma.bet.findMany({
    where: {
      OR: [{ p1TgId: tgId }, { p2TgId: tgId }],
      status: { notIn: ["SETTLED", "CANCELLED"] },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  if (bets.length === 0) {
    await ctx.replyWithMarkdown(noBetsMessage())
    return
  }

  const lines = ["📋 *Your Active Bets:*", ""]
  for (const bet of bets) {
    const statusEmoji =
      bet.status === "PROPOSED" ? "📝" :
      bet.status === "ACCEPTED" ? "✅" :
      bet.status === "CREATED" ? "📄" :
      bet.status === "DEPOSITING" ? "💳" :
      bet.status === "LOCKED" ? "🔒" : "❓"

    lines.push(`${statusEmoji} #${bet.id} | ${bet.asset} | ${bet.amount} USDC | ${bet.status}`)
  }

  await ctx.replyWithMarkdown(lines.join("\n"))
})

// --- /bet or natural language ---
bot.command("bet", handleBetCommand)
bot.on("text", async (ctx) => {
  const text = ctx.message.text

  // Skip commands
  if (text.startsWith("/")) return

  // Skip very short messages
  if (text.length < 10) return

  // Check if bot is explicitly mentioned — always process
  const botUsername = ctx.botInfo.username
  if (!text.includes(`@${botUsername}`)) return

  // Extract mentioned users (excluding the bot)
  const mentionedUsers = extractMentionedUsers(ctx)

  // Strip the bot mention
  const cleaned = text.replace(`@${botUsername}`, "").trim()
  if (!cleaned) return

  await processBetMessage(ctx, cleaned, mentionedUsers)
})

// --- Callback queries for inline keyboards ---
bot.on("callback_query", async (ctx) => {
  const data = (ctx.callbackQuery as any).data as string | undefined
  if (!data) return

  if (data.startsWith("accept_bet:")) {
    await handleAcceptBet(ctx, data)
  } else if (data.startsWith("reject_bet:")) {
    await handleRejectBet(ctx, data)
  } else if (data.startsWith("confirm_bet:")) {
    await handleConfirmBet(ctx, data)
  } else if (data === "cancel_bet") {
    await handleCancelProposal(ctx)
  }

  await ctx.answerCbQuery()
})

// --- Handlers ---

async function handleBetCommand(ctx: Context) {
  const text = (ctx.message as any)?.text as string
  const parts = text.replace("/bet", "").trim()
  if (!parts) {
    await ctx.replyWithMarkdown(
      "Please describe your bet, e.g.:\n`/bet bet @alice 100 BTC 5m up`"
    )
    return
  }
  const mentionedUsers = extractMentionedUsers(ctx)
  await processBetMessage(ctx, parts, mentionedUsers)
}

async function processBetMessage(ctx: Context, text: string, mentionedUsers: MentionedUser[] = []) {
  const thinking = await ctx.reply("🤖 Analyzing your bet intent...")

  const intent = await parseBetIntent(text)

  // If OpenAI found an opponent name, try to match with a mentioned user entity
  let opponentTgId: number | null = null
  if (intent.opponent && mentionedUsers.length > 0) {
    // Try exact username match first
    const match = mentionedUsers.find(
      (u) => u.username?.toLowerCase() === intent.opponent?.toLowerCase()
    )
    if (match) {
      opponentTgId = match.userId
      if (match.username) intent.opponent = match.username // Use exact casing
    } else if (mentionedUsers.length === 1) {
      // Only one non-bot user mentioned — likely the opponent
      opponentTgId = mentionedUsers[0].userId
      if (mentionedUsers[0].username) intent.opponent = mentionedUsers[0].username
    }
  } else if (!intent.opponent && mentionedUsers.length === 1) {
    // OpenAI didn't find opponent but there's a mentioned user — use them
    opponentTgId = mentionedUsers[0].userId
    intent.opponent = mentionedUsers[0].username || mentionedUsers[0].firstName
  }

  // Validate parsed intent
  if (intent.confidence < 0.5 || !intent.opponent || !intent.asset || !intent.amount || !intent.duration) {
    const missing: string[] = []
    if (!intent.opponent) missing.push("opponent (@username)")
    if (!intent.asset) missing.push("asset (BTC/USD or LINK/USD)")
    if (!intent.amount) missing.push("wager amount")
    if (!intent.duration) missing.push("duration")

    let msg = parseConfirmMessage(intent)
    if (missing.length > 0) {
      msg += `\n\n❌ Missing info: ${missing.join(", ")}`
      msg += "\n\nPlease try again, e.g.:\n`bet @alice 100 BTC 5m up`"
    }

    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      thinking.message_id,
      undefined,
      msg,
      { parse_mode: "Markdown" }
    )
    return
  }

  // Default direction to UP if not specified
  if (!intent.direction) intent.direction = "UP"

  // Ensure creator user exists
  const fromUser = ctx.from!
  await prisma.user.upsert({
    where: { tgId: BigInt(fromUser.id) },
    update: { username: fromUser.username || null },
    create: { tgId: BigInt(fromUser.id), username: fromUser.username || null },
  })

  // If we resolved opponent tgId from entities, upsert them too
  if (opponentTgId) {
    await prisma.user.upsert({
      where: { tgId: BigInt(opponentTgId) },
      update: { username: intent.opponent || null },
      create: { tgId: BigInt(opponentTgId), username: intent.opponent || null },
    })
  }

  // Show confirmation with inline keyboard
  const confirmMsg = parseConfirmMessage(intent)

  // Store bet in DB (callback data too large for inline button)
  const tempBet = await prisma.bet.create({
    data: {
      p1TgId: BigInt(fromUser.id),
      p2TgId: opponentTgId ? BigInt(opponentTgId) : null,
      asset: intent.asset!,
      amount: intent.amount!,
      duration: intent.duration!,
      direction: intent.direction!,
      chatId: BigInt(ctx.chat!.id),
      status: "PROPOSED",
    },
  })

  await ctx.telegram.editMessageText(
    ctx.chat!.id,
    thinking.message_id,
    undefined,
    confirmMsg + "\n\nConfirm this bet?",
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        Markup.button.callback("✅ Confirm", `confirm_bet:${tempBet.id}:${intent.opponent}`),
        Markup.button.callback("❌ Cancel", "cancel_bet"),
      ]),
    }
  )
}

async function handleConfirmBet(ctx: Context, data: string) {
  const parts = data.split(":")
  const betId = parseInt(parts[1])
  const opponentUsername = parts[2]

  const bet = await prisma.bet.findUnique({ where: { id: betId } })
  if (!bet) return

  const fromUser = ctx.callbackQuery!.from
  if (BigInt(fromUser.id) !== bet.p1TgId) return

  // Send the proposal to the group
  const creatorUsername = fromUser.username || String(fromUser.id)

  const proposalMsg = betProposalMessage(
    creatorUsername,
    opponentUsername,
    {
      opponent: opponentUsername,
      asset: bet.asset,
      duration: bet.duration,
      durationText: formatDuration(bet.duration),
      amount: Number(bet.amount),
      direction: bet.direction as "UP" | "DOWN",
      confidence: 1,
      error: null,
    }
  )

  const sent = await ctx.editMessageText(proposalMsg, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      Markup.button.callback("✅ Accept", `accept_bet:${betId}`),
      Markup.button.callback("❌ Reject", `reject_bet:${betId}`),
    ]),
  })

  // Update bet with message ID
  const msgId = (sent as any).message_id
  if (msgId) {
    await prisma.bet.update({
      where: { id: betId },
      data: { messageId: BigInt(msgId) },
    })
  }
}

async function handleAcceptBet(ctx: Context, data: string) {
  const betId = parseInt(data.split(":")[1])
  const bet = await prisma.bet.findUnique({ where: { id: betId } })
  if (!bet || bet.status !== "PROPOSED") return

  const acceptor = ctx.callbackQuery!.from

  // Ensure the acceptor is not the creator
  if (BigInt(acceptor.id) === bet.p1TgId) {
    await ctx.answerCbQuery("You cannot accept your own bet!")
    return
  }

  // Upsert the acceptor
  await prisma.user.upsert({
    where: { tgId: BigInt(acceptor.id) },
    update: { username: acceptor.username || null },
    create: { tgId: BigInt(acceptor.id), username: acceptor.username || null },
  })

  // Update bet with opponent
  await prisma.bet.update({
    where: { id: betId },
    data: {
      p2TgId: BigInt(acceptor.id),
      status: "ACCEPTED",
    },
  })

  const creator = await prisma.user.findUnique({ where: { tgId: bet.p1TgId } })
  const creatorName = creator?.username || String(bet.p1TgId)
  const acceptorName = acceptor.username || String(acceptor.id)
  const dirP1 = bet.direction === "UP" ? "📈 UP" : "📉 DOWN"
  const dirP2 = bet.direction === "UP" ? "📉 DOWN" : "📈 UP"

  // Per-player URLs with tgId (web_app buttons don't work in group chats)
  const p1Url = `${config.WEBAPP_URL}/register/${betId}?tgId=${bet.p1TgId}`
  const p2Url = `${config.WEBAPP_URL}/register/${betId}?tgId=${acceptor.id}`

  await ctx.editMessageText(
    [
      "✅ *Bet Accepted!*",
      "",
      `👤 @${creatorName} (${dirP1}) vs @${acceptorName} (${dirP2})`,
      `📊 ${bet.asset} | 💰 ${bet.amount} USDC | ⏱ ${formatDuration(bet.duration)}`,
      "",
      "🔗 Both players: click your link to connect wallet.",
      "Once both wallets are linked, the contract will be created automatically.",
    ].join("\n"),
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.url(`🔗 @${creatorName}`, p1Url)],
        [Markup.button.url(`🔗 @${acceptorName}`, p2Url)],
      ]),
    }
  )
}

async function handleRejectBet(ctx: Context, data: string) {
  const betId = parseInt(data.split(":")[1])
  const bet = await prisma.bet.findUnique({ where: { id: betId } })
  if (!bet || bet.status !== "PROPOSED") return

  await prisma.bet.update({
    where: { id: betId },
    data: { status: "CANCELLED" },
  })

  await ctx.editMessageText("❌ Bet rejected.")
}

async function handleCancelProposal(ctx: Context) {
  await ctx.editMessageText("❌ Bet cancelled.")
}

// --- Utils ---

function formatDuration(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hr`
  return `${Math.round(seconds / 86400)} day`
}

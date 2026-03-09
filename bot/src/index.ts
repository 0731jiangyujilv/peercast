import { config } from "./config"
import { bot } from "./bot"
import { app } from "./api"
import { prisma } from "./db"
import { startEventListener } from "./services/events"
// import { startSettlementCron } from "./services/settlement"

async function main() {
console.log("🤖 Starting Peercast Bot...")

  // Start Express API server
  app.listen(config.PORT, () => {
    console.log(`📡 API server running on port ${config.PORT}`)
  })

  // Start on-chain event listener
  await startEventListener()

  // Start settlement cron job
  // startSettlementCron()

  // Start Telegram bot (long polling for dev, webhook for prod)
  await bot.launch()
  console.log("✅ Telegram bot started")

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down...`)
    bot.stop(signal)
    await prisma.$disconnect()
    process.exit(0)
  }

  process.once("SIGINT", () => shutdown("SIGINT"))
  process.once("SIGTERM", () => shutdown("SIGTERM"))
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})

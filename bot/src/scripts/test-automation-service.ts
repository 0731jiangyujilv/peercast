/**
 * Test script that directly calls registerAutomationUpkeep from automation.ts
 * Usage: npx tsx src/scripts/test-automation-service.ts <bet_contract_address>
 */
import "dotenv/config"
import { registerAutomationUpkeep } from "../services/automation"

async function main() {
  const betAddress = process.argv[2]
  if (!betAddress) {
    console.error("Usage: npx tsx src/scripts/test-automation-service.ts <bet_contract_address>")
    process.exit(1)
  }

  console.log(`\n🎯 Calling registerAutomationUpkeep("${betAddress}", "Test PeerCast")...\n`)

  const result = await registerAutomationUpkeep(betAddress, "Test PeerCast")

  console.log("\n📋 Result:", JSON.stringify(result, null, 2))

  if (result.success) {
    console.log(`\n✅ Success! Upkeep ID: ${result.upkeepId}`)
    console.log(`   Check: https://automation.chain.link/base-sepolia`)
  } else {
    console.error(`\n❌ Failed: ${result.error}`)
  }

  process.exit(0)
}

main().catch(console.error)

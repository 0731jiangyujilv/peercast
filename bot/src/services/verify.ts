import { exec } from "child_process"
import { config } from "../config"
import path from "path"

/**
 * Verify a Bet contract on Basescan using forge verify-contract.
 * Runs asynchronously in the background — does not block bet creation flow.
 */
export function verifyBetContract(contractAddress: string, constructorArgs: string) {
  if (!config.BASESCAN_API_KEY) {
    console.log("🔍 Skipping verification: no BASESCAN_API_KEY configured")
    return
  }

  const contractsDir = path.resolve(__dirname, "..", "..", config.CONTRACTS_PATH)

  // forge verify-contract requires constructor args in ABI-encoded hex
  const cmd = [
    "forge verify-contract",
    contractAddress,
    "src/Bet.sol:Bet",
    "--chain-id 84532",
    `--etherscan-api-key ${config.BASESCAN_API_KEY}`,
    `--constructor-args ${constructorArgs}`,
    "--watch",
  ].join(" ")

  console.log(`🔍 Verifying Bet contract ${contractAddress}...`)

  exec(cmd, { cwd: contractsDir, timeout: 120_000 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`🔍 Verification failed for ${contractAddress}:`, stderr || error.message)
      return
    }
    console.log(`🔍 Verification succeeded for ${contractAddress}`)
    if (stdout) console.log(stdout.trim())
  })
}

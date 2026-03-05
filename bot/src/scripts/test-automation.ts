/**
 * Manual test script for Chainlink Automation upkeep registration.
 * Usage: npx tsx src/scripts/test-automation.ts <bet_contract_address>
 *
 * Example:
 *   npx tsx src/scripts/test-automation.ts 0x1234...abcd
 */
import "dotenv/config"
import { createPublicClient, createWalletClient, http, getAddress, parseEther, formatEther } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { baseSepolia } from "viem/chains"

const LINK_TOKEN = "0xE4aB69C077896252FAFBD49EFD26B5D171A32410" as const
const AUTOMATION_REGISTRAR = "0xf28D56F3A707E25B71Ce529a21AF388751E1CF2A" as const
const UPKEEP_FUND_AMOUNT = parseEther("1")

const LinkTokenAbi = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const

const RegistrarAbi = [
  {
    type: "function",
    name: "registerUpkeep",
    inputs: [
      {
        name: "requestParams",
        type: "tuple",
        components: [
          { name: "upkeepContract", type: "address" },
          { name: "amount", type: "uint96" },
          { name: "adminAddress", type: "address" },
          { name: "gasLimit", type: "uint32" },
          { name: "triggerType", type: "uint8" },
          { name: "billingToken", type: "address" },
          { name: "name", type: "string" },
          { name: "encryptedEmail", type: "bytes" },
          { name: "checkData", type: "bytes" },
          { name: "triggerConfig", type: "bytes" },
          { name: "offchainConfig", type: "bytes" },
        ],
      },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "payable",
  },
] as const

async function main() {
  const betAddress = process.argv[2]
  if (!betAddress) {
    console.error("Usage: npx tsx src/scripts/test-automation.ts <bet_contract_address>")
    process.exit(1)
  }

  const pk = process.env.OPERATOR_PRIVATE_KEY
  if (!pk) {
    console.error("Missing OPERATOR_PRIVATE_KEY in .env")
    process.exit(1)
  }

  const rpcUrl = process.env.RPC_URL || "https://base-sepolia-public.nodies.app"
  const account = privateKeyToAccount(pk as `0x${string}`)

  const publicClient = createPublicClient({ chain: baseSepolia, transport: http(rpcUrl) })
  const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http(rpcUrl) })

  const betAddr = getAddress(betAddress)
  console.log(`\n🎯 Target Bet contract: ${betAddr}`)
  console.log(`👤 Operator: ${account.address}`)

  // 1. Check LINK balance
  const linkBalance = await publicClient.readContract({
    address: LINK_TOKEN,
    abi: LinkTokenAbi,
    functionName: "balanceOf",
    args: [account.address],
  })
  console.log(`💰 LINK balance: ${formatEther(linkBalance)} LINK`)

  if (linkBalance < UPKEEP_FUND_AMOUNT) {
    console.error(`❌ Insufficient LINK. Need ${formatEther(UPKEEP_FUND_AMOUNT)}, have ${formatEther(linkBalance)}`)
    console.error(`   Get LINK from: https://faucets.chain.link/base-sepolia`)
    process.exit(1)
  }

  // 2. Approve LINK
  console.log(`\n⚡ Step 1: Approving ${formatEther(UPKEEP_FUND_AMOUNT)} LINK to Registrar...`)
  const approveTx = await walletClient.writeContract({
    address: LINK_TOKEN,
    abi: LinkTokenAbi,
    functionName: "approve",
    args: [AUTOMATION_REGISTRAR, UPKEEP_FUND_AMOUNT],
  })
  console.log(`   Tx: ${approveTx}`)
  await publicClient.waitForTransactionReceipt({ hash: approveTx })
  console.log(`   ✅ Approved`)

  // 3. Verify allowance
  const allowance = await publicClient.readContract({
    address: LINK_TOKEN,
    abi: LinkTokenAbi,
    functionName: "allowance",
    args: [account.address, AUTOMATION_REGISTRAR],
  })
  console.log(`   Allowance: ${formatEther(allowance)} LINK`)

  // 4. Register upkeep
  console.log(`\n⚡ Step 2: Registering upkeep...`)
  try {
    const registerTx = await walletClient.writeContract({
      address: AUTOMATION_REGISTRAR,
      abi: RegistrarAbi,
      functionName: "registerUpkeep",
      args: [
        {
          upkeepContract: betAddr,
          amount: UPKEEP_FUND_AMOUNT,
          adminAddress: account.address,
          gasLimit: 500_000,
          triggerType: 0,
          billingToken: LINK_TOKEN,
          name: `Chatutu Test: ${betAddr.slice(0, 10)}`,
          encryptedEmail: "0x" as `0x${string}`,
          checkData: "0x" as `0x${string}`,
          triggerConfig: "0x" as `0x${string}`,
          offchainConfig: "0x" as `0x${string}`,
        },
      ],
    })
    console.log(`   Tx: ${registerTx}`)

    const receipt = await publicClient.waitForTransactionReceipt({ hash: registerTx })
    console.log(`   ✅ Block: ${receipt.blockNumber}, Status: ${receipt.status}`)
    console.log(`   📋 Logs:`)
    for (const log of receipt.logs) {
      console.log(`      - Address: ${log.address}`)
      console.log(`        Topics: ${JSON.stringify(log.topics)}`)
      if (log.data && log.data !== "0x") {
        console.log(`        Data: ${log.data.slice(0, 66)}...`)
      }
    }

    // Try to extract upkeep ID
    const regLog = receipt.logs.find(l => l.address.toLowerCase() === AUTOMATION_REGISTRAR.toLowerCase())
    if (regLog && regLog.topics[1]) {
      console.log(`\n🆔 Upkeep ID: ${BigInt(regLog.topics[1])}`)
    }
  } catch (err: any) {
    console.error(`\n❌ registerUpkeep failed:`)
    console.error(`   Message: ${err?.shortMessage || err?.message}`)
    if (err?.cause) {
      console.error(`   Cause: ${JSON.stringify(err.cause, null, 2).slice(0, 500)}`)
    }
    process.exit(1)
  }

  console.log(`\n✅ Done! Check https://automation.chain.link/base-sepolia`)
}

main().catch(console.error)

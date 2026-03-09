import { getAddress, encodeFunctionData, parseEther } from "viem"
import { walletClient, publicClient } from "./blockchain"
import { config } from "../config"

// Chainlink Automation addresses (Base Sepolia)
const LINK_TOKEN = "0xE4aB69C077896252FAFBD49EFD26B5D171A32410" as const
const AUTOMATION_REGISTRAR = "0xf28D56F3A707E25B71Ce529a21AF388751E1CF2A" as const

// Funding amount per upkeep registration (1 LINK)
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

/**
 * Register a Bet contract as a Chainlink Automation upkeep.
 * This allows Automation nodes to call checkUpkeep/performUpkeep
 * for automatic settlement and deposit timeout cancellation.
 *
 * Requires the operator wallet to have LINK tokens.
 */
export async function registerAutomationUpkeep(
  betContractAddress: string,
  betName: string
): Promise<{ success: boolean; upkeepId?: string; error?: string }> {
  try {
    const betAddr = getAddress(betContractAddress)
    const operatorAddr = walletClient.account.address

    // Check LINK balance
    const linkBalance = await publicClient.readContract({
      address: LINK_TOKEN,
      abi: LinkTokenAbi,
      functionName: "balanceOf",
      args: [operatorAddr],
    })

    if (linkBalance < UPKEEP_FUND_AMOUNT) {
      console.warn(`⚡ Insufficient LINK for upkeep registration. Have: ${linkBalance}, need: ${UPKEEP_FUND_AMOUNT}`)
      return { success: false, error: "Insufficient LINK balance for upkeep registration" }
    }

    // Step 1: Approve LINK to Registrar
    console.log(`⚡ Approving ${UPKEEP_FUND_AMOUNT} LINK to Registrar...`)
    const approveTx = await walletClient.writeContract({
      address: LINK_TOKEN,
      abi: LinkTokenAbi,
      functionName: "approve",
      args: [AUTOMATION_REGISTRAR, UPKEEP_FUND_AMOUNT],
    })

    await publicClient.waitForTransactionReceipt({ hash: approveTx })
    console.log(`⚡ LINK approved: ${approveTx}`)

    // Step 2: Register upkeep (struct params matching AutomationRegistrar2_3)
    console.log(`⚡ Registering upkeep for ${betAddr}...`)
    const registerTx = await walletClient.writeContract({
      address: AUTOMATION_REGISTRAR,
      abi: RegistrarAbi,
      functionName: "registerUpkeep",
      args: [
        {
          upkeepContract: betAddr,
          amount: UPKEEP_FUND_AMOUNT,
          adminAddress: operatorAddr,
          gasLimit: 500_000,
          triggerType: 0,             // Conditional (checkUpkeep-based)
          billingToken: LINK_TOKEN,   // pay in LINK
          name: `PeerCast: ${betName}`,
          encryptedEmail: "0x" as `0x${string}`,
          checkData: "0x" as `0x${string}`,
          triggerConfig: "0x" as `0x${string}`,
          offchainConfig: "0x" as `0x${string}`,
        },
      ],
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash: registerTx })
    console.log(`⚡ Upkeep registered: ${registerTx} (block ${receipt.blockNumber})`)

    // Extract upkeepId from logs if available
    const upkeepId = receipt.logs?.[0]?.topics?.[1] || registerTx
    return { success: true, upkeepId: String(upkeepId) }
  } catch (err: any) {
    const msg = err?.shortMessage || err?.message || String(err)
    console.error(`⚡ Automation registration error:`, msg)
    if (err?.cause?.reason) console.error(`⚡ Revert reason:`, err.cause.reason)
    if (err?.cause?.data) console.error(`⚡ Revert data:`, err.cause.data)
    if (err?.metaMessages) console.error(`⚡ Meta:`, err.metaMessages)
    return { success: false, error: msg }
  }
}

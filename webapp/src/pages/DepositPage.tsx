import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { BET_ABI, ERC20_ABI, USDC_ADDRESS, BetStatus, betStatusLabel } from '@/config/contracts'

import { ConnectWallet } from '@/components/ConnectWallet'
import { BetCard } from '@/components/BetCard'
import { shortenAddress } from '@/lib/utils'

type TxStep = 'idle' | 'approving' | 'approved' | 'depositing' | 'deposited' | 'error'

export function DepositPage() {
  const { contractAddress } = useParams<{ contractAddress: string }>()
  const { address, isConnected } = useAccount()
  const [txStep, setTxStep] = useState<TxStep>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const betAddr = contractAddress as `0x${string}`

  // Read bet info
  const { data: betInfo, refetch: refetchBetInfo } = useReadContract({
    address: betAddr,
    abi: BET_ABI,
    functionName: 'getBetInfo',
  })

  // Read deposit status for both participants
  const p1Addr = betInfo?.participant1
  const p2Addr = betInfo?.participant2

  const { data: depositStatuses, refetch: refetchDeposits } = useReadContracts({
    contracts: [
      {
        address: betAddr,
        abi: BET_ABI,
        functionName: 'hasDeposited',
        args: p1Addr ? [p1Addr] : undefined,
      },
      {
        address: betAddr,
        abi: BET_ABI,
        functionName: 'hasDeposited',
        args: p2Addr ? [p2Addr] : undefined,
      },
    ],
    query: { enabled: !!p1Addr && !!p2Addr },
  })

  const p1Deposited = depositStatuses?.[0]?.result === true
  const p2Deposited = depositStatuses?.[1]?.result === true

  // Read USDC allowance for the bet contract
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, betAddr] : undefined,
    query: { enabled: !!address },
  })

  // Read USDC balance
  const { data: balance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // Check if current user already deposited
  const { data: myDeposited } = useReadContract({
    address: betAddr,
    abi: BET_ABI,
    functionName: 'hasDeposited',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // Approve USDC
  const {
    writeContract: writeApprove,
    data: approveTxHash,
    isPending: isApprovePending,
    error: approveError,
  } = useWriteContract()

  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  })

  // Deposit
  const {
    writeContract: writeDeposit,
    data: depositTxHash,
    isPending: isDepositPending,
    error: depositError,
  } = useWriteContract()

  const { isSuccess: depositConfirmed } = useWaitForTransactionReceipt({
    hash: depositTxHash,
  })

  // State machine effects
  useEffect(() => {
    if (approveConfirmed && txStep === 'approving') {
      setTxStep('approved')
      // Refetch allowance, then auto-deposit
      refetchAllowance().then(() => {
        setTxStep('depositing')
        writeDeposit({
          address: betAddr,
          abi: BET_ABI,
          functionName: 'deposit',
        })
      })
    }
  }, [approveConfirmed]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (depositConfirmed) {
      setTxStep('deposited')
      refetchDeposits()
      refetchBetInfo()
    }
  }, [depositConfirmed, refetchDeposits, refetchBetInfo])

  useEffect(() => {
    if (approveError || depositError) {
      setTxStep('error')
      setErrorMsg((approveError || depositError)?.message || 'Transaction failed')
    }
  }, [approveError, depositError])

  // Derived state
  const betAmount = betInfo?.amount ?? 0n
  const betStatus = betInfo?.status ?? 0
  const isParticipant =
    address &&
    (address.toLowerCase() === p1Addr?.toLowerCase() ||
      address.toLowerCase() === p2Addr?.toLowerCase())
  const needsApproval = allowance !== undefined && allowance < betAmount
  const hasEnoughBalance = balance !== undefined && balance >= betAmount

  function handleApprove() {
    setTxStep('approving')
    setErrorMsg('')
    writeApprove({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [betAddr, betAmount],
    })
  }

  function handleDeposit() {
    setTxStep('depositing')
    setErrorMsg('')
    writeDeposit({
      address: betAddr,
      abi: BET_ABI,
      functionName: 'deposit',
    })
  }

  // --- Render ---
  if (!contractAddress) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <p className="text-red-400">Invalid contract address</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] relative" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Background image - fixed to cover full viewport */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: 'url(/background.png)' }}
      />
      
      <div className="relative z-10 p-4 pb-24 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="relative z-10 space-y-6 py-8">
        <img src="/logo.svg?v=1" alt="Peercast Logo" className="h-16" />
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-white text-2xl mt-1">↗</span>
            <h1 className="text-white text-4xl font-normal">
              a social-native prediction network
            </h1>
          </div>
          
          <p className="text-[#888] text-xl pl-12">
            chat → smart contract → chainlink cre → settlement
          </p>

        </div>
      </div>

      <div className="relative z-10 space-y-4">

      {/* Wallet */}
      <div className="flex justify-center">
        <ConnectWallet />
      </div>

      {/* X402 Static Info Section */}
      <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <span className="text-lg">⚡</span>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-blue-400">Base X402 Deposit System</h2>
            <p className="text-xs text-tg-hint mt-0.5">Powered by Chainlink Runtime Environment</p>
          </div>
        </div>
        
        <div className="rounded-lg bg-black/20 p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-tg-hint">Network</span>
            <span className="text-white font-medium">Base Sepolia</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-tg-hint">Protocol</span>
            <span className="text-white font-medium">X402 CRE</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-tg-hint">Status</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-green-400 font-medium">Active</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-blue-400">X402 Invoice</span>
            <span className="text-xs text-tg-hint">#{Math.floor(Date.now() / 1000)}</span>
          </div>
          
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-tg-hint">Workflow ID</span>
              <span className="text-white font-mono text-[10px]">0x7f3a...9c2e</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tg-hint">Execution Time</span>
              <span className="text-white">~2.3s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tg-hint">Gas Optimized</span>
              <span className="text-green-400">-34%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tg-hint">DON Nodes</span>
              <span className="text-white">7/7</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-white/5">
              <span className="text-tg-hint font-medium">Total Fee</span>
              <span className="text-blue-400 font-medium">0.0012 ETH</span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {!betInfo && (
        <div className="text-center py-8">
          <div className="animate-spin text-2xl">⏳</div>
          <p className="text-sm text-tg-hint mt-2">Loading Peercast info...</p>
        </div>
      )}

      {/* Bet Card */}
      {betInfo && (
        <BetCard
          participant1={betInfo.participant1}
          participant2={betInfo.participant2}
          amount={betInfo.amount}
          duration={betInfo.duration}
          status={betInfo.status}
          startPrice={betInfo.startPrice}
          endPrice={betInfo.endPrice}
          endTime={betInfo.endTime}
          winner={betInfo.winner}
          p1Deposited={p1Deposited}
          p2Deposited={p2Deposited}
          currentAddress={address}
        />
      )}

      {/* Action area */}
      {isConnected && betInfo && (
        <div className="space-y-3">
          {/* Not a participant */}
          {!isParticipant && (
            <div className="rounded-xl bg-yellow-500/10 p-3 text-center text-sm text-yellow-400">
              ⚠️ Your wallet is not a participant in this Peercast.
              {p1Addr && <div className="mt-1 text-xs text-tg-hint">P1: {shortenAddress(p1Addr)}</div>}
              {p2Addr && <div className="text-xs text-tg-hint">P2: {shortenAddress(p2Addr)}</div>}
            </div>
          )}

          {/* Already deposited */}
          {isParticipant && myDeposited && (
            <div className="rounded-xl bg-green-500/10 p-3 text-center text-sm text-green-400">
              ✅ You have already deposited!
              {!p1Deposited || !p2Deposited
                ? '\n⏳ Waiting for the other player...'
                : ''}
            </div>
          )}

          {/* Bet not in Created status */}
          {betStatus !== BetStatus.Created && !myDeposited && isParticipant && (
            <div className="rounded-xl bg-tg-section-bg p-3 text-center text-sm text-tg-hint">
              This Peercast is currently: {betStatusLabel(betStatus)}
            </div>
          )}

          {/* Deposit flow */}
          {isParticipant && !myDeposited && betStatus === BetStatus.Created && (
            <>
              {/* Balance check */}
              {!hasEnoughBalance && (
                <div className="rounded-xl bg-red-500/10 p-3 text-center text-sm text-red-400">
                  ❌ Insufficient USDC balance
                  <div className="text-xs mt-1">
                    Need: {betAmount > 0n ? (Number(betAmount) / 1e6).toFixed(2) : '?'} USDC
                    {balance !== undefined && (
                      <> | Have: {(Number(balance) / 1e6).toFixed(2)} USDC</>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {hasEnoughBalance && txStep === 'idle' && needsApproval && (
                <button
                  onClick={handleApprove}
                  className="w-full rounded-xl bg-tg-button py-3.5 text-sm font-bold text-tg-button-text hover:opacity-90 transition-opacity"
                >
                  Approve & Deposit {betAmount > 0n ? (Number(betAmount) / 1e6).toFixed(2) : ''} USDC
                </button>
              )}

              {hasEnoughBalance && txStep === 'idle' && !needsApproval && (
                <button
                  onClick={handleDeposit}
                  className="w-full rounded-xl bg-tg-button py-3.5 text-sm font-bold text-tg-button-text hover:opacity-90 transition-opacity"
                >
                  Deposit {betAmount > 0n ? (Number(betAmount) / 1e6).toFixed(2) : ''} USDC
                </button>
              )}

              {/* Progress states */}
              {(txStep === 'approving' || isApprovePending) && (
                <div className="rounded-xl bg-blue-500/10 p-3 text-center text-sm text-blue-400">
                  <div className="animate-spin inline-block mr-2">⏳</div>
                  Approving USDC... Confirm in your wallet.
                </div>
              )}

              {(txStep === 'depositing' || isDepositPending) && (
                <div className="rounded-xl bg-blue-500/10 p-3 text-center text-sm text-blue-400">
                  <div className="animate-spin inline-block mr-2">⏳</div>
                  Depositing... Confirm in your wallet.
                </div>
              )}

              {txStep === 'deposited' && (
                <div className="rounded-xl bg-green-500/10 p-3 text-center text-sm text-green-400">
                  ✅ Deposit successful!
                  {depositTxHash && (
                    <a
                      href={`https://sepolia.basescan.org/tx/${depositTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-tg-link mt-1 underline"
                    >
                      View transaction ↗
                    </a>
                  )}
                </div>
              )}

              {txStep === 'error' && (
                <div className="rounded-xl bg-red-500/10 p-3 text-center text-sm text-red-400">
                  ❌ {errorMsg.length > 100 ? errorMsg.slice(0, 100) + '...' : errorMsg}
                  <button
                    onClick={() => { setTxStep('idle'); setErrorMsg('') }}
                    className="block mx-auto mt-2 text-xs text-tg-link underline"
                  >
                    Try again
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-[#888] pt-4">
        <a
          href={`https://sepolia.basescan.org/address/${contractAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#ff4d1f] underline hover:text-white transition-colors"
        >
          View Contract on BaseScan ↗
        </a>
      </div>
      </div>
    </div>
    </div>
  )
}

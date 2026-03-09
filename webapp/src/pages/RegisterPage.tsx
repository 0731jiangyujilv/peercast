import { useParams, useSearchParams } from 'react-router-dom'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useState, useCallback } from 'react'
import { shortenAddress } from '@/lib/utils'

const BOT_API_URL = import.meta.env.VITE_BOT_API_URL || ''

export function RegisterPage() {
  const { betId } = useParams<{ betId: string }>()
  const [searchParams] = useSearchParams()
  const { address, isConnected } = useAccount()
  const { connectors, connect, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()

  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'waiting' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [bothRegistered, setBothRegistered] = useState(false)

  // Get Telegram user ID from URL query param (?tgId=xxx)
  const tgUserId = searchParams.get('tgId')

  const submitWallet = useCallback(async function submitWallet(walletAddress: string) {
    if (!betId || !tgUserId) {
      setErrorMsg('Missing PeerCast ID or Telegram user info')
      setStatus('error')
      return
    }

    setStatus('submitting')
    setErrorMsg('')

    try {
      const params = new URLSearchParams({
        tgId: String(tgUserId),
        walletAddress,
      })
      const res = await fetch(
        `${BOT_API_URL}/api/bet/${betId}/register-wallet?${params}`,
        {
          headers: { 'ngrok-skip-browser-warning': 'true' },
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to register wallet')
        setStatus('error')
        return
      }

      if (data.bothRegistered) {
        setBothRegistered(true)
        setStatus('done')
      } else {
        setStatus('waiting')
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStatus('error')
    }
  }, [betId, tgUserId])

  return (
    <div className="min-h-screen bg-tg-bg text-tg-text p-4 flex flex-col">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <img src="/logo.svg" alt="PeerCast Logo" className="w-32 h-20 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">🔗 Connect Wallet</h1>
          <p className="text-tg-hint text-sm">
            PeerCast #{betId} — Link your wallet to participate
          </p>
        </div>

        {/* No Telegram context */}
        {!tgUserId && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-center">
            <p className="text-red-400 text-sm">
              ⚠️ Please open this page from the Telegram bot.
            </p>
          </div>
        )}

        {/* Wallet connection */}
        {tgUserId && !isConnected && (
          <div className="space-y-3">
            <p className="text-center text-tg-hint text-sm mb-4">
              Connect your wallet to register for this PeerCast
            </p>
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => connect({ connector })}
                disabled={isConnecting}
                className="w-full rounded-xl bg-tg-button px-4 py-4 text-base font-semibold text-tg-button-text hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isConnecting ? 'Connecting...' : `Connect ${connector.name}`}
              </button>
            ))}
          </div>
        )}

        {/* Connected — submitting / status */}
        {tgUserId && isConnected && address && (
          <div className="space-y-4">
            {/* Wallet info */}
            <div className="rounded-2xl bg-tg-secondary-bg p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-tg-hint">Connected Wallet</p>
                <p className="font-mono text-sm font-medium">{shortenAddress(address)}</p>
              </div>
              <button
                onClick={() => { disconnect(); setStatus('idle') }}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Change
              </button>
            </div>

            {/* Status messages */}
            {status === 'submitting' && (
              <div className="rounded-2xl bg-tg-secondary-bg p-6 text-center">
                <div className="animate-pulse text-lg mb-2">⏳</div>
                <p className="text-sm">Registering your wallet...</p>
              </div>
            )}

            {status === 'waiting' && (
              <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/20 p-6 text-center">
                <div className="text-2xl mb-2">✅</div>
                <p className="font-semibold mb-1">Wallet Registered!</p>
                <p className="text-sm text-tg-hint">
                  Waiting for the other player to connect their wallet...
                </p>
                <p className="text-xs text-tg-hint mt-3">
                  You can close this tab and return to Telegram.
                </p>
              </div>
            )}

            {status === 'done' && bothRegistered && (
              <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-6 text-center">
                <div className="text-2xl mb-2">🎉</div>
                <p className="font-semibold mb-1">Both Wallets Linked!</p>
                <p className="text-sm text-tg-hint">
                  Creating on-chain contract now...
                </p>
                <p className="text-xs text-tg-hint mt-3">
                  Return to Telegram — you'll get a deposit link once ready.
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-center">
                <p className="text-red-400 text-sm mb-3">❌ {errorMsg}</p>
                <button
                  onClick={() => submitWallet(address)}
                  className="rounded-xl bg-tg-button px-6 py-3 text-sm font-semibold text-tg-button-text"
                >
                  Retry
                </button>
              </div>
            )}

            {status === 'idle' && (
              <button
                onClick={() => submitWallet(address)}
                className="w-full rounded-xl bg-tg-button px-4 py-4 text-base font-semibold text-tg-button-text hover:opacity-90 transition-opacity"
              >
                Register This Wallet
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

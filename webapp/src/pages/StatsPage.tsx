import { useEffect, useState } from 'react'
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, ActivityIcon, HistoryIcon, DollarSignIcon } from 'lucide-react'
import { createPublicClient, http, formatUnits } from 'viem'
import { baseSepolia } from 'viem/chains'
import { Logo } from '../components/Logo'

interface BetStats {
  activeBetsCount: number
  totalBetsCount: number
  totalVolume: string
  settledBetsCount: number
  cancelledBetsCount: number
}

interface ActiveBet {
  id: number
  asset: string
  amount: string
  status: string
  duration: number
  createdAt: string
  p1Username: string | null
  p2Username: string | null
}

interface HistoricalBet {
  id: number
  asset: string
  amount: string
  status: string
  duration: number
  createdAt: string
  startTime: string | null
  endTime: string | null
  p1Username: string | null
  p2Username: string | null
  winnerUsername: string | null
  startPrice: string | null
  endPrice: string | null
}

interface PoRData {
  totalBets: string
  activeBets: string
  settledBets: string
  totalVolume: string
  topPlayerProfit: string
  isValid: boolean
  timestamp: string
  updateCount: string
}

const API_URL = import.meta.env.VITE_BOT_API_URL || 'http://localhost:3000'
const CHATUTU_POR_ADDRESS = '0x8540A5c408ad4a099025b8EB4549A75619e9A1f0' // Peercast PoR on Base Sepolia

const CHATUTU_POR_ABI = [
  {
    inputs: [],
    name: 'getLatestData',
    outputs: [
      {
        components: [
          { name: 'totalBets', type: 'uint256' },
          { name: 'activeBets', type: 'uint256' },
          { name: 'settledBets', type: 'uint256' },
          { name: 'totalVolume', type: 'uint256' },
          { name: 'topPlayerProfit', type: 'uint256' },
          { name: 'isValid', type: 'bool' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'updateCount', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export function StatsPage() {
  const [stats, setStats] = useState<BetStats | null>(null)
  const [activeBets, setActiveBets] = useState<ActiveBet[]>([])
  const [totalWagered, setTotalWagered] = useState<string>('0')
  const [historicalBets, setHistoricalBets] = useState<HistoricalBet[]>([])
  const [porData, setPorData] = useState<PoRData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'history'>('overview')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const [statsRes, activeRes, historyRes] = await Promise.all([
        fetch(`${API_URL}/api/stats`),
        fetch(`${API_URL}/api/stats/active`),
        fetch(`${API_URL}/api/stats/history?limit=50`),
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
        
        // 从链上读取 PoR 数据
        const client = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        })

        const result = await client.readContract({
          address: CHATUTU_POR_ADDRESS,
          abi: CHATUTU_POR_ABI,
          functionName: 'getLatestData',
        })

        console.log('PoR Data:', result)

        setPorData({
          totalBets: result.totalBets.toString(),
          activeBets: result.activeBets.toString(),
          settledBets: result.settledBets.toString(),
          totalVolume: formatUnits(result.totalVolume, 18),
          topPlayerProfit: formatUnits(result.topPlayerProfit, 18),
          isValid: result.isValid,
          // timestamp 是毫秒，需要除以 1000 转换为秒，然后再乘以 1000 转回毫秒给 Date
          timestamp: new Date(Number(result.timestamp)).toLocaleString(),
          updateCount: result.updateCount.toString(),
        })
      }

      if (activeRes.ok) {
        const data = await activeRes.json()
        setActiveBets(data.bets)
        setTotalWagered(data.totalWagered)
      }

      if (historyRes.ok) {
        const data = await historyRes.json()
        setHistoricalBets(data)
      }
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number): string => {
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    if (seconds < 86400) return `${Math.round(seconds / 3600)}h`
    return `${Math.round(seconds / 86400)}d`
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      PROPOSED: 'bg-yellow-500/20 text-yellow-300',
      ACCEPTED: 'bg-green-500/20 text-green-300',
      CREATED: 'bg-blue-500/20 text-blue-300',
      DEPOSITING: 'bg-purple-500/20 text-purple-300',
      LOCKED: 'bg-orange-500/20 text-orange-300',
      SETTLED: 'bg-green-500/20 text-green-300',
      CANCELLED: 'bg-red-500/20 text-red-300',
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status] || 'bg-gray-500/20 text-gray-300'}`}>
        {status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white text-xl" style={{ fontFamily: 'Arial, sans-serif' }}>Loading statistics...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white relative overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: 'url(/background.png)' }}
      />

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div className="mb-8">
          <Logo />
          <p className="text-[#888] mt-4">Real-time Peercast platform analytics</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[#888] text-sm">Active Peercasts</div>
                <ActivityIcon className="w-5 h-5 text-[#ff4d1f]" />
              </div>
              <div className="text-3xl font-bold">{stats.activeBetsCount}</div>
            </div>

            <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[#888] text-sm">Total Peercasts</div>
                <TrendingUpIcon className="w-5 h-5 text-[#ff4d1f]" />
              </div>
              <div className="text-3xl font-bold">{stats.totalBetsCount}</div>
            </div>

            <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[#888] text-sm">Total Volume</div>
                <DollarSignIcon className="w-5 h-5 text-[#ff4d1f]" />
              </div>
              <div className="text-3xl font-bold">{parseFloat(stats.totalVolume).toFixed(2)}</div>
              <div className="text-[#888] text-xs mt-1">USDC</div>
            </div>

            <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[#888] text-sm">Settled Peercasts</div>
                <HistoryIcon className="w-5 h-5 text-[#ff4d1f]" />
              </div>
              <div className="text-3xl font-bold">{stats.settledBetsCount}</div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex gap-2 border-b border-[#3a3a3a]">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-[#ff4d1f] border-b-2 border-[#ff4d1f]'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'active'
                  ? 'text-[#ff4d1f] border-b-2 border-[#ff4d1f]'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              Active Peercasts ({activeBets.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'history'
                  ? 'text-[#ff4d1f] border-b-2 border-[#ff4d1f]'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              History ({historicalBets.length})
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {porData && (
              <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#ff4d1f]/30">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    🔒 Proof of Reserve
                    {porData.isValid ? (
                      <span className="text-green-400 text-sm">✅ Verified</span>
                    ) : (
                      <span className="text-red-400 text-sm">⚠️ Unverified</span>
                    )}
                  </h2>
                  <div className="text-sm text-[#888]">
                    Powered by Chainlink CRE
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-[#888] text-xs mb-1">Total Peercasts (PoR)</div>
                    <div className="text-xl font-bold">{porData.totalBets}</div>
                  </div>
                  <div>
                    <div className="text-[#888] text-xs mb-1">Active Peercasts (PoR)</div>
                    <div className="text-xl font-bold text-[#ff4d1f]">{porData.activeBets}</div>
                  </div>
                  <div>
                    <div className="text-[#888] text-xs mb-1">Total Volume (PoR)</div>
                    <div className="text-xl font-bold text-green-400">
                      {parseFloat(porData.totalVolume).toFixed(2)} USDC
                    </div>
                  </div>
                  <div>
                    <div className="text-[#888] text-xs mb-1">Last Update</div>
                    <div className="text-sm font-medium">
                      {porData.timestamp}
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-[#888]">
                  Update #{porData.updateCount} | Contract: {CHATUTU_POR_ADDRESS.slice(0, 6)}...{CHATUTU_POR_ADDRESS.slice(-4)}
                </div>
              </div>
            )}

            <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
              <h2 className="text-2xl font-bold mb-4">Platform Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-[#888] text-sm mb-1">Active Wagered Amount</div>
                  <div className="text-2xl font-bold text-green-400">{totalWagered} USDC</div>
                </div>
                <div>
                  <div className="text-[#888] text-sm mb-1">Cancelled Peercasts</div>
                  <div className="text-2xl font-bold text-red-400">{stats?.cancelledBetsCount || 0}</div>
                </div>
              </div>
            </div>

            <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
              <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {activeBets.slice(0, 5).map((bet) => (
                  <div key={bet.id} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">
                        #{bet.id} - {bet.asset}
                      </div>
                      <div className="text-sm text-[#888]">
                        @{bet.p1Username || 'Unknown'} vs @{bet.p2Username || 'Waiting...'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{parseFloat(bet.amount).toFixed(2)} USDC</div>
                      <div className="text-sm">{getStatusBadge(bet.status)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'active' && (
          <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Active Peercasts</h2>
              <div className="text-lg font-medium text-green-400">
                Total: {totalWagered} USDC
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#3a3a3a]">
                    <th className="text-left py-3 px-2">ID</th>
                    <th className="text-left py-3 px-2">Asset</th>
                    <th className="text-left py-3 px-2">Players</th>
                    <th className="text-right py-3 px-2">Amount</th>
                    <th className="text-center py-3 px-2">Duration</th>
                    <th className="text-center py-3 px-2">Status</th>
                    <th className="text-right py-3 px-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {activeBets.map((bet) => (
                    <tr key={bet.id} className="border-b border-[#3a3a3a] hover:bg-[#1a1a1a]">
                      <td className="py-3 px-2">#{bet.id}</td>
                      <td className="py-3 px-2 font-medium">{bet.asset}</td>
                      <td className="py-3 px-2">
                        <div className="text-sm">
                          @{bet.p1Username || 'Unknown'}
                          <br />
                          vs @{bet.p2Username || 'Waiting...'}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-bold">
                        {parseFloat(bet.amount).toFixed(2)} USDC
                      </td>
                      <td className="py-3 px-2 text-center">{formatDuration(bet.duration)}</td>
                      <td className="py-3 px-2 text-center">{getStatusBadge(bet.status)}</td>
                      <td className="py-3 px-2 text-right text-sm text-[#888]">
                        {formatDate(bet.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {activeBets.length === 0 && (
                <div className="text-center py-8 text-[#888]">No active Peercasts at the moment</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
            <h2 className="text-2xl font-bold mb-6">Peercast History</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#3a3a3a]">
                    <th className="text-left py-3 px-2">ID</th>
                    <th className="text-left py-3 px-2">Asset</th>
                    <th className="text-left py-3 px-2">Players</th>
                    <th className="text-right py-3 px-2">Amount</th>
                    <th className="text-center py-3 px-2">Price Change</th>
                    <th className="text-left py-3 px-2">Winner</th>
                    <th className="text-center py-3 px-2">Status</th>
                    <th className="text-right py-3 px-2">Settled</th>
                  </tr>
                </thead>
                <tbody>
                  {historicalBets.map((bet) => {
                    const priceUp = bet.startPrice && bet.endPrice && parseFloat(bet.endPrice) > parseFloat(bet.startPrice)
                    const priceDown = bet.startPrice && bet.endPrice && parseFloat(bet.endPrice) < parseFloat(bet.startPrice)
                    
                    return (
                      <tr key={bet.id} className="border-b border-[#3a3a3a] hover:bg-[#1a1a1a]">
                        <td className="py-3 px-2">#{bet.id}</td>
                        <td className="py-3 px-2 font-medium">{bet.asset}</td>
                        <td className="py-3 px-2">
                          <div className="text-sm">
                            @{bet.p1Username || 'Unknown'}
                            <br />
                            vs @{bet.p2Username || 'Unknown'}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right font-bold">
                          {parseFloat(bet.amount).toFixed(2)} USDC
                        </td>
                        <td className="py-3 px-2 text-center">
                          {bet.startPrice && bet.endPrice ? (
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-sm text-[#888]">${parseFloat(bet.startPrice).toFixed(2)}</span>
                              {priceUp && <ArrowUpIcon className="w-4 h-4 text-green-400" />}
                              {priceDown && <ArrowDownIcon className="w-4 h-4 text-red-400" />}
                              {!priceUp && !priceDown && <span className="text-[#888]">→</span>}
                              <span className="text-sm text-[#888]">${parseFloat(bet.endPrice).toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          {bet.winnerUsername ? (
                            <span className="text-green-400 font-medium">@{bet.winnerUsername}</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">{getStatusBadge(bet.status)}</td>
                        <td className="py-3 px-2 text-right text-sm text-[#888]">
                          {bet.endTime ? formatDate(bet.endTime) : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {historicalBets.length === 0 && (
                <div className="text-center py-8 text-[#888]">No historical Peercasts found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

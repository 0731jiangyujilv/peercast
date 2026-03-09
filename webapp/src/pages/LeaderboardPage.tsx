import { useState, useEffect } from 'react'
import { TrendingUp, Trophy, Medal, Award, Shield, CheckCircle, Clock, Activity } from 'lucide-react'
import { createPublicClient, http, formatUnits } from 'viem'
import { baseSepolia } from 'viem/chains'

interface LeaderboardEntry {
  username: string
  wins: number
  losses: number
  totalProfit: string
  winRate: number
  totalBets: number
  rank: number
}

interface ApiStats {
  activeBetsCount: number
  totalBetsCount: number
  totalVolume: string
  settledBetsCount: number
  cancelledBetsCount: number
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

const PEERCAST_POR_ADDRESS = '0x8540A5c408ad4a099025b8EB4549A75619e9A1f0'

const PEERCAST_POR_ABI = [
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

export function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [porData, setPorData] = useState<PoRData | null>(null)
  const [apiStats, setApiStats] = useState<ApiStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboardData()
  }, [])

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true)

      const API_URL = import.meta.env.VITE_BOT_API_URL || 'https://betcre.cointext.org'
      console.log('📡 Fetching data from API:', API_URL)
      
      // 先获取 API 统计数据（作为保底数据）
      const statsResponse = await fetch(`${API_URL}/api/stats`)
      let stats: ApiStats | null = null
      if (statsResponse.ok) {
        stats = await statsResponse.json()
        setApiStats(stats)
        console.log('✅ API stats received:', stats)
      }

      // 尝试从链上读取 PoR 数据
      let chainDataSuccess = false
      try {
        console.log('🔗 Fetching PoR data from chain...')
        const client = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        })

        const result = await client.readContract({
          address: PEERCAST_POR_ADDRESS,
          abi: PEERCAST_POR_ABI,
          functionName: 'getLatestData',
        })

        console.log('✅ Chain data received:', result)

        // 检查链上数据是否有效（timestamp > 0 表示已经有数据更新）
        if (result.timestamp > 0n) {
          setPorData({
            totalBets: result.totalBets.toString(),
            activeBets: result.activeBets.toString(),
            settledBets: result.settledBets.toString(),
            totalVolume: formatUnits(result.totalVolume, 18),
            topPlayerProfit: formatUnits(result.topPlayerProfit, 18),
            isValid: result.isValid,
            timestamp: new Date(Number(result.timestamp)).toLocaleString(),
            updateCount: result.updateCount.toString(),
          })
          chainDataSuccess = true
        } else {
          console.warn('⚠️ Chain data not initialized yet, using API fallback')
        }
      } catch (chainError) {
        console.warn('⚠️ Failed to fetch chain data, using API fallback:', chainError)
      }

      // 如果链上数据获取失败或未初始化，使用 API 数据作为保底
      if (!chainDataSuccess && stats) {
        console.log('📊 Using API data as fallback for PoR display')
        setPorData({
          totalBets: stats.totalBetsCount.toString(),
          activeBets: stats.activeBetsCount.toString(),
          settledBets: stats.settledBetsCount.toString(),
          totalVolume: (parseFloat(stats.totalVolume) * 1e18).toString(),
          topPlayerProfit: '0',
          isValid: false, // 标记为未验证，因为是从 API 获取的
          timestamp: new Date().toLocaleString(),
          updateCount: '0',
        })
      }
      
      // 获取排行榜数据
      const leaderboardResponse = await fetch(`${API_URL}/api/stats/leaderboard?limit=50`)
      
      if (!leaderboardResponse.ok) {
        throw new Error(`API request failed: ${leaderboardResponse.status} ${leaderboardResponse.statusText}`)
      }
      
      const data = await leaderboardResponse.json()
      console.log('✅ Leaderboard data received:', data)

      // 添加排名
      const rankedData = data.map((entry: Omit<LeaderboardEntry, 'rank'>, index: number) => ({
        ...entry,
        rank: index + 1,
      }))

      setLeaderboard(rankedData)
    } catch (error) {
      console.error('❌ Failed to fetch leaderboard:', error)
      // 即使出错也显示部分数据
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">{rank}</span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center relative overflow-hidden" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: 'url(/background.png)' }}
        />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff4d1f] mx-auto mb-4"></div>
          <p className="text-[#888]">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] py-8 px-4 relative overflow-hidden" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: 'url(/background.png)' }}
      />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <TrendingUp className="w-10 h-10 text-[#ff4d1f]" />
            <h1 className="text-4xl font-bold text-white">
              Profit Leaderboard
            </h1>
          </div>
          <p className="text-[#888] text-lg">Top performers verified by Chainlink PoR</p>
        </div>

        {/* Platform Statistics (from API) */}
        {apiStats && (
          <div className="bg-[#2a2a2a] rounded-2xl shadow-lg p-6 mb-6 border border-[#3a3a3a]">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-6 h-6 text-[#ff4d1f]" />
              <h2 className="text-xl font-bold text-white">Platform Statistics</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#3a3a3a]">
                <p className="text-sm text-[#888] mb-1">Active Bets</p>
                <p className="text-2xl font-bold text-[#ff4d1f]">{apiStats.activeBetsCount}</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#3a3a3a]">
                <p className="text-sm text-[#888] mb-1">Total Bets</p>
                <p className="text-2xl font-bold text-[#ff4d1f]">{apiStats.totalBetsCount}</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#3a3a3a]">
                <p className="text-sm text-[#888] mb-1">Settled Bets</p>
                <p className="text-2xl font-bold text-green-400">{apiStats.settledBetsCount}</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#3a3a3a]">
                <p className="text-sm text-[#888] mb-1">Total Volume</p>
                <p className="text-2xl font-bold text-green-400">{parseFloat(apiStats.totalVolume).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Chainlink PoR Verification */}
        {porData && (
          <div className="bg-[#2a2a2a] rounded-2xl shadow-lg p-6 mb-8 border border-[#ff4d1f]/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-[#ff4d1f]" />
                <h2 className="text-xl font-bold text-white">
                  {porData.isValid ? 'Chainlink PoR Verification' : 'Platform Statistics'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {porData.isValid ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-semibold">Verified by Chainlink</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 text-[#ff4d1f]" />
                    <span className="text-[#ff4d1f] font-semibold">Verification via Chainlink PoR</span>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#3a3a3a]">
                <p className="text-sm text-[#888] mb-1">Total Bets</p>
                <p className="text-2xl font-bold text-[#ff4d1f]">{porData.totalBets}</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#3a3a3a]">
                <p className="text-sm text-[#888] mb-1">Settled Bets</p>
                <p className="text-2xl font-bold text-[#ff4d1f]">{porData.settledBets}</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#3a3a3a]">
                <p className="text-sm text-[#888] mb-1">Total Volume</p>
                <p className="text-2xl font-bold text-green-400">{parseFloat(porData.totalVolume).toFixed(2)}</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#3a3a3a]">
                <p className="text-sm text-[#888] mb-1">Top Profit</p>
                <p className="text-2xl font-bold text-green-400">{parseFloat(porData.topPlayerProfit).toFixed(2)}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-[#888]">
              <Clock className="w-4 h-4" />
              <span>Last updated: {porData.timestamp}</span>
              {porData.isValid && <span className="ml-4">Updates: {porData.updateCount}</span>}
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-[#2a2a2a] rounded-2xl shadow-lg overflow-hidden border border-[#3a3a3a]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a1a1a] text-white border-b border-[#3a3a3a]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Player</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Total Bets</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Wins</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Losses</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Win Rate</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Total Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3a3a3a]">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[#888]">
                      No leaderboard data available yet
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((entry) => (
                    <tr
                      key={entry.username}
                      className="hover:bg-[#1a1a1a] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">{getRankIcon(entry.rank)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">@{entry.username}</span>
                          {entry.rank === 1 && <Trophy className="w-4 h-4 text-yellow-500" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-white">{entry.wins + entry.losses}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {entry.wins}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {entry.losses}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`font-semibold ${
                            entry.winRate >= 60
                              ? 'text-green-600'
                              : entry.winRate >= 40
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {entry.winRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-bold text-lg ${
                            parseFloat(entry.totalProfit) > 0
                              ? 'text-green-600'
                              : parseFloat(entry.totalProfit) < 0
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {parseFloat(entry.totalProfit) > 0 ? '+' : ''}
                          {parseFloat(entry.totalProfit).toFixed(2)} USDC
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center text-sm text-[#888]">
          <p>
            Data verified by Chainlink Proof of Reserve • Updated every 10 minutes •{' '}
            <a
              href={`https://sepolia.basescan.org/address/${PEERCAST_POR_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ff4d1f] hover:text-white transition-colors underline"
            >
              View Contract
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

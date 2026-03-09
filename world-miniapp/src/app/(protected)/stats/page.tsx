'use client';

import { Logo } from '@/components/Logo';
import { ArrowUp, ArrowDown } from 'iconoir-react';
import { useState } from 'react';
import Link from 'next/link';

interface BetStats {
  activeBetsCount: number;
  totalBetsCount: number;
  totalVolume: string;
  settledBetsCount: number;
  cancelledBetsCount: number;
}

interface ActiveBet {
  id: number;
  asset: string;
  amount: string;
  status: string;
  duration: number;
  createdAt: string;
  p1Username: string | null;
  p2Username: string | null;
}

interface HistoricalBet {
  id: number;
  asset: string;
  amount: string;
  status: string;
  duration: number;
  createdAt: string;
  startTime: string | null;
  endTime: string | null;
  p1Username: string | null;
  p2Username: string | null;
  winnerUsername: string | null;
  startPrice: string | null;
  endPrice: string | null;
}

interface PoRData {
  totalBets: string;
  activeBets: string;
  settledBets: string;
  totalVolume: string;
  topPlayerProfit: string;
  isValid: boolean;
  timestamp: string;
  updateCount: string;
}

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'history'>('overview');

  // Mock data
  const stats: BetStats = {
    activeBetsCount: 12,
    totalBetsCount: 156,
    totalVolume: '15420.50',
    settledBetsCount: 132,
    cancelledBetsCount: 12,
  };

  const activeBets: ActiveBet[] = [
    {
      id: 1,
      asset: 'BTC/USD',
      amount: '10.00',
      status: 'LOCKED',
      duration: 300,
      createdAt: new Date(Date.now() - 120000).toISOString(),
      p1Username: 'alice',
      p2Username: 'bob',
    },
    {
      id: 2,
      asset: 'ETH/USD',
      amount: '25.00',
      status: 'DEPOSITING',
      duration: 900,
      createdAt: new Date(Date.now() - 300000).toISOString(),
      p1Username: 'charlie',
      p2Username: 'david',
    },
    {
      id: 3,
      asset: 'LINK/USD',
      amount: '50.00',
      status: 'LOCKED',
      duration: 1800,
      createdAt: new Date(Date.now() - 600000).toISOString(),
      p1Username: 'eve',
      p2Username: 'frank',
    },
    {
      id: 4,
      asset: 'BTC/USD',
      amount: '100.00',
      status: 'CREATED',
      duration: 3600,
      createdAt: new Date(Date.now() - 900000).toISOString(),
      p1Username: 'grace',
      p2Username: null,
    },
    {
      id: 5,
      asset: 'ETH/USD',
      amount: '5.00',
      status: 'LOCKED',
      duration: 300,
      createdAt: new Date(Date.now() - 1200000).toISOString(),
      p1Username: 'henry',
      p2Username: 'iris',
    },
  ];

  const historicalBets: HistoricalBet[] = [
    {
      id: 101,
      asset: 'BTC/USD',
      amount: '10.00',
      status: 'SETTLED',
      duration: 300,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      startTime: new Date(Date.now() - 86400000).toISOString(),
      endTime: new Date(Date.now() - 86100000).toISOString(),
      p1Username: 'alice',
      p2Username: 'bob',
      winnerUsername: 'alice',
      startPrice: '67234.50',
      endPrice: '67456.20',
    },
    {
      id: 102,
      asset: 'ETH/USD',
      amount: '25.00',
      status: 'SETTLED',
      duration: 900,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      startTime: new Date(Date.now() - 172800000).toISOString(),
      endTime: new Date(Date.now() - 171900000).toISOString(),
      p1Username: 'charlie',
      p2Username: 'david',
      winnerUsername: 'david',
      startPrice: '3456.78',
      endPrice: '3423.12',
    },
    {
      id: 103,
      asset: 'LINK/USD',
      amount: '50.00',
      status: 'CANCELLED',
      duration: 1800,
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      startTime: null,
      endTime: null,
      p1Username: 'eve',
      p2Username: 'frank',
      winnerUsername: null,
      startPrice: null,
      endPrice: null,
    },
  ];

  const porData: PoRData = {
    totalBets: '156',
    activeBets: '12',
    settledBets: '132',
    totalVolume: '15420.50',
    topPlayerProfit: '1234.56',
    isValid: true,
    timestamp: new Date().toLocaleString(),
    updateCount: '42',
  };

  const totalWagered = '190.00';

  const formatDuration = (seconds: number): string => {
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
    return `${Math.round(seconds / 86400)}d`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      PROPOSED: 'bg-yellow-500/20 text-yellow-300',
      ACCEPTED: 'bg-green-500/20 text-green-300',
      CREATED: 'bg-blue-500/20 text-blue-300',
      DEPOSITING: 'bg-purple-500/20 text-purple-300',
      LOCKED: 'bg-orange-500/20 text-orange-300',
      SETTLED: 'bg-green-500/20 text-green-300',
      CANCELLED: 'bg-red-500/20 text-red-300',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status] || 'bg-gray-500/20 text-gray-300'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="network-stats" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <circle cx="100" cy="100" r="2" fill="#666" opacity="0.5"/>
              <line x1="100" y1="100" x2="200" y2="50" stroke="#444" strokeWidth="1" opacity="0.3"/>
              <line x1="100" y1="100" x2="150" y2="200" stroke="#444" strokeWidth="1" opacity="0.3"/>
              <line x1="100" y1="100" x2="50" y2="180" stroke="#444" strokeWidth="1" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#network-stats)"/>
        </svg>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div className="mb-8">
          <Logo />
          <p className="text-[#888] mt-4">Real-time Peercast platform analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[#888] text-sm">Active</div>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-3xl font-bold">{stats.activeBetsCount}</div>
          </div>

          <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[#888] text-sm">Total</div>
              <span className="text-2xl">📈</span>
            </div>
            <div className="text-3xl font-bold">{stats.totalBetsCount}</div>
          </div>

          <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[#888] text-sm">Volume</div>
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-3xl font-bold">{parseFloat(stats.totalVolume).toFixed(2)}</div>
            <div className="text-[#888] text-xs mt-1">USDC</div>
          </div>

          <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[#888] text-sm">Settled</div>
              <span className="text-2xl">✅</span>
            </div>
            <div className="text-3xl font-bold">{stats.settledBetsCount}</div>
          </div>
        </div>

        {/* Tabs */}
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
              Active ({activeBets.length})
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* PoR Card */}
            <div className="bg-[#2a2a2a] rounded-xl p-4 md:p-6 border border-[#ff4d1f]/30">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 flex-wrap">
                  🔒 Proof of Reserve
                  {porData.isValid ? (
                    <span className="text-green-400 text-sm">✅ Verified</span>
                  ) : (
                    <span className="text-red-400 text-sm">⚠️ Unverified</span>
                  )}
                </h2>
                <div className="text-xs md:text-sm text-[#888]">
                  Powered by Chainlink CRE
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-[#1a1a1a] rounded-lg p-3">
                  <div className="text-[#888] text-xs mb-2">Total Peercasts</div>
                  <div className="text-lg md:text-xl font-bold">{porData.totalBets}</div>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-3">
                  <div className="text-[#888] text-xs mb-2">Active Peercasts</div>
                  <div className="text-lg md:text-xl font-bold text-[#ff4d1f]">{porData.activeBets}</div>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-3 col-span-2 md:col-span-1">
                  <div className="text-[#888] text-xs mb-2">Total Volume</div>
                  <div className="text-lg md:text-xl font-bold text-green-400">
                    {parseFloat(porData.totalVolume).toFixed(2)} USDC
                  </div>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-3 col-span-2 md:col-span-1">
                  <div className="text-[#888] text-xs mb-2">Last Update</div>
                  <div className="text-xs md:text-sm font-medium break-all">
                    {porData.timestamp}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-xs text-[#888] break-all">
                Update #{porData.updateCount} | Contract: 0x8540A5...9A1f0
              </div>
            </div>

            {/* Platform Overview */}
            <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
              <h2 className="text-2xl font-bold mb-4">Platform Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-[#888] text-sm mb-1">Active Wagered Amount</div>
                  <div className="text-2xl font-bold text-green-400">{totalWagered} USDC</div>
                </div>
                <div>
                  <div className="text-[#888] text-sm mb-1">Cancelled Peercasts</div>
                  <div className="text-2xl font-bold text-red-400">{stats.cancelledBetsCount}</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
              <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {activeBets.slice(0, 5).map((bet) => (
                  <Link
                    key={bet.id}
                    href={`/prediction/${bet.id}`}
                    className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg hover:bg-[#252525] transition-colors"
                  >
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
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Tab */}
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
                      <td className="py-3 px-2">
                        <Link href={`/prediction/${bet.id}`} className="text-[#ff4d1f] hover:underline">
                          #{bet.id}
                        </Link>
                      </td>
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
            </div>
          </div>
        )}

        {/* History Tab */}
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
                    const priceUp = bet.startPrice && bet.endPrice && parseFloat(bet.endPrice) > parseFloat(bet.startPrice);
                    const priceDown = bet.startPrice && bet.endPrice && parseFloat(bet.endPrice) < parseFloat(bet.startPrice);
                    
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
                              {priceUp && <ArrowUp className="w-4 h-4 text-green-400" />}
                              {priceDown && <ArrowDown className="w-4 h-4 text-red-400" />}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-lg bg-[#ff4d1f] px-6 py-3 font-semibold text-white hover:bg-[#ff6a3f] transition-colors"
          >
            Create New Prediction
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { ArrowUp, ArrowDown } from 'iconoir-react';
import { use } from 'react';

export default function PredictionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Mock data
  const mockBet = {
    id: id,
    asset: 'BTC/USD',
    amount: 10,
    duration: 300,
    direction: 'UP',
    participant1: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    participant2: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    status: 'LOCKED',
    startPrice: 67234.50,
    currentPrice: 67456.20,
    endTime: Date.now() + 180000, // 3 minutes from now
    p1Deposited: true,
    p2Deposited: true,
  };

  const priceChange = mockBet.currentPrice - mockBet.startPrice;
  const priceChangePercent = ((priceChange / mockBet.startPrice) * 100).toFixed(2);
  const isWinning = mockBet.direction === 'UP' ? priceChange > 0 : priceChange < 0;

  const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const timeRemaining = Math.max(0, Math.floor((mockBet.endTime - Date.now()) / 1000));
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="min-h-screen bg-[#1a1a1a] relative" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="network-detail" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <circle cx="100" cy="100" r="2" fill="#666" opacity="0.5"/>
              <line x1="100" y1="100" x2="200" y2="50" stroke="#444" strokeWidth="1" opacity="0.3"/>
              <line x1="100" y1="100" x2="150" y2="200" stroke="#444" strokeWidth="1" opacity="0.3"/>
              <line x1="100" y1="100" x2="50" y2="180" stroke="#444" strokeWidth="1" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#network-detail)"/>
        </svg>
      </div>

      <div className="relative z-10 p-4 pb-24 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-6 py-8">
          <Logo size="md" />
          
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

        {/* Base X402 Info Section */}
        <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <span className="text-lg">⚡</span>
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-blue-400">Base X402 Prediction System</h2>
              <p className="text-xs text-gray-400 mt-0.5">Powered by Chainlink Runtime Environment</p>
            </div>
          </div>
          
          <div className="rounded-lg bg-black/20 p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Network</span>
              <span className="text-white font-medium">Base Sepolia</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Protocol</span>
              <span className="text-white font-medium">X402 CRE</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-green-400 font-medium">Active</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-blue-400">X402 Invoice</span>
              <span className="text-xs text-gray-400">#{Math.floor(Date.now() / 1000)}</span>
            </div>
            
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Workflow ID</span>
                <span className="text-white font-mono text-[10px]">0x7f3a...9c2e</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Execution Time</span>
                <span className="text-white">~2.3s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gas Optimized</span>
                <span className="text-green-400">-34%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">DON Nodes</span>
                <span className="text-white">7/7</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-white/5">
                <span className="text-gray-400 font-medium">Total Fee</span>
                <span className="text-blue-400 font-medium">0.0012 ETH</span>
              </div>
            </div>
          </div>
        </div>

        {/* Prediction Card */}
        <div className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4 md:p-6 space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-2xl font-bold text-white">Prediction #{mockBet.id}</h2>
            <span className="px-2 md:px-3 py-1 rounded-lg bg-orange-500/20 text-orange-300 text-xs md:text-sm font-medium">
              {mockBet.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="bg-[#1a1a1a] rounded-lg p-3 md:p-4">
              <div className="text-gray-400 text-xs md:text-sm mb-1">Asset</div>
              <div className="text-white text-base md:text-xl font-bold">{mockBet.asset}</div>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-3 md:p-4">
              <div className="text-gray-400 text-xs md:text-sm mb-1">Direction</div>
              <div className={`text-base md:text-xl font-bold flex items-center gap-2 ${mockBet.direction === 'UP' ? 'text-green-400' : 'text-red-400'}`}>
                {mockBet.direction === 'UP' ? <ArrowUp className="w-4 h-4 md:w-5 md:h-5" /> : <ArrowDown className="w-4 h-4 md:w-5 md:h-5" />}
                {mockBet.direction}
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-3 md:p-4">
            <div className="text-gray-400 text-xs md:text-sm mb-2">Price Movement</div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="text-gray-400 text-xs">Start</div>
                <div className="text-white text-sm md:text-lg font-bold">${mockBet.startPrice.toFixed(2)}</div>
              </div>
              <div className={`text-base md:text-2xl font-bold text-center ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}
                <div className="text-xs md:text-sm">({priceChangePercent}%)</div>
              </div>
              <div className="flex-1 text-right">
                <div className="text-gray-400 text-xs">Current</div>
                <div className="text-white text-sm md:text-lg font-bold">${mockBet.currentPrice.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-3 md:p-4">
            <div className="text-gray-400 text-xs md:text-sm mb-2">Time Remaining</div>
            <div className="text-white text-2xl md:text-3xl font-bold">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="bg-[#1a1a1a] rounded-lg p-3 md:p-4">
              <div className="text-gray-400 text-xs md:text-sm mb-1">Participant 1</div>
              <div className="text-white text-xs md:text-sm font-mono">{shortenAddress(mockBet.participant1)}</div>
              <div className="text-green-400 text-xs mt-1">✅ Deposited</div>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-3 md:p-4">
              <div className="text-gray-400 text-xs md:text-sm mb-1">Participant 2</div>
              <div className="text-white text-xs md:text-sm font-mono">{shortenAddress(mockBet.participant2)}</div>
              <div className="text-green-400 text-xs mt-1">✅ Deposited</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#ff4d1f]/10 to-[#ff4d1f]/5 rounded-lg p-3 md:p-4 border border-[#ff4d1f]/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-xs md:text-sm">Prize Pool</div>
                <div className="text-[#ff4d1f] text-lg md:text-2xl font-bold">{mockBet.amount * 2} USDC</div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-xs md:text-sm">Your Stake</div>
                <div className="text-white text-base md:text-xl font-bold">{mockBet.amount} USDC</div>
              </div>
            </div>
          </div>

          {isWinning ? (
            <div className="bg-green-500/10 rounded-lg p-3 md:p-4 text-center border border-green-500/20">
              <div className="text-green-400 text-base md:text-lg font-bold">🎉 Currently Winning!</div>
              <div className="text-gray-400 text-xs md:text-sm mt-1">Keep watching the price movement</div>
            </div>
          ) : (
            <div className="bg-red-500/10 rounded-lg p-3 md:p-4 text-center border border-red-500/20">
              <div className="text-red-400 text-base md:text-lg font-bold">📉 Currently Losing</div>
              <div className="text-gray-400 text-xs md:text-sm mt-1">Price needs to move {mockBet.direction === 'UP' ? 'up' : 'down'}</div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link
            href="/predictions"
            className="flex-1 text-center rounded-lg border border-[#3a3a3a] bg-[#2a2a2a] px-4 py-3 text-gray-200 hover:bg-[#333] transition-colors"
          >
            View All Predictions
          </Link>
          <Link
            href="/stats"
            className="flex-1 text-center rounded-lg bg-[#ff4d1f] px-4 py-3 font-semibold text-white hover:bg-[#ff6a3f] transition-colors"
          >
            View Statistics
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-[#888] pt-4">
          <a
            href={`https://sepolia.basescan.org/address/0x${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#ff4d1f] underline hover:text-white transition-colors"
          >
            View Contract on BaseScan ↗
          </a>
        </div>
      </div>
    </div>
  );
}

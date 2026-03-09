'use client';

import { Logo } from '@/components/Logo';
import { ArrowUp, ArrowDown, Clock, Plus } from 'iconoir-react';
import { useRouter } from 'next/navigation';

export default function PredictionsPage() {
  const router = useRouter();

  const mockPredictions = [
    {
      id: 1,
      asset: 'BTC/USD',
      amount: 10,
      duration: 300,
      direction: 'UP',
      status: 'waiting',
      participant1: '0x1234...5678',
      participant2: '0x0000...0000',
    },
    {
      id: 2,
      asset: 'ETH/USD',
      amount: 25,
      duration: 600,
      direction: 'DOWN',
      status: 'active',
      participant1: '0x1234...5678',
      participant2: '0x8765...4321',
    },
    {
      id: 3,
      asset: 'LINK/USD',
      amount: 50,
      duration: 1800,
      direction: 'UP',
      status: 'settled',
      participant1: '0x1234...5678',
      participant2: '0xabcd...ef01',
      winner: '0x1234...5678',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'active':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'settled':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'Waiting';
      case 'active':
        return 'Active';
      case 'settled':
        return 'Settled';
      default:
        return 'Cancelled';
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] relative overflow-hidden">
      {/* Network background pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="network-predictions" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <circle cx="100" cy="100" r="2" fill="#666" opacity="0.5"/>
              <line x1="100" y1="100" x2="200" y2="50" stroke="#444" strokeWidth="1" opacity="0.3"/>
              <line x1="100" y1="100" x2="150" y2="200" stroke="#444" strokeWidth="1" opacity="0.3"/>
              <line x1="100" y1="100" x2="50" y2="180" stroke="#444" strokeWidth="1" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#network-predictions)"/>
        </svg>
      </div>

      <div className="relative z-10 p-4" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div className="mb-6">
          <Logo size="md" />
        </div>

        {/* Create Button */}
        <button
          onClick={() => router.push('/create')}
          className="peercast-button-primary w-full flex items-center justify-center gap-2 mb-6"
        >
          <Plus className="w-5 h-5" />
          Create New Prediction
        </button>

        {/* Stats Card */}
        <div className="peercast-card mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[#ff4d1f]">2</div>
              <div className="text-xs text-[#888]">Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#ff4d1f]">5</div>
              <div className="text-xs text-[#888]">Won</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#ff4d1f]">120</div>
              <div className="text-xs text-[#888]">USDC</div>
            </div>
          </div>
        </div>

        {/* Predictions List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white mb-4">
            Your Predictions
          </h2>

          {mockPredictions.length === 0 ? (
            <div className="text-center py-12 text-[#888]">
              <div className="text-4xl mb-2">🎯</div>
              <div className="text-sm">No predictions yet</div>
              <div className="text-xs">Create your first prediction to get started!</div>
            </div>
          ) : (
            mockPredictions.map((prediction) => (
              <button
                key={prediction.id}
                onClick={() => router.push(`/prediction/${prediction.id}`)}
                className="w-full peercast-card text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-lg text-white">{prediction.asset}</div>
                    <div className="text-xs text-[#888]">
                      Prediction #{prediction.id}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(prediction.status)}`}
                  >
                    {getStatusText(prediction.status)}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
                      prediction.direction === 'UP'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {prediction.direction === 'UP' ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                    <span className="text-sm font-bold">
                      {prediction.direction}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[#888]">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {Math.floor(prediction.duration / 60)}m
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {prediction.amount} USDC
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#888]">
                  <span>vs {prediction.participant2}</span>
                  <span className="text-[#ff4d1f] font-semibold">
                    View Details →
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

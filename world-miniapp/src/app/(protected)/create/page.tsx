'use client';

import { Logo } from '@/components/Logo';
import { ArrowUp, ArrowDown, Clock, Dollar } from 'iconoir-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePredictionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    asset: 'BTC/USD',
    amount: 10,
    duration: 300,
    direction: 'UP',
  });

  const assets = ['BTC/USD', 'ETH/USD', 'LINK/USD'];
  const amounts = [1, 5, 10, 25, 50, 100];
  const durations = [
    { label: '5 min', value: 300 },
    { label: '15 min', value: 900 },
    { label: '30 min', value: 1800 },
    { label: '1 hour', value: 3600 },
    { label: '4 hours', value: 14400 },
    { label: '1 day', value: 86400 },
  ];

  const handleCreate = () => {
    // Simulate creation
    const newPredictionId = Math.floor(Math.random() * 1000);
    router.push(`/prediction/${newPredictionId}`);
  };

  return (
    <div style={{color: '#ccc'}} className="min-h-screen bg-[#1a1a1a] relative overflow-hidden">
      {/* Network background pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="network-create" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <circle cx="100" cy="100" r="2" fill="#666" opacity="0.5"/>
              <line x1="100" y1="100" x2="200" y2="50" stroke="#444" strokeWidth="1" opacity="0.3"/>
              <line x1="100" y1="100" x2="150" y2="200" stroke="#444" strokeWidth="1" opacity="0.3"/>
              <line x1="100" y1="100" x2="50" y2="180" stroke="#444" strokeWidth="1" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#network-create)"/>
        </svg>
      </div>

      <div className="relative z-10 p-4" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div className="mb-6">
          <Logo size="md" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-6">Create Prediction</h1>

        <div className="space-y-6">
          {/* Asset Selection */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Select Asset
            </label>
            <div className="grid grid-cols-3 gap-3">
              {assets.map((asset) => (
                <button
                  key={asset}
                  onClick={() => setFormData({ ...formData, asset })}
                  className={`p-3 rounded-lg font-semibold transition-all ${
                    formData.asset === asset
                      ? 'bg-[#ff4d1f] text-white'
                      : 'bg-[#2a2a2a] text-gray-200 hover:bg-[#3a3a3a]'
                  }`}
                >
                  {asset.split('/')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Direction Selection */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Price Direction
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormData({ ...formData, direction: 'UP' })}
                className={`p-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  formData.direction === 'UP'
                    ? 'bg-green-500/20 text-green-300 border-2 border-green-500'
                    : 'bg-[#2a2a2a] text-gray-200 border-2 border-[#3a3a3a] hover:border-green-500/50'
                }`}
              >
                <ArrowUp className="w-5 h-5" />
                UP
              </button>
              <button
                onClick={() => setFormData({ ...formData, direction: 'DOWN' })}
                className={`p-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  formData.direction === 'DOWN'
                    ? 'bg-red-500/20 text-red-300 border-2 border-red-500'
                    : 'bg-[#2a2a2a] text-gray-200 border-2 border-[#3a3a3a] hover:border-red-500/50'
                }`}
              >
                <ArrowDown className="w-5 h-5" />
                DOWN
              </button>
            </div>
          </div>

          {/* Amount Selection */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Stake Amount (USDC)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {amounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setFormData({ ...formData, amount })}
                  className={`p-3 rounded-lg font-semibold transition-all ${
                    formData.amount === amount
                      ? 'bg-[#ff4d1f] text-white'
                      : 'bg-[#2a2a2a] text-gray-200 hover:bg-[#3a3a3a]'
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Duration
            </label>
            <div className="grid grid-cols-3 gap-3">
              {durations.map((dur) => (
                <button
                  key={dur.value}
                  onClick={() => setFormData({ ...formData, duration: dur.value })}
                  className={`p-3 rounded-lg font-semibold transition-all ${
                    formData.duration === dur.value
                      ? 'bg-[#ff4d1f] text-white'
                      : 'bg-[#2a2a2a] text-gray-200 hover:bg-[#3a3a3a]'
                  }`}
                >
                  {dur.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Card */}
          <div className="peercast-card">
            <h3 className="text-base font-semibold text-white mb-3">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Asset:</span>
                <span className="font-bold text-white">{formData.asset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Direction:</span>
                <span className={`font-bold ${formData.direction === 'UP' ? 'text-green-400' : 'text-red-400'}`}>
                  {formData.direction}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Stake:</span>
                <span className="font-bold text-white">{formData.amount} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Duration:</span>
                <span className="font-bold text-white">
                  {durations.find(d => d.value === formData.duration)?.label}
                </span>
              </div>
              <div className="flex justify-between text-[#ff4d1f] pt-2 border-t border-[#3a3a3a]">
                <span className="font-bold">Prize Pool:</span>
                <span className="font-bold">{formData.amount * 2} USDC</span>
              </div>
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreate}
            className="peercast-button-primary w-full text-lg"
          >
            Create Prediction
          </button>

          <button
            onClick={() => router.push('/predictions')}
            className="peercast-button-secondary w-full"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

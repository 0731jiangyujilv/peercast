'use client';

import { Page } from '@/components/PageLayout';
import { PredictionStatus } from '@/types/prediction';
import { Button, TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import { Plus, ArrowUp, ArrowDown, Clock } from 'iconoir-react';
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
      status: PredictionStatus.Created,
      participant1: '0x1234...5678',
      participant2: '0x0000...0000',
    },
    {
      id: 2,
      asset: 'ETH/USD',
      amount: 25,
      duration: 600,
      direction: 'DOWN',
      status: PredictionStatus.Locked,
      participant1: '0x1234...5678',
      participant2: '0x8765...4321',
    },
  ];

  const getStatusColor = (status: PredictionStatus) => {
    switch (status) {
      case PredictionStatus.Created:
        return 'bg-yellow-100 text-yellow-700';
      case PredictionStatus.Locked:
        return 'bg-blue-100 text-blue-700';
      case PredictionStatus.Settled:
        return 'bg-green-100 text-green-700';
      case PredictionStatus.Cancelled:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: PredictionStatus) => {
    switch (status) {
      case PredictionStatus.Created:
        return 'Waiting';
      case PredictionStatus.Locked:
        return 'Active';
      case PredictionStatus.Settled:
        return 'Settled';
      case PredictionStatus.Cancelled:
        return 'Cancelled';
    }
  };

  return (
    <>
      <Page.Header className="p-0">
        <TopBar title="PeerCast" />
      </Page.Header>
      <Page.Main className="flex flex-col gap-4 mb-16 p-4">
        {/* Create Button */}
        <Button
          onClick={() => router.push('/create')}
          size="lg"
          variant="primary"
          className="w-full flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create New Prediction
        </Button>

        {/* Stats Card */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600">2</div>
              <div className="text-xs text-gray-600">Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">5</div>
              <div className="text-xs text-gray-600">Won</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">120</div>
              <div className="text-xs text-gray-600">USDC</div>
            </div>
          </div>
        </div>

        {/* Predictions List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Your Predictions
          </h2>

          {mockPredictions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">🎯</div>
              <div className="text-sm">No predictions yet</div>
              <div className="text-xs">Create your first prediction to get started!</div>
            </div>
          ) : (
            mockPredictions.map((prediction) => (
              <button
                key={prediction.id}
                onClick={() => router.push(`/prediction/${prediction.id}`)}
                className="w-full bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-lg">{prediction.asset}</div>
                    <div className="text-xs text-gray-500">
                      Prediction #{prediction.id}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(prediction.status)}`}
                  >
                    {getStatusText(prediction.status)}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
                      prediction.direction === 'UP'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
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
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {Math.floor(prediction.duration / 60)}m
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-gray-700">
                    {prediction.amount} USDC
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>vs {prediction.participant2}</span>
                  <span className="text-blue-600 font-semibold">
                    View Details →
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </Page.Main>
    </>
  );
}

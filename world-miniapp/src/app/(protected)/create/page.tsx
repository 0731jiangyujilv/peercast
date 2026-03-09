'use client';

import { Page } from '@/components/PageLayout';
import { BET_AMOUNTS, DURATIONS, SUPPORTED_ASSETS } from '@/config/contracts';
import { PredictionDirection } from '@/types/prediction';
import { Button, TopBar, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { ArrowUp, ArrowDown, Clock, Dollar } from 'iconoir-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPredictionOnChain, sharePrediction } from '@/lib/blockchain';
import { useSession } from 'next-auth/react';

export default function CreatePredictionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    asset: 'BTC/USD',
    amount: 10,
    duration: 300,
    direction: PredictionDirection.UP,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [buttonState, setButtonState] = useState<'pending' | 'success' | 'failed' | undefined>(undefined);

  const handleCreate = async () => {
    if (!session?.user?.walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    setIsCreating(true);
    setButtonState('pending');

    try {
      const { betId } = await createPredictionOnChain(
        {
          asset: formData.asset,
          amount: formData.amount,
          duration: formData.duration,
          opponent: '0x0000000000000000000000000000000000000000',
        },
        session.user.walletAddress
      );

      setButtonState('success');
      
      await sharePrediction(betId, formData.asset, formData.direction, formData.amount);
      
      setTimeout(() => {
        router.push(`/prediction/${betId}`);
      }, 1000);
    } catch (error) {
      console.error('Failed to create prediction:', error);
      setButtonState('failed');
      setTimeout(() => {
        setButtonState(undefined);
        setIsCreating(false);
      }, 3000);
    }
  };

  const selectedAsset = SUPPORTED_ASSETS.find((a) => a.symbol === formData.asset);

  return (
    <>
      <Page.Header className="p-0">
        <TopBar title="Create Prediction" />
      </Page.Header>
      <Page.Main className="flex flex-col gap-6 mb-16 p-4">
        {/* Asset Selection */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700">
            Select Asset
          </label>
          <div className="grid grid-cols-3 gap-3">
            {SUPPORTED_ASSETS.map((asset) => (
              <button
                key={asset.symbol}
                onClick={() => setFormData({ ...formData, asset: asset.symbol })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.asset === asset.symbol
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{asset.icon}</div>
                <div className="text-xs font-semibold">{asset.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Direction Selection */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700">
            Your Prediction
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() =>
                setFormData({ ...formData, direction: PredictionDirection.UP })
              }
              className={`p-6 rounded-xl border-2 transition-all ${
                formData.direction === PredictionDirection.UP
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <ArrowUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-lg font-bold text-green-600">UP</div>
              <div className="text-xs text-gray-600 mt-1">Price will rise</div>
            </button>
            <button
              onClick={() =>
                setFormData({ ...formData, direction: PredictionDirection.DOWN })
              }
              className={`p-6 rounded-xl border-2 transition-all ${
                formData.direction === PredictionDirection.DOWN
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <ArrowDown className="w-8 h-8 mx-auto mb-2 text-red-600" />
              <div className="text-lg font-bold text-red-600">DOWN</div>
              <div className="text-xs text-gray-600 mt-1">Price will fall</div>
            </button>
          </div>
        </div>

        {/* Amount Selection */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Dollar className="w-4 h-4" />
            Bet Amount
          </label>
          <div className="grid grid-cols-3 gap-2">
            {BET_AMOUNTS.map((amt) => (
              <button
                key={amt.value}
                onClick={() => setFormData({ ...formData, amount: amt.value })}
                className={`p-3 rounded-lg border-2 transition-all text-sm font-semibold ${
                  formData.amount === amt.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {amt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration Selection */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Duration
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DURATIONS.slice(0, 6).map((dur) => (
              <button
                key={dur.value}
                onClick={() => setFormData({ ...formData, duration: dur.value })}
                className={`p-3 rounded-lg border-2 transition-all text-sm font-semibold ${
                  formData.duration === dur.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {dur.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
          <div className="text-sm font-semibold text-gray-600 mb-3">
            Prediction Summary
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Asset:</span>
              <span className="font-semibold">
                {selectedAsset?.icon} {selectedAsset?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Direction:</span>
              <span
                className={`font-bold ${
                  formData.direction === PredictionDirection.UP
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {formData.direction}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Your Stake:</span>
              <span className="font-semibold">{formData.amount} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-semibold">
                {DURATIONS.find((d) => d.value === formData.duration)?.label}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-blue-200">
              <span className="text-gray-600">Potential Win:</span>
              <span className="font-bold text-green-600">
                {formData.amount * 2} USDC
              </span>
            </div>
          </div>
        </div>

        {/* Create Button */}
        <LiveFeedback
          label={{
            failed: 'Failed to create',
            pending: 'Creating prediction...',
            success: 'Prediction created!',
          }}
          state={buttonState}
          className="w-full"
        >
          <Button
            onClick={handleCreate}
            size="lg"
            variant="primary"
            className="w-full"
            disabled={isCreating}
          >
            Create Prediction
          </Button>
        </LiveFeedback>

        <p className="text-xs text-gray-500 text-center">
          After creating, you&apos;ll be able to share the prediction link with your
          opponent
        </p>
      </Page.Main>
    </>
  );
}

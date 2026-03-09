'use client';

import { Page } from '@/components/PageLayout';
import { PredictionStatus } from '@/types/prediction';
import { Button, TopBar, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { ArrowUp, ArrowDown, Clock, ShareIos, Check } from 'iconoir-react';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { depositToBet, getBetInfo, sharePrediction } from '@/lib/blockchain';
import { useSession } from 'next-auth/react';

export default function PredictionDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const predictionId = params.id as string;

  const [prediction, setPrediction] = useState({
    id: parseInt(predictionId),
    participant1: '0x1234...5678',
    participant2: '0x0000...0000',
    betContract: '0x0000000000000000000000000000000000000000',
    asset: 'BTC/USD',
    amount: 10,
    duration: 300,
    direction: 'UP',
    status: PredictionStatus.Created,
    createdAt: Date.now(),
  });

  const [hasDeposited, setHasDeposited] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [buttonState, setButtonState] = useState<'pending' | 'success' | 'failed' | undefined>(undefined);

  useEffect(() => {
    const fetchBetInfo = async () => {
      try {
        const info = await getBetInfo(prediction.betContract);
        setPrediction((prev) => ({ ...prev, ...info }));
      } catch (error) {
        console.error('Failed to fetch bet info:', error);
      }
    };

    if (prediction.betContract !== '0x0000000000000000000000000000000000000000') {
      fetchBetInfo();
    }
  }, [prediction.betContract]);

  const handleDeposit = async () => {
    if (!session?.user?.walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    setIsDepositing(true);
    setButtonState('pending');

    try {
      await depositToBet(prediction.betContract, prediction.amount);
      setButtonState('success');
      setHasDeposited(true);
      
      setTimeout(() => {
        setButtonState(undefined);
      }, 3000);
    } catch (error) {
      console.error('Failed to deposit:', error);
      setButtonState('failed');
      setTimeout(() => {
        setButtonState(undefined);
        setIsDepositing(false);
      }, 3000);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await sharePrediction(
        prediction.id,
        prediction.asset,
        prediction.direction,
        prediction.amount
      );
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const getStatusBadge = () => {
    switch (prediction.status) {
      case PredictionStatus.Created:
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
            Waiting for opponent
          </span>
        );
      case PredictionStatus.Locked:
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
            Active
          </span>
        );
      case PredictionStatus.Settled:
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
            Settled
          </span>
        );
      case PredictionStatus.Cancelled:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
            Cancelled
          </span>
        );
    }
  };

  return (
    <>
      <Page.Header className="p-0">
        <TopBar title={`Prediction #${predictionId}`} />
      </Page.Header>
      <Page.Main className="flex flex-col gap-6 mb-16 p-4">
        {/* Status Badge */}
        <div className="flex justify-center">{getStatusBadge()}</div>

        {/* Prediction Card */}
        <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="text-center mb-6">
            <div className="text-sm opacity-80 mb-2">Asset</div>
            <div className="text-3xl font-bold">{prediction.asset}</div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex-1 text-center">
              <div className="text-xs opacity-80 mb-1">Creator predicts</div>
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                  prediction.direction === 'UP'
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
              >
                {prediction.direction === 'UP' ? (
                  <ArrowUp className="w-5 h-5" />
                ) : (
                  <ArrowDown className="w-5 h-5" />
                )}
                <span className="font-bold text-lg">{prediction.direction}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <div className="text-xs opacity-80 mb-1">Stake</div>
              <div className="text-xl font-bold">{prediction.amount} USDC</div>
            </div>
            <div className="text-center">
              <div className="text-xs opacity-80 mb-1">Duration</div>
              <div className="text-xl font-bold flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(prediction.duration)}
              </div>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-3">
            Participants
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <div className="text-xs text-gray-600">Creator (UP)</div>
                <div className="font-mono text-sm">{prediction.participant1}</div>
              </div>
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <div className="text-xs text-gray-600">Opponent (DOWN)</div>
                <div className="font-mono text-sm">
                  {prediction.participant2 === '0x0000...0000'
                    ? 'Waiting...'
                    : prediction.participant2}
                </div>
              </div>
              {hasDeposited && <Check className="w-5 h-5 text-green-600" />}
            </div>
          </div>
        </div>

        {/* Prize Pool */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">Total Prize Pool</div>
            <div className="text-4xl font-bold text-orange-600">
              {prediction.amount * 2} USDC
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Winner takes all (minus 2.5% platform fee)
            </div>
          </div>
        </div>

        {/* Actions */}
        {prediction.status === PredictionStatus.Created && (
          <div className="space-y-3">
            {!hasDeposited && (
              <>
                <LiveFeedback
                  label={{
                    failed: 'Deposit failed',
                    pending: 'Processing deposit...',
                    success: 'Deposit successful!',
                  }}
                  state={buttonState}
                  className="w-full"
                >
                  <Button
                    onClick={handleDeposit}
                    size="lg"
                    variant="primary"
                    className="w-full"
                    disabled={isDepositing}
                  >
                    Accept & Deposit {prediction.amount} USDC
                  </Button>
                </LiveFeedback>
                <p className="text-xs text-gray-500 text-center">
                  You&apos;ll predict DOWN (opposite of creator)
                </p>
              </>
            )}

            <Button
              onClick={handleShare}
              size="lg"
              variant="secondary"
              className="w-full flex items-center justify-center gap-2"
              disabled={isSharing}
            >
              <ShareIos className="w-5 h-5" />
              {isSharing ? 'Sharing...' : 'Share Prediction'}
            </Button>
          </div>
        )}

        {prediction.status === PredictionStatus.Locked && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="text-center">
              <div className="text-sm text-blue-700 font-semibold mb-2">
                🔒 Prediction Locked
              </div>
              <div className="text-xs text-gray-600">
                Waiting for settlement after duration expires...
              </div>
            </div>
          </div>
        )}
      </Page.Main>
    </>
  );
}

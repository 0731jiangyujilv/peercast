import { MiniKit } from '@worldcoin/minikit-js';
import BetABI from '@/abi/Bet.json';
import { CONTRACTS } from '@/config/contracts';

export interface CreatePredictionParams {
  asset: string;
  amount: number;
  duration: number;
  opponent: string;
}

export async function createPredictionOnChain(
  params: CreatePredictionParams,
  userAddress: string
): Promise<{ betId: number; betContract: string }> {
  const amountInWei = BigInt(params.amount * 10 ** 6);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/predictions/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: CONTRACTS.USDC.address,
      amount: amountInWei.toString(),
      duration: params.duration,
      asset: params.asset,
      participant1: userAddress,
      participant2: params.opponent,
      factoryAddress: CONTRACTS.BetFactory.address, // Pass factory address for World Chain
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create prediction');
  }

  const data = await response.json();
  return {
    betId: data.betId,
    betContract: data.betContract,
  };
}

export async function depositToBet(
  betContract: string,
  amount: number
): Promise<string> {
  const amountInWei = BigInt(amount * 10 ** 6);

  const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
    transaction: [
      {
        address: CONTRACTS.USDC.address,
        abi: [
          {
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
            name: 'approve',
            outputs: [{ name: '', type: 'bool' }],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        functionName: 'approve',
        args: [betContract, amountInWei.toString()],
      },
      {
        address: betContract,
        abi: BetABI,
        functionName: 'deposit',
        args: [],
      },
    ],
  });

  if (finalPayload.status !== 'success') {
    throw new Error('Transaction failed');
  }

  return finalPayload.transaction_id;
}

export async function getBetInfo(betContract: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/bets/${betContract}/info`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch bet info');
  }

  return response.json();
}

export async function getUserPredictions(userAddress: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userAddress}/predictions`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch user predictions');
  }

  return response.json();
}

export async function sharePrediction(predictionId: number, asset: string, direction: string, amount: number) {
  const shareUrl = `https://world.org/mini-app?app_id=${process.env.NEXT_PUBLIC_APP_ID}&path=/prediction/${predictionId}`;
  
  await MiniKit.commandsAsync.share({
    title: 'Join my prediction on PeerCast!',
    text: `I predict ${asset} will go ${direction}! Bet ${amount} USDC against me! 🎯`,
    url: shareUrl,
  });
}

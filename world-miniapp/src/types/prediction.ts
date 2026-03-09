export enum PredictionStatus {
  Created = 0,
  Locked = 1,
  Settled = 2,
  Cancelled = 3,
}

export enum PredictionDirection {
  UP = 'UP',
  DOWN = 'DOWN',
}

export interface Prediction {
  id: number;
  betContract: string;
  participant1: string;
  participant2: string;
  token: string;
  amount: string;
  duration: number;
  asset: string;
  startPrice?: string;
  endPrice?: string;
  startTime?: number;
  endTime?: number;
  status: PredictionStatus;
  winner?: string;
  createdAt: number;
}

export interface PredictionFormData {
  asset: string;
  amount: number;
  duration: number;
  opponent?: string;
  direction: PredictionDirection;
}

export interface BetInfo {
  participant1: string;
  participant2: string;
  token: string;
  amount: bigint;
  duration: bigint;
  priceFeed: string;
  startPrice: bigint;
  endPrice: bigint;
  startTime: bigint;
  endTime: bigint;
  status: PredictionStatus;
  winner: string;
  feeBps: bigint;
  feeRecipient: string;
}

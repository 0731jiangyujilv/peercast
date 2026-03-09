export const CONTRACTS = {
  BetFactory: {
    address: process.env.NEXT_PUBLIC_BET_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000',
    abi: [] as const, // Will be populated from ABI files
  },
  USDC: {
    address: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x0000000000000000000000000000000000000000',
    decimals: 6,
  },
} as const;

export const SUPPORTED_ASSETS = [
  { symbol: 'BTC/USD', label: 'Bitcoin', icon: '₿' },
  { symbol: 'ETH/USD', label: 'Ethereum', icon: 'Ξ' },
  { symbol: 'LINK/USD', label: 'Chainlink', icon: '⬡' },
] as const;

export const DURATIONS = [
  { value: 300, label: '5 minutes' },
  { value: 600, label: '10 minutes' },
  { value: 900, label: '15 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 3600, label: '1 hour' },
  { value: 14400, label: '4 hours' },
  { value: 86400, label: '1 day' },
] as const;

export const BET_AMOUNTS = [
  { value: 1, label: '1 USDC' },
  { value: 5, label: '5 USDC' },
  { value: 10, label: '10 USDC' },
  { value: 25, label: '25 USDC' },
  { value: 50, label: '50 USDC' },
  { value: 100, label: '100 USDC' },
] as const;

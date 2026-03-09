#!/bin/bash

# Deploy to World Chain Mainnet
# Usage: ./deploy-worldchain.sh

set -e

echo "🌍 Deploying to World Chain Mainnet..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please copy .env.example to .env and configure it"
    exit 1
fi

# Source environment variables
source .env

# Check required variables
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ PRIVATE_KEY not set in .env"
    exit 1
fi

if [ -z "$OPERATOR_ADDRESS" ]; then
    echo "❌ OPERATOR_ADDRESS not set in .env"
    exit 1
fi

if [ -z "$WORLD_USDC_ADDRESS" ]; then
    echo "❌ WORLD_USDC_ADDRESS not set in .env"
    exit 1
fi

echo "📋 Configuration:"
echo "   Operator: $OPERATOR_ADDRESS"
echo "   USDC: $WORLD_USDC_ADDRESS"
echo "   Fee: ${FEE_BPS:-250} bps"
echo ""

# Deploy
echo "🚀 Deploying BetFactory..."
forge script script/DeployWorldChain.s.sol:DeployWorldChain \
    --rpc-url worldchain_sepolia \
    --broadcast \
    --verify \
    -vvvv

echo ""
echo "✅ Deployment complete!"
echo ""
echo "⚠️  IMPORTANT: Save the BetFactory address and update:"
echo "   1. my-first-mini-app/.env.local"
echo "   2. bot/.env"

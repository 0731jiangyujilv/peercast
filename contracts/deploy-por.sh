#!/bin/bash

# Load environment variables
source .env

# Base Sepolia Forwarder address
FORWARDER="0x82300bd7c3958625581cc2f77bc6464dcecdf3e5"

echo "Deploying PeercastPoR contract..."
echo "Forwarder: $FORWARDER"
echo "RPC: $BASE_SEPOLIA_RPC_URL"

# Deploy using forge create
forge create src/PeercastPoR.sol:PeercastPoR \
  --rpc-url "$BASE_SEPOLIA_RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --constructor-args 0x82300bd7c3958625581cc2f77bc6464dcecdf3e5 \
  --broadcast

echo "Deployment complete!"

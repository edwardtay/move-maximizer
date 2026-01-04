#!/bin/bash

# MoveFlow Deployment Script for Movement Testnet (Porto)
set -e

echo "=========================================="
echo "  MoveFlow Deployment to Movement Testnet"
echo "=========================================="
echo ""

# Movement Porto Testnet Configuration
RPC_URL="https://aptos.testnet.porto.movementlabs.xyz/v1"
FAUCET_URL="https://faucet.movementlabs.xyz"
EXPLORER_URL="https://explorer.movementlabs.xyz"

# Check if aptos CLI is available
if ! command -v aptos &> /dev/null; then
    echo "❌ Aptos CLI not found. Installing..."
    curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
    echo "✅ Aptos CLI installed. Please restart terminal and run this script again."
    exit 1
fi

echo "✅ Aptos CLI found"

# Navigate to contracts directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "📁 Working directory: $(pwd)"

# Initialize account if not exists
if [ ! -f ".aptos/config.yaml" ]; then
    echo ""
    echo "🔑 Initializing new account for Movement Testnet..."
    aptos init --network custom --rest-url "$RPC_URL" --skip-faucet
    echo ""
fi

# Get account address
ACCOUNT_ADDRESS=$(aptos config show-profiles --profile default 2>/dev/null | grep -oP 'account: \K0x[a-fA-F0-9]+' || echo "")

if [ -z "$ACCOUNT_ADDRESS" ]; then
    echo "❌ Could not get account address. Please run: aptos init --network custom --rest-url $RPC_URL"
    exit 1
fi

echo ""
echo "📍 Your deployer address: $ACCOUNT_ADDRESS"
echo ""
echo "💰 Get testnet tokens from faucet:"
echo "   $FAUCET_URL"
echo ""
echo "   1. Go to the faucet URL above"
echo "   2. Select 'Porto Testnet'"
echo "   3. Paste your address: $ACCOUNT_ADDRESS"
echo "   4. Click 'Fund Wallet'"
echo ""
read -p "Press Enter after you've received testnet tokens..."

# Check balance
echo ""
echo "💵 Checking balance..."
BALANCE=$(aptos account balance --profile default 2>/dev/null | grep -oP 'balance: \K[0-9]+' || echo "0")
echo "   Balance: $BALANCE APT"

if [ "$BALANCE" = "0" ]; then
    echo "⚠️  Balance is 0. Please fund your wallet first."
    read -p "Press Enter to continue anyway (or Ctrl+C to cancel)..."
fi

# Compile contracts
echo ""
echo "🔨 Compiling Move modules..."
aptos move compile --named-addresses moveflow=$ACCOUNT_ADDRESS

echo "✅ Compilation successful!"

# Deploy
echo ""
echo "🚀 Deploying to Movement Testnet..."
aptos move publish \
    --named-addresses moveflow=$ACCOUNT_ADDRESS \
    --assume-yes

echo ""
echo "=========================================="
echo "  ✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "📋 Contract Address: $ACCOUNT_ADDRESS"
echo "🔍 Explorer: $EXPLORER_URL/?network=porto+testnet&account=$ACCOUNT_ADDRESS"
echo ""

# Update env files
echo "📝 Updating environment files..."

# Update frontend .env
cat > ../frontend/.env.local << EOF
# Movement Network Configuration (Porto Testnet)
NEXT_PUBLIC_MOVEMENT_RPC=$RPC_URL
NEXT_PUBLIC_MOVEMENT_CHAIN_ID=177
NEXT_PUBLIC_MOVEMENT_EXPLORER=$EXPLORER_URL

# Contract Addresses
NEXT_PUBLIC_CONTRACT_ADDRESS=$ACCOUNT_ADDRESS
NEXT_PUBLIC_VAULT_ADDRESS=$ACCOUNT_ADDRESS
NEXT_PUBLIC_ROUTER_ADDRESS=$ACCOUNT_ADDRESS
NEXT_PUBLIC_REWARDS_ADDRESS=$ACCOUNT_ADDRESS
EOF

echo "✅ Created frontend/.env.local"

# Update bot .env template
cat > ../bot/.env << EOF
# Telegram Bot Token (get from @BotFather)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Anthropic API Key for AI responses
ANTHROPIC_API_KEY=your_anthropic_api_key

# Movement Network Configuration (Porto Testnet)
MOVEMENT_RPC_URL=$RPC_URL
MOVEMENT_CHAIN_ID=177

# Contract Addresses
CONTRACT_ADDRESS=$ACCOUNT_ADDRESS
VAULT_ADDRESS=$ACCOUNT_ADDRESS
ROUTER_ADDRESS=$ACCOUNT_ADDRESS
REWARDS_ADDRESS=$ACCOUNT_ADDRESS
EOF

echo "✅ Created bot/.env"

echo ""
echo "🎉 All done! Next steps:"
echo "   1. cd ../frontend && npm install && npm run dev"
echo "   2. Update bot/.env with your Telegram and Anthropic keys"
echo "   3. cd ../bot && npm install && npm run dev"
echo ""

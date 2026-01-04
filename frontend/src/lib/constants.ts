// Movement Network Configuration
export const MOVEMENT_CONFIG = {
  testnet: {
    name: "Movement Testnet",
    chainId: 250,
    rpc: "https://testnet.movementnetwork.xyz/v1",
    explorer: "https://explorer.movementnetwork.xyz",
    faucet: "https://faucet.movementnetwork.xyz",
    indexer: "https://hasura.testnet.movementnetwork.xyz/v1/graphql",
  },
  mainnet: {
    name: "Movement Mainnet",
    chainId: 126,
    rpc: "https://mainnet.movementnetwork.xyz/v1",
    explorer: "https://explorer.movementnetwork.xyz",
    indexer: "https://indexer.mainnet.movementnetwork.xyz/v1/graphql",
  },
};

// Contract Addresses (update after deployment)
export const CONTRACTS = {
  vault: process.env.NEXT_PUBLIC_VAULT_ADDRESS || "",
  router: process.env.NEXT_PUBLIC_ROUTER_ADDRESS || "",
  rewards: process.env.NEXT_PUBLIC_REWARDS_ADDRESS || "",
};

// Vault configurations
export const VAULTS = [
  {
    id: "move-vault",
    name: "MOVE Maximizer",
    token: "MOVE",
    tokenAddress: "0x1::aptos_coin::AptosCoin",
    strategies: ["Staking", "LP Farming"],
    riskLevel: "Low" as const,
    description: "Optimize your MOVE returns through staking and liquidity provision",
  },
  {
    id: "usdc-vault",
    name: "Stable Yield",
    token: "USDC",
    tokenAddress: "0x...", // Update with actual USDC address
    strategies: ["Lending", "LP"],
    riskLevel: "Low" as const,
    description: "Earn stable yields on USDC through lending protocols",
  },
  {
    id: "eth-vault",
    name: "ETH Optimizer",
    token: "ETH",
    tokenAddress: "0x...", // Update with actual ETH address
    strategies: ["LP Farming", "Lending"],
    riskLevel: "Medium" as const,
    description: "Maximize ETH yields across DeFi protocols",
  },
];

// Fee configuration
export const FEES = {
  performanceFee: 1000, // 10% in basis points
  withdrawalFee: 10, // 0.1% in basis points
  depositFee: 0,
};

// Risk levels
export const RISK_LEVELS = {
  Low: { color: "text-green-500", bgColor: "bg-green-500/10", score: 1-3 },
  Medium: { color: "text-yellow-500", bgColor: "bg-yellow-500/10", score: 4-6 },
  High: { color: "text-red-500", bgColor: "bg-red-500/10", score: 7-10 },
};

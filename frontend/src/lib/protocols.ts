// Movement DeFi Protocol Registry
// Real protocols on Movement Network with on-chain data integration

export interface Protocol {
  id: string;
  name: string;
  type: "dex" | "lending" | "staking" | "yield";
  url: string;
  contractAddress?: string;
  description: string;
  baseAPY: number;
  riskScore: number;
  tvl?: number;
}

export interface Strategy {
  id: string;
  protocolId: string;
  name: string;
  allocationBps: number;
  targetAPY: number;
  riskLevel: "low" | "medium" | "high";
  description: string;
  active: boolean;
  onChainIndex?: number; // Index in strategy_router
}

// Real Movement DeFi Protocols
export const PROTOCOLS: Record<string, Protocol> = {
  meridian: {
    id: "meridian",
    name: "Meridian",
    type: "staking",
    url: "https://app.meridian.money",
    description: "Movement native liquidity layer with liquid staking",
    baseAPY: 12.0,
    riskScore: 2,
  },
  echelon: {
    id: "echelon",
    name: "Echelon",
    type: "lending",
    url: "https://app.echelon.market",
    description: "Isolated money markets with dynamic interest rates",
    baseAPY: 8.5,
    riskScore: 3,
  },
  liquidswap: {
    id: "liquidswap",
    name: "Liquidswap",
    type: "dex",
    url: "https://liquidswap.com",
    description: "Capital-efficient AMM with concentrated liquidity",
    baseAPY: 15.0,
    riskScore: 4,
  },
  moveposition: {
    id: "moveposition",
    name: "MovePosition",
    type: "lending",
    url: "https://testnet.moveposition.xyz",
    description: "Institutional-grade lending with adaptive rates",
    baseAPY: 9.2,
    riskScore: 3,
  },
  canopy: {
    id: "canopy",
    name: "Canopy",
    type: "yield",
    url: "https://canopyhub.xyz",
    description: "Unified yield aggregation dashboard",
    baseAPY: 11.0,
    riskScore: 4,
  },
  thunderhead: {
    id: "thunderhead",
    name: "Thunderhead",
    type: "staking",
    url: "https://thunderhead.xyz",
    description: "MOVE liquid staking protocol",
    baseAPY: 6.5,
    riskScore: 2,
  },
};

// Active vault strategies - mapped to on-chain strategy_router
export const VAULT_STRATEGIES: Strategy[] = [
  {
    id: "meridian-staking",
    protocolId: "meridian",
    name: "Meridian Staking",
    allocationBps: 4000,
    targetAPY: 12.0,
    riskLevel: "low",
    description: "Stake MOVE via Meridian for network validation rewards",
    active: true,
    onChainIndex: 0,
  },
  {
    id: "echelon-supply",
    protocolId: "echelon",
    name: "Echelon Supply",
    allocationBps: 3500,
    targetAPY: 8.5,
    riskLevel: "low",
    description: "Supply MOVE to Echelon isolated lending pools",
    active: true,
    onChainIndex: 1,
  },
  {
    id: "liquidswap-lp",
    protocolId: "liquidswap",
    name: "Liquidswap LP",
    allocationBps: 2500,
    targetAPY: 15.0,
    riskLevel: "medium",
    description: "Provide MOVE/USDC liquidity on Liquidswap",
    active: true,
    onChainIndex: 2,
  },
];

// Calculate weighted average APY from strategies
export function calculateWeightedAPY(strategies: Strategy[] = VAULT_STRATEGIES): number {
  return strategies
    .filter(s => s.active)
    .reduce((acc, s) => acc + (s.targetAPY * s.allocationBps / 10000), 0);
}

// Calculate risk-weighted score
export function calculateRiskScore(strategies: Strategy[] = VAULT_STRATEGIES): number {
  const totalAllocation = strategies.reduce((acc, s) => acc + s.allocationBps, 0);
  return strategies.reduce((acc, s) => {
    const protocol = PROTOCOLS[s.protocolId];
    return acc + (protocol.riskScore * s.allocationBps / totalAllocation);
  }, 0);
}

// Update strategies with on-chain APY data
export function updateStrategiesWithOnChainData(
  strategies: Strategy[],
  onChainProtocols: { name: string; currentAPY: number; isActive: boolean }[]
): Strategy[] {
  return strategies.map(strategy => {
    const onChainData = onChainProtocols.find(
      p => p.name.toLowerCase().includes(strategy.protocolId.toLowerCase())
    );
    if (onChainData) {
      return {
        ...strategy,
        targetAPY: onChainData.currentAPY,
        active: onChainData.isActive,
      };
    }
    return strategy;
  });
}

// Get protocol by ID
export function getProtocol(id: string): Protocol | undefined {
  return PROTOCOLS[id];
}

// Get strategy by ID
export function getStrategy(id: string): Strategy | undefined {
  return VAULT_STRATEGIES.find(s => s.id === id);
}

// Format allocation percentage
export function formatAllocation(bps: number): string {
  return `${(bps / 100).toFixed(0)}%`;
}

// Protocol type to string
export function protocolTypeToString(type: number): string {
  switch (type) {
    case 1: return "Staking";
    case 2: return "Lending";
    case 3: return "DEX/LP";
    default: return "Unknown";
  }
}

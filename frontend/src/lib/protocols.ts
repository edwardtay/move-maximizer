// Movement DeFi Protocol Registry
// These are real protocols deployed on Movement Network

export interface Protocol {
  id: string;
  name: string;
  type: "dex" | "lending" | "staking" | "yield";
  url: string;
  contractAddress?: string;
  description: string;
  baseAPY: number;
  riskScore: number; // 1-10, lower is safer
  tvl?: number;
}

export interface Strategy {
  id: string;
  protocolId: string;
  name: string;
  allocationBps: number; // basis points (10000 = 100%)
  targetAPY: number;
  riskLevel: "low" | "medium" | "high";
  description: string;
  active: boolean;
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

// Active vault strategies
export const VAULT_STRATEGIES: Strategy[] = [
  {
    id: "meridian-staking",
    protocolId: "meridian",
    name: "Meridian Staking",
    allocationBps: 4000, // 40%
    targetAPY: 12.0,
    riskLevel: "low",
    description: "Stake MOVE via Meridian for network validation rewards",
    active: true,
  },
  {
    id: "echelon-supply",
    protocolId: "echelon",
    name: "Echelon Supply",
    allocationBps: 3500, // 35%
    targetAPY: 8.5,
    riskLevel: "low",
    description: "Supply MOVE to Echelon isolated lending pools",
    active: true,
  },
  {
    id: "liquidswap-lp",
    protocolId: "liquidswap",
    name: "Liquidswap LP",
    allocationBps: 2500, // 25%
    targetAPY: 15.0,
    riskLevel: "medium",
    description: "Provide MOVE/USDC liquidity on Liquidswap",
    active: true,
  },
];

// Calculate weighted average APY
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

import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

export const CONTRACT_ADDRESS = "0xc227292511a7df4b728b91a03077b5556583fcc979c36e1043bbe7b102273857";
const RPC_URL = "https://testnet.movementnetwork.xyz/v1";

const config = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: RPC_URL,
});

export const aptosClient = new Aptos(config);

export const MODULES = {
  vault: `${CONTRACT_ADDRESS}::vault`,
  router: `${CONTRACT_ADDRESS}::strategy_router`,
  rewards: `${CONTRACT_ADDRESS}::rewards`,
};

// Protocol info from on-chain router
export interface ProtocolInfo {
  name: string;
  protocolType: number;
  isActive: boolean;
  currentAPY: number;
  totalDeposited: number;
  riskScore: number;
}

// Router info from chain
export interface RouterInfo {
  protocolCount: number;
  totalRouted: number;
  autoRebalance: boolean;
  lastRebalance: number;
}

// Types
export interface VaultInfo {
  totalAssets: number;
  totalShares: number;
  totalYieldEarned: number;
  isPaused: boolean;
  strategyCount: number;
}

export interface UserPosition {
  shares: number;
  depositTime: number;
  totalDeposited: number;
  totalWithdrawn: number;
}

export interface StrategyInfo {
  name: string;
  allocationBps: number;
  active: boolean;
  totalDeposited: number;
  totalEarned: number;
  apyBps: number;
}

// Get user's MOVE balance
export async function getBalance(address: string): Promise<number> {
  try {
    const resources = await aptosClient.getAccountResources({ accountAddress: address });
    const coinStore = resources.find(
      (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
    );
    if (coinStore && "data" in coinStore) {
      const data = coinStore.data as { coin: { value: string } };
      return parseInt(data.coin.value) / 1e8;
    }
    return 0;
  } catch (e) {
    console.error("Error getting balance:", e);
    return 0;
  }
}

// Get vault info from chain
export async function getVaultInfo(vaultAddress: string): Promise<VaultInfo | null> {
  try {
    const result = await aptosClient.view({
      payload: {
        function: `${MODULES.vault}::get_vault_info`,
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [vaultAddress],
      },
    });
    return {
      totalAssets: Number(result[0]) / 1e8,
      totalShares: Number(result[1]),
      totalYieldEarned: Number(result[2]) / 1e8,
      isPaused: Boolean(result[3]),
      strategyCount: Number(result[4]),
    };
  } catch (e) {
    console.error("Error getting vault info:", e);
    return null;
  }
}

// Get user position
export async function getUserPosition(userAddress: string): Promise<UserPosition | null> {
  try {
    const result = await aptosClient.view({
      payload: {
        function: `${MODULES.vault}::get_user_position`,
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [userAddress],
      },
    });
    return {
      shares: Number(result[0]),
      depositTime: Number(result[1]),
      totalDeposited: Number(result[2]) / 1e8,
      totalWithdrawn: Number(result[3]) / 1e8,
    };
  } catch (e) {
    console.error("Error getting user position:", e);
    return null;
  }
}

// Get share value in underlying asset
export async function getShareValue(vaultAddress: string, shares: number): Promise<number> {
  try {
    const result = await aptosClient.view({
      payload: {
        function: `${MODULES.vault}::get_share_value`,
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [vaultAddress, shares.toString()],
      },
    });
    return Number(result[0]) / 1e8;
  } catch (e) {
    console.error("Error getting share value:", e);
    return 0;
  }
}

// Build deposit payload
export function buildDepositPayload(vaultAddress: string, amount: number) {
  const amountInOctas = Math.floor(amount * 1e8);
  return {
    function: `${CONTRACT_ADDRESS}::vault::deposit` as `${string}::${string}::${string}`,
    typeArguments: ["0x1::aptos_coin::AptosCoin"] as const,
    functionArguments: [vaultAddress, amountInOctas],
  };
}

// Build withdraw payload
export function buildWithdrawPayload(vaultAddress: string, shares: number) {
  return {
    function: `${CONTRACT_ADDRESS}::vault::withdraw` as `${string}::${string}::${string}`,
    typeArguments: ["0x1::aptos_coin::AptosCoin"] as const,
    functionArguments: [vaultAddress, shares],
  };
}

// Build harvest payload
export function buildHarvestPayload(vaultAddress: string) {
  return {
    function: `${CONTRACT_ADDRESS}::vault::harvest` as `${string}::${string}::${string}`,
    typeArguments: ["0x1::aptos_coin::AptosCoin"] as const,
    functionArguments: [vaultAddress],
  };
}

// Execute transaction via Nightly wallet
export async function signAndSubmitTransaction(payload: any): Promise<string> {
  const nightly = (window as any).nightly?.aptos;
  if (!nightly) throw new Error("Nightly wallet not connected");

  // Get sender address
  const acc = await nightly.connect();
  const senderAddress = acc.address;

  // Build transaction using SDK
  const rawTx = await aptosClient.transaction.build.simple({
    sender: senderAddress,
    data: payload,
  });

  // Sign and submit
  const pendingTx = await nightly.signAndSubmitTransaction(rawTx);
  return pendingTx?.hash || pendingTx;
}

// Get recent transactions for address
export async function getRecentTransactions(address: string, limit: number = 10) {
  try {
    const txs = await aptosClient.getAccountTransactions({
      accountAddress: address,
      options: { limit },
    });
    return txs.filter((tx: any) => 
      tx.payload?.function?.includes(CONTRACT_ADDRESS)
    );
  } catch (e) {
    console.error("Error getting transactions:", e);
    return [];
  }
}

// Calculate current APY based on vault performance
export function calculateRealAPY(vaultInfo: VaultInfo): number {
  if (vaultInfo.totalAssets === 0) return 0;
  // APY = (yield / assets) * 365 * 100
  const yieldRatio = vaultInfo.totalYieldEarned / vaultInfo.totalAssets;
  return yieldRatio * 365 * 100;
}

// Get router info from chain
export async function getRouterInfo(routerAddress: string): Promise<RouterInfo | null> {
  try {
    const result = await aptosClient.view({
      payload: {
        function: `${MODULES.router}::get_router_info`,
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [routerAddress],
      },
    });
    return {
      protocolCount: Number(result[0]),
      totalRouted: Number(result[1]) / 1e8,
      autoRebalance: Boolean(result[2]),
      lastRebalance: Number(result[3]),
    };
  } catch (e) {
    console.error("Error getting router info:", e);
    return null;
  }
}

// Get protocol info from chain
export async function getProtocolInfo(routerAddress: string, index: number): Promise<ProtocolInfo | null> {
  try {
    const result = await aptosClient.view({
      payload: {
        function: `${MODULES.router}::get_protocol_info`,
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [routerAddress, index.toString()],
      },
    });
    return {
      name: String(result[0]),
      protocolType: Number(result[1]),
      isActive: Boolean(result[2]),
      currentAPY: Number(result[3]) / 100, // Convert from bps
      totalDeposited: Number(result[4]) / 1e8,
      riskScore: Number(result[5]),
    };
  } catch (e) {
    console.error("Error getting protocol info:", e);
    return null;
  }
}

// Get all protocols from router
export async function getAllProtocols(routerAddress: string): Promise<ProtocolInfo[]> {
  const routerInfo = await getRouterInfo(routerAddress);
  if (!routerInfo) return [];
  
  const protocols: ProtocolInfo[] = [];
  for (let i = 0; i < routerInfo.protocolCount; i++) {
    const protocol = await getProtocolInfo(routerAddress, i);
    if (protocol) protocols.push(protocol);
  }
  return protocols;
}

// Get rewards distributor info
export async function getRewardsInfo(distributorAddress: string): Promise<{ totalDistributed: number } | null> {
  try {
    const result = await aptosClient.view({
      payload: {
        function: `${MODULES.rewards}::get_total_distributed`,
        typeArguments: [],
        functionArguments: [distributorAddress],
      },
    });
    return {
      totalDistributed: Number(result[0]) / 1e8,
    };
  } catch (e) {
    console.error("Error getting rewards info:", e);
    return null;
  }
}

// Get pending rewards for user
export async function getPendingRewards(
  distributorAddress: string,
  poolAddress: string,
  userAddress: string
): Promise<number> {
  try {
    const result = await aptosClient.view({
      payload: {
        function: `${MODULES.rewards}::get_pending_rewards`,
        typeArguments: [],
        functionArguments: [distributorAddress, poolAddress, userAddress],
      },
    });
    return Number(result[0]) / 1e8;
  } catch (e) {
    console.error("Error getting pending rewards:", e);
    return 0;
  }
}

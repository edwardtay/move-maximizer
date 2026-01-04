import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

interface VaultInfo {
  name: string;
  token: string;
  tvl: number;
  apy: number;
  strategies: string[];
  riskLevel: string;
}

const MOCK_VAULTS: Record<string, VaultInfo> = {
  move: {
    name: "MOVE Maximizer",
    token: "MOVE",
    tvl: 2500000,
    apy: 12.5,
    strategies: ["Staking", "LP Farming"],
    riskLevel: "Low",
  },
  usdc: {
    name: "Stable Yield",
    token: "USDC",
    tvl: 1800000,
    apy: 8.2,
    strategies: ["Lending", "LP"],
    riskLevel: "Low",
  },
  eth: {
    name: "ETH Optimizer",
    token: "ETH",
    tvl: 3200000,
    apy: 15.8,
    strategies: ["LP Farming", "Lending"],
    riskLevel: "Medium",
  },
  defi: {
    name: "DeFi Index",
    token: "DEFI",
    tvl: 890000,
    apy: 22.5,
    strategies: ["LP Farming", "Staking", "Yield Aggregation"],
    riskLevel: "High",
  },
};

const MOCK_POSITIONS: Record<string, any[]> = {};

export class MovementService {
  private client: Aptos;

  constructor() {
    const config = new AptosConfig({
      network: Network.CUSTOM,
      fullnode: process.env.MOVEMENT_RPC_URL || "https://testnet.movementnetwork.xyz/v1",
    });
    this.client = new Aptos(config);
  }

  async getVaultsInfo(): Promise<string> {
    const vaults = Object.values(MOCK_VAULTS);

    let message = "*Available Vaults*\n\n";

    for (const vault of vaults) {
      const riskEmoji = vault.riskLevel === "Low" ? "🟢" : vault.riskLevel === "Medium" ? "🟡" : "🔴";
      message += `*${vault.name}* (${vault.token})\n`;
      message += `├ APY: *${vault.apy}%*\n`;
      message += `├ TVL: $${(vault.tvl / 1000000).toFixed(2)}M\n`;
      message += `├ Risk: ${riskEmoji} ${vault.riskLevel}\n`;
      message += `└ Strategies: ${vault.strategies.join(", ")}\n\n`;
    }

    message += "_Click on a vault for more details_";
    return message;
  }

  async getVaultDetails(vaultId: string): Promise<string> {
    const vault = MOCK_VAULTS[vaultId];
    if (!vault) return "Vault not found";

    const riskEmoji = vault.riskLevel === "Low" ? "🟢" : vault.riskLevel === "Medium" ? "🟡" : "🔴";

    return `
*${vault.name}*

*Token:* ${vault.token}
*APY:* ${vault.apy}%
*TVL:* $${(vault.tvl / 1000000).toFixed(2)}M
*Risk Level:* ${riskEmoji} ${vault.riskLevel}

*Strategies:*
${vault.strategies.map(s => `• ${s}`).join("\n")}

*Performance (30d):*
• Total Yield: $${(vault.tvl * (vault.apy / 100 / 12)).toFixed(0)}
• Share Price: $1.${(vault.apy / 10).toFixed(0)}

*Fees:*
• Deposit: 0%
• Withdrawal: 0.1%
• Performance: 10%
`;
  }

  async getBestAPY(): Promise<string> {
    const vaults = Object.values(MOCK_VAULTS).sort((a, b) => b.apy - a.apy);

    let message = "*Best APY Vaults*\n\n";

    vaults.forEach((vault, index) => {
      const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "  ";
      const riskEmoji = vault.riskLevel === "Low" ? "🟢" : vault.riskLevel === "Medium" ? "🟡" : "🔴";
      message += `${medal} *${vault.name}*\n`;
      message += `   ${vault.apy}% APY | ${riskEmoji} ${vault.riskLevel}\n\n`;
    });

    message += "_Higher APY often comes with higher risk_";
    return message;
  }

  async getPortfolio(walletAddress: string): Promise<string> {
    // Mock portfolio data
    const positions = MOCK_POSITIONS[walletAddress] || [
      { vault: "move", shares: 5000, deposited: 5000, currentValue: 5625 },
      { vault: "usdc", shares: 10000, deposited: 10000, currentValue: 10820 },
    ];

    if (positions.length === 0) {
      return `*Your Portfolio*

You don't have any active positions yet.

Use the Vaults menu to start earning yield!`;
    }

    let totalValue = 0;
    let totalDeposited = 0;

    let message = "*Your Portfolio*\n\n";

    for (const pos of positions) {
      const vault = MOCK_VAULTS[pos.vault];
      if (!vault) continue;

      const pnl = pos.currentValue - pos.deposited;
      const pnlPercent = ((pnl / pos.deposited) * 100).toFixed(2);

      totalValue += pos.currentValue;
      totalDeposited += pos.deposited;

      message += `*${vault.name}*\n`;
      message += `├ Deposited: $${pos.deposited.toLocaleString()}\n`;
      message += `├ Current: $${pos.currentValue.toLocaleString()}\n`;
      message += `├ P&L: ${pnl >= 0 ? "+" : ""}$${pnl.toLocaleString()} (${pnlPercent}%)\n`;
      message += `└ Shares: ${pos.shares.toLocaleString()}\n\n`;
    }

    const totalPnl = totalValue - totalDeposited;
    const totalPnlPercent = ((totalPnl / totalDeposited) * 100).toFixed(2);

    message += "━━━━━━━━━━━━━━━\n";
    message += `*Total Value:* $${totalValue.toLocaleString()}\n`;
    message += `*Total P&L:* ${totalPnl >= 0 ? "+" : ""}$${totalPnl.toLocaleString()} (${totalPnlPercent}%)`;

    return message;
  }

  async prepareDeposit(
    walletAddress: string,
    vaultId: string,
    amount: number
  ): Promise<string> {
    const vault = MOCK_VAULTS[vaultId];
    if (!vault) return "Vault not found";

    // In production, this would generate a transaction payload
    const estimatedShares = amount;
    const estimatedYearlyYield = amount * (vault.apy / 100);

    return `
*Deposit Preview*

*Vault:* ${vault.name}
*Amount:* ${amount} ${vault.token}
*Estimated Shares:* ${estimatedShares.toLocaleString()}

*Projected Returns:*
• Daily: ~$${(estimatedYearlyYield / 365).toFixed(2)}
• Monthly: ~$${(estimatedYearlyYield / 12).toFixed(2)}
• Yearly: ~$${estimatedYearlyYield.toFixed(2)}

To complete this deposit:
1. Visit [MoveFlow App](https://moveflow.xyz)
2. Connect your wallet
3. Go to ${vault.name} vault
4. Enter ${amount} ${vault.token} and confirm

_Transaction signing required in wallet_
`;
  }

  async prepareWithdraw(
    walletAddress: string,
    vaultId: string,
    shares: number
  ): Promise<string> {
    const vault = MOCK_VAULTS[vaultId];
    if (!vault) return "Vault not found";

    // Mock share price (slightly above 1 due to yield)
    const sharePrice = 1 + vault.apy / 100 / 12;
    const estimatedAmount = shares * sharePrice;
    const fee = estimatedAmount * 0.001; // 0.1% fee
    const netAmount = estimatedAmount - fee;

    return `
*Withdrawal Preview*

*Vault:* ${vault.name}
*Shares to Withdraw:* ${shares.toLocaleString()}

*Estimated Output:*
• Gross: ${estimatedAmount.toFixed(2)} ${vault.token}
• Fee (0.1%): ${fee.toFixed(4)} ${vault.token}
• Net: ${netAmount.toFixed(2)} ${vault.token}

To complete this withdrawal:
1. Visit [MoveFlow App](https://moveflow.xyz)
2. Connect your wallet
3. Go to Portfolio
4. Click Withdraw on ${vault.name}

_Transaction signing required in wallet_
`;
  }

  async getAccountBalance(walletAddress: string): Promise<number> {
    try {
      const resources = await this.client.getAccountResources({
        accountAddress: walletAddress,
      });

      const coinResource = resources.find(
        (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
      );

      if (coinResource && "data" in coinResource) {
        const data = coinResource.data as { coin: { value: string } };
        return parseInt(data.coin.value) / 1e8;
      }

      return 0;
    } catch (error) {
      console.error("Error fetching balance:", error);
      return 0;
    }
  }
}

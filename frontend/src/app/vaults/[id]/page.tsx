"use client";

import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  ArrowLeft,
  TrendingUp,
  Shield,
  Layers,
  Info,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";

// Mock vault data - in production, fetch from chain
const VAULTS_DATA: Record<string, any> = {
  "move-vault": {
    id: "move-vault",
    name: "MOVE Maximizer",
    token: "MOVE",
    tvl: 2500000,
    apy: 12.5,
    strategies: [
      { name: "Staking", allocation: 60, apy: 8.5 },
      { name: "LP Farming", allocation: 40, apy: 18.5 },
    ],
    riskLevel: "Low",
    description: "Optimize your MOVE returns through a combination of native staking and strategic liquidity provision across Movement DEXes.",
    fees: { deposit: 0, withdrawal: 0.1, performance: 10 },
    minDeposit: 1,
    totalUsers: 847,
    totalYieldPaid: 125000,
  },
  "usdc-vault": {
    id: "usdc-vault",
    name: "Stable Yield",
    token: "USDC",
    tvl: 1800000,
    apy: 8.2,
    strategies: [
      { name: "Lending", allocation: 70, apy: 6.5 },
      { name: "LP", allocation: 30, apy: 12.0 },
    ],
    riskLevel: "Low",
    description: "Earn stable yields on your USDC through over-collateralized lending protocols and stable liquidity pools.",
    fees: { deposit: 0, withdrawal: 0.1, performance: 10 },
    minDeposit: 10,
    totalUsers: 523,
    totalYieldPaid: 89000,
  },
  "eth-vault": {
    id: "eth-vault",
    name: "ETH Optimizer",
    token: "ETH",
    tvl: 3200000,
    apy: 15.8,
    strategies: [
      { name: "LP Farming", allocation: 50, apy: 22.0 },
      { name: "Lending", allocation: 50, apy: 9.5 },
    ],
    riskLevel: "Medium",
    description: "Maximize your ETH yields through strategic allocation across high-yield LP farms and lending markets.",
    fees: { deposit: 0, withdrawal: 0.1, performance: 10 },
    minDeposit: 0.01,
    totalUsers: 1245,
    totalYieldPaid: 245000,
  },
};

export default function VaultDetailPage() {
  const params = useParams();
  const { connected, account } = useWallet();
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const vaultId = params.id as string;
  const vault = VAULTS_DATA[vaultId];

  if (!vault) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Vault Not Found</h1>
          <Link href="/vaults" className="text-primary hover:underline">
            Back to Vaults
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setIsLoading(true);
    // Simulate transaction
    await new Promise((r) => setTimeout(r, 2000));
    setIsLoading(false);
    setAmount("");
    alert(`${activeTab === "deposit" ? "Deposit" : "Withdrawal"} successful!`);
  };

  const riskColors = {
    Low: "text-green-500 bg-green-500/10",
    Medium: "text-yellow-500 bg-yellow-500/10",
    High: "text-red-500 bg-red-500/10",
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link
          href="/vaults"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-primary mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vaults
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-2xl">
                {vault.token.slice(0, 2)}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{vault.name}</h1>
              <p className="text-gray-400">{vault.token} Yield Vault</p>
            </div>
          </div>
          <span
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              riskColors[vault.riskLevel as keyof typeof riskColors]
            }`}
          >
            {vault.riskLevel} Risk
          </span>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <div className="glass-card p-4">
                <p className="text-sm text-gray-400 mb-1">TVL</p>
                <p className="text-xl font-bold">
                  ${(vault.tvl / 1000000).toFixed(2)}M
                </p>
              </div>
              <div className="glass-card p-4">
                <p className="text-sm text-gray-400 mb-1">APY</p>
                <p className="text-xl font-bold text-green-500 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {vault.apy}%
                </p>
              </div>
              <div className="glass-card p-4">
                <p className="text-sm text-gray-400 mb-1">Users</p>
                <p className="text-xl font-bold">{vault.totalUsers}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-sm text-gray-400 mb-1">Yield Paid</p>
                <p className="text-xl font-bold">
                  ${(vault.totalYieldPaid / 1000).toFixed(0)}K
                </p>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                About This Vault
              </h2>
              <p className="text-gray-300">{vault.description}</p>
            </motion.div>

            {/* Strategies */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Active Strategies
              </h2>
              <div className="space-y-4">
                {vault.strategies.map((strategy: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-accent rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{strategy.name}</p>
                      <p className="text-sm text-gray-400">
                        {strategy.allocation}% allocation
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-500 font-medium">{strategy.apy}% APY</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Fees */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Fee Structure
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{vault.fees.deposit}%</p>
                  <p className="text-sm text-gray-400">Deposit Fee</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{vault.fees.withdrawal}%</p>
                  <p className="text-sm text-gray-400">Withdrawal Fee</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{vault.fees.performance}%</p>
                  <p className="text-sm text-gray-400">Performance Fee</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Deposit/Withdraw */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6 sticky top-24"
            >
              {!connected ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">
                    Connect your wallet to deposit
                  </p>
                  <ConnectWalletButton />
                </div>
              ) : (
                <>
                  {/* Tabs */}
                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={() => setActiveTab("deposit")}
                      className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === "deposit"
                          ? "bg-primary text-black"
                          : "bg-accent text-gray-300 hover:bg-accent/80"
                      }`}
                    >
                      Deposit
                    </button>
                    <button
                      onClick={() => setActiveTab("withdraw")}
                      className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === "withdraw"
                          ? "bg-primary text-black"
                          : "bg-accent text-gray-300 hover:bg-accent/80"
                      }`}
                    >
                      Withdraw
                    </button>
                  </div>

                  {/* Input */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">
                        {activeTab === "deposit" ? "Amount" : "Shares"}
                      </span>
                      <span className="text-gray-400">
                        Balance: 1,000 {vault.token}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-accent border border-gray-700 rounded-lg px-4 py-3 pr-20 focus:outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => setAmount("1000")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary/20 text-primary rounded text-sm font-medium"
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  {amount && parseFloat(amount) > 0 && (
                    <div className="bg-accent rounded-lg p-4 mb-4 space-y-2 text-sm">
                      {activeTab === "deposit" ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-400">You will receive</span>
                            <span>~{parseFloat(amount).toFixed(2)} shares</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Projected APY</span>
                            <span className="text-green-500">{vault.apy}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Est. yearly yield</span>
                            <span className="text-green-500">
                              +{((parseFloat(amount) * vault.apy) / 100).toFixed(2)} {vault.token}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-400">You will receive</span>
                            <span>~{(parseFloat(amount) * 1.05).toFixed(2)} {vault.token}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Withdrawal fee</span>
                            <span>{vault.fees.withdrawal}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={!amount || parseFloat(amount) <= 0 || isLoading}
                    className="w-full bg-primary text-black font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {activeTab === "deposit" ? "Deposit" : "Withdraw"} {vault.token}
                      </>
                    )}
                  </button>

                  {/* Min deposit notice */}
                  <p className="text-xs text-gray-500 text-center mt-4">
                    Min deposit: {vault.minDeposit} {vault.token}
                  </p>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

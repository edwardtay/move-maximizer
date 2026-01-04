"use client";

import { motion } from "framer-motion";
import { useWalletContext } from "@/context/WalletContext";
import {
  Wallet,
  TrendingUp,
  PieChart,
  History,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";

const MOCK_POSITIONS = [
  {
    vault: "MOVE Maximizer",
    token: "MOVE",
    deposited: 5000,
    currentValue: 5625,
    shares: 5000,
    apy: 12.5,
    pnl: 625,
    pnlPercent: 12.5,
  },
  {
    vault: "Stable Yield",
    token: "USDC",
    deposited: 10000,
    currentValue: 10820,
    shares: 10000,
    apy: 8.2,
    pnl: 820,
    pnlPercent: 8.2,
  },
];

const MOCK_HISTORY = [
  {
    type: "deposit",
    vault: "MOVE Maximizer",
    amount: 5000,
    token: "MOVE",
    timestamp: "2024-12-15 14:30",
    txHash: "0x1234...5678",
  },
  {
    type: "deposit",
    vault: "Stable Yield",
    amount: 10000,
    token: "USDC",
    timestamp: "2024-12-14 09:15",
    txHash: "0xabcd...efgh",
  },
  {
    type: "harvest",
    vault: "MOVE Maximizer",
    amount: 125,
    token: "MOVE",
    timestamp: "2024-12-16 00:00",
    txHash: "0x9876...5432",
  },
];

export default function PortfolioPage() {
  const { connected } = useWalletContext();

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 text-center max-w-md"
        >
          <Wallet className="w-16 h-16 text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">
            Connect your wallet to view your portfolio and manage your positions
          </p>
          <ConnectWalletButton />
        </motion.div>
      </div>
    );
  }

  const totalValue = MOCK_POSITIONS.reduce((acc, pos) => acc + pos.currentValue, 0);
  const totalPnl = MOCK_POSITIONS.reduce((acc, pos) => acc + pos.pnl, 0);
  const totalDeposited = MOCK_POSITIONS.reduce((acc, pos) => acc + pos.deposited, 0);
  const avgPnlPercent = (totalPnl / totalDeposited) * 100;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Portfolio</h1>
          <p className="text-gray-400">
            Track your positions and earnings across all vaults
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Wallet className="w-5 h-5" />
              <span className="text-sm">Total Value</span>
            </div>
            <p className="text-3xl font-bold">${totalValue.toLocaleString()}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm">Total P&L</span>
            </div>
            <p className="text-3xl font-bold text-green-500">
              +${totalPnl.toLocaleString()}
            </p>
            <span className="text-green-500 text-sm">+{avgPnlPercent.toFixed(2)}%</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <PieChart className="w-5 h-5" />
              <span className="text-sm">Active Positions</span>
            </div>
            <p className="text-3xl font-bold">{MOCK_POSITIONS.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm">Avg. APY</span>
            </div>
            <p className="text-3xl font-bold text-primary">10.35%</p>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Positions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <h2 className="text-xl font-bold mb-4">Your Positions</h2>
            <div className="space-y-4">
              {MOCK_POSITIONS.map((position, index) => (
                <motion.div
                  key={position.vault}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-bold">
                          {position.token.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{position.vault}</h3>
                        <p className="text-sm text-gray-400">{position.token}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${position.currentValue.toLocaleString()}</p>
                      <p className="text-sm text-green-500">+{position.pnlPercent}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Deposited</p>
                      <p className="font-medium">${position.deposited.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Shares</p>
                      <p className="font-medium">{position.shares.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">APY</p>
                      <p className="font-medium text-green-500">{position.apy}%</p>
                    </div>
                    <div>
                      <p className="text-gray-400">P&L</p>
                      <p className="font-medium text-green-500">+${position.pnl}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                    <button className="flex-1 bg-primary text-black font-semibold py-2 rounded-lg">
                      Deposit More
                    </button>
                    <button className="flex-1 border border-gray-600 text-gray-300 font-semibold py-2 rounded-lg hover:border-primary transition-colors">
                      Withdraw
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <History className="w-5 h-5" />
              Recent Activity
            </h2>
            <div className="glass-card p-4 space-y-4">
              {MOCK_HISTORY.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 pb-4 border-b border-gray-700 last:border-0 last:pb-0"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.type === "deposit"
                        ? "bg-green-500/20 text-green-500"
                        : item.type === "withdraw"
                        ? "bg-red-500/20 text-red-500"
                        : "bg-primary/20 text-primary"
                    }`}
                  >
                    {item.type === "deposit" ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : item.type === "withdraw" ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <TrendingUp className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium capitalize">{item.type}</p>
                    <p className="text-sm text-gray-400 truncate">{item.vault}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {item.type === "withdraw" ? "-" : "+"}
                      {item.amount} {item.token}
                    </p>
                    <p className="text-xs text-gray-500">{item.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

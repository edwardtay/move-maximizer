"use client";

import { motion } from "framer-motion";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { VaultCard } from "@/components/vault/VaultCard";

const ALL_VAULTS = [
  {
    id: "move-vault",
    name: "MOVE Maximizer",
    token: "MOVE",
    tvl: 0,
    apy: 13.5,
    strategies: ["Staking", "LP Farming"],
    riskLevel: "Low",
    isLive: true,
  },
  {
    id: "usdc-vault",
    name: "Stable Yield",
    token: "USDC",
    tvl: 1800000,
    apy: 8.2,
    strategies: ["Lending", "LP"],
    riskLevel: "Low",
  },
  {
    id: "eth-vault",
    name: "ETH Optimizer",
    token: "ETH",
    tvl: 3200000,
    apy: 15.8,
    strategies: ["LP Farming", "Lending"],
    riskLevel: "Medium",
  },
  {
    id: "btc-vault",
    name: "BTC Yield Farm",
    token: "BTC",
    tvl: 4100000,
    apy: 9.4,
    strategies: ["LP Farming"],
    riskLevel: "Medium",
  },
  {
    id: "usdt-vault",
    name: "USDT Stable",
    token: "USDT",
    tvl: 1200000,
    apy: 7.8,
    strategies: ["Lending"],
    riskLevel: "Low",
  },
  {
    id: "defi-vault",
    name: "DeFi Index",
    token: "DEFI",
    tvl: 890000,
    apy: 22.5,
    strategies: ["LP Farming", "Staking", "Yield Aggregation"],
    riskLevel: "High",
  },
];

export default function VaultsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("tvl");

  const filteredVaults = ALL_VAULTS.filter((vault) => {
    const matchesSearch =
      vault.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vault.token.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === "all" || vault.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  }).sort((a, b) => {
    if (sortBy === "tvl") return b.tvl - a.tvl;
    if (sortBy === "apy") return b.apy - a.apy;
    return 0;
  });

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Yield Vaults</h1>
          <p className="text-gray-400">
            Deposit your assets and let AI optimize your yields
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search vaults..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-accent border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary"
              />
            </div>

            {/* Risk Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="bg-accent border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
              >
                <option value="all">All Risks</option>
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-accent border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
              >
                <option value="tvl">Sort by TVL</option>
                <option value="apy">Sort by APY</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Vaults Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVaults.map((vault, index) => (
            <motion.div
              key={vault.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <VaultCard vault={vault} />
            </motion.div>
          ))}
        </div>

        {filteredVaults.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No vaults found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

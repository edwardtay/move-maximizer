"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import Link from "next/link";

interface VaultProps {
  vault: {
    id: string;
    name: string;
    token: string;
    tvl: number;
    apy: number;
    strategies: string[];
    riskLevel: string;
  };
}

export function VaultCard({ vault }: VaultProps) {
  const formatTVL = (tvl: number) => {
    if (tvl >= 1000000) return `$${(tvl / 1000000).toFixed(1)}M`;
    return `$${(tvl / 1000).toFixed(0)}K`;
  };

  return (
    <Link href={`/vaults/${vault.id}`}>
      <motion.div
        whileHover={{ y: -2 }}
        className="glass-card p-4 cursor-pointer group"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-semibold text-sm">{vault.token.slice(0, 2)}</span>
          </div>
          <div>
            <h3 className="font-medium group-hover:text-primary transition-colors">{vault.name}</h3>
            <p className="text-xs text-gray-500">{vault.token}</p>
          </div>
        </div>

        <div className="flex justify-between text-sm mb-3">
          <div>
            <p className="text-xs text-gray-500">TVL</p>
            <p className="font-medium">{formatTVL(vault.tvl)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">APY</p>
            <p className="font-medium text-green-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {vault.apy}%
            </p>
          </div>
        </div>

        <div className="flex gap-1">
          {vault.strategies.map((s) => (
            <span key={s} className="px-2 py-0.5 bg-accent rounded text-xs text-gray-400">
              {s}
            </span>
          ))}
        </div>
      </motion.div>
    </Link>
  );
}

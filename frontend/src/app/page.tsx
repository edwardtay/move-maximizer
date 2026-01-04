"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, Zap, RefreshCw, Layers, ExternalLink, TrendingUp, Shield, Activity } from "lucide-react";
import Link from "next/link";
import { PROTOCOLS, VAULT_STRATEGIES, calculateWeightedAPY, calculateRiskScore, formatAllocation, Strategy, updateStrategiesWithOnChainData } from "@/lib/protocols";
import { getVaultInfo, getRouterInfo, getProtocolInfo, CONTRACT_ADDRESS, VaultInfo, ProtocolInfo } from "@/lib/movement";

export default function Home() {
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>(VAULT_STRATEGIES);
  const [onChainProtocols, setOnChainProtocols] = useState<ProtocolInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Fetch vault info
      const info = await getVaultInfo(CONTRACT_ADDRESS);
      setVaultInfo(info);
      
      // Fetch router info and protocols
      const routerInfo = await getRouterInfo(CONTRACT_ADDRESS);
      if (routerInfo && routerInfo.protocolCount > 0) {
        const protocols: ProtocolInfo[] = [];
        for (let i = 0; i < routerInfo.protocolCount; i++) {
          const protocol = await getProtocolInfo(CONTRACT_ADDRESS, i);
          if (protocol) protocols.push(protocol);
        }
        setOnChainProtocols(protocols);
        
        // Update strategies with on-chain APY data
        const updatedStrategies = updateStrategiesWithOnChainData(VAULT_STRATEGIES, protocols);
        setStrategies(updatedStrategies);
      }
      
      setLoading(false);
    }
    fetchData();
  }, []);

  const targetAPY = calculateWeightedAPY(strategies);
  const riskScore = calculateRiskScore(strategies);

  return (
    <div className="h-full flex flex-col overflow-auto">
      <div className="max-w-5xl mx-auto w-full px-4 py-6 flex-1">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-500 text-xs px-3 py-1 rounded-full mb-3">
            <Activity className="w-3 h-3" />
            Live on Movement Testnet
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Move <span className="text-gradient">Maximizer</span>
          </h1>
          <p className="text-gray-500 text-sm max-w-lg mx-auto mb-4">
            Intelligent yield aggregator that auto-rebalances across Movement DeFi protocols to maximize risk-adjusted returns.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/vaults/move-vault">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="bg-primary text-black font-medium px-5 py-2 rounded-lg text-sm inline-flex items-center gap-2">
                Enter App <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <a href={`https://explorer.movementnetwork.xyz/account/${CONTRACT_ADDRESS}?network=bardock+testnet`} target="_blank" rel="noopener noreferrer">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="border border-gray-700 text-gray-300 font-medium px-5 py-2 rounded-lg text-sm inline-flex items-center gap-2">
                Contract <ExternalLink className="w-4 h-4" />
              </motion.button>
            </a>
          </div>
        </motion.div>

        {/* Live Stats */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-3 mb-6"
        >
          <StatCard 
            label="TVL" 
            value={loading ? "..." : `${vaultInfo?.totalAssets.toFixed(2) || "0"} MOVE`}
            live
          />
          <StatCard 
            label="Target APY" 
            value={`${targetAPY.toFixed(1)}%`}
            highlight
          />
          <StatCard 
            label="Total Yield" 
            value={loading ? "..." : `${vaultInfo?.totalYieldEarned.toFixed(4) || "0"} MOVE`}
          />
          <StatCard 
            label="Risk Score" 
            value={`${riskScore.toFixed(1)}/10`}
          />
        </motion.div>

        {/* Features */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.15 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <Feature icon={<RefreshCw className="w-4 h-4" />} title="Auto-Rebalancing" desc="Dynamic allocation based on APY" />
          <Feature icon={<Zap className="w-4 h-4" />} title="Auto-Compounding" desc="Yield reinvested on harvest" />
          <Feature icon={<Layers className="w-4 h-4" />} title="Multi-Protocol" desc="Diversified across DeFi" />
        </motion.div>

        {/* Strategies */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.2 }}
          className="glass-card p-4 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Active Strategies</h2>
            <div className="flex items-center gap-2">
              {onChainProtocols.length > 0 && (
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> On-chain
                </span>
              )}
              <span className="text-xs text-gray-500">{strategies.length} protocols</span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {strategies.map((strategy, i) => {
              const protocol = PROTOCOLS[strategy.protocolId];
              return (
                <motion.div
                  key={strategy.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  className="bg-accent/50 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {strategy.protocolId === "meridian" && <Shield className="w-4 h-4 text-blue-400" />}
                      {strategy.protocolId === "echelon" && <Zap className="w-4 h-4 text-purple-400" />}
                      {strategy.protocolId === "liquidswap" && <TrendingUp className="w-4 h-4 text-green-400" />}
                      <span className="text-sm font-medium">{protocol?.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{protocol?.type}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">{formatAllocation(strategy.allocationBps)} allocation</span>
                    <span className="text-green-500 font-medium">{strategy.targetAPY}% APY</span>
                  </div>
                  <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: formatAllocation(strategy.allocationBps) }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Protocol Links */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <p className="text-xs text-gray-500 mb-2">Integrated Protocols</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {Object.values(PROTOCOLS).slice(0, 5).map((p) => (
              <a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-accent/30 px-3 py-1.5 rounded-lg text-xs hover:bg-accent/50 transition-colors"
              >
                <span className="font-medium">{p.name}</span>
                <ExternalLink className="w-3 h-3 text-gray-500" />
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="text-center p-3 bg-accent/30 rounded-lg">
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary mb-2">{icon}</div>
      <p className="text-xs font-medium">{title}</p>
      <p className="text-xs text-gray-500">{desc}</p>
    </div>
  );
}

function StatCard({ label, value, live, highlight }: { label: string; value: string; live?: boolean; highlight?: boolean }) {
  return (
    <div className="bg-accent/30 rounded-lg p-3 text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        <p className="text-xs text-gray-500">{label}</p>
        {live && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
      </div>
      <p className={`font-semibold ${highlight ? "text-green-500" : ""}`}>{value}</p>
    </div>
  );
}

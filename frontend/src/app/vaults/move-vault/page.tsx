"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, TrendingUp, Shield, Wallet, Loader2, ExternalLink, Zap, RefreshCw, Clock, Activity } from "lucide-react";
import Link from "next/link";
import { useWalletContext } from "@/context/WalletContext";
import { 
  getVaultInfo, 
  getBalance, 
  getUserPosition, 
  getShareValue,
  getRouterInfo,
  getProtocolInfo,
  buildDepositPayload, 
  buildWithdrawPayload,
  buildHarvestPayload,
  signAndSubmitTransaction,
  CONTRACT_ADDRESS,
  VaultInfo,
  UserPosition,
  ProtocolInfo,
  calculateRealAPY,
} from "@/lib/movement";
import { VAULT_STRATEGIES, calculateWeightedAPY, calculateRiskScore, PROTOCOLS, formatAllocation, Strategy, updateStrategiesWithOnChainData } from "@/lib/protocols";

export default function MoveVaultPage() {
  const { connected, address } = useWalletContext();
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [harvesting, setHarvesting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // On-chain state
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [userShareValue, setUserShareValue] = useState<number>(0);
  const [strategies, setStrategies] = useState<Strategy[]>(VAULT_STRATEGIES);
  const [onChainProtocols, setOnChainProtocols] = useState<ProtocolInfo[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const targetAPY = calculateWeightedAPY(strategies);
  const riskScore = calculateRiskScore(strategies);

  const fetchData = useCallback(async () => {
    setDataLoading(true);
    try {
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
      
      if (address) {
        const [balance, position] = await Promise.all([
          getBalance(address),
          getUserPosition(address),
        ]);
        setUserBalance(balance);
        setUserPosition(position);
        
        if (position && position.shares > 0) {
          const value = await getShareValue(CONTRACT_ADDRESS, position.shares);
          setUserShareValue(value);
        }
      }
      setLastUpdate(new Date());
    } catch (e) {
      console.error("Error fetching data:", e);
    } finally {
      setDataLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleDeposit = async () => {
    if (!amount || !address || parseFloat(amount) <= 0) return;
    setLoading(true);
    setError(null);
    setTxHash(null);
    
    try {
      const payload = buildDepositPayload(CONTRACT_ADDRESS, parseFloat(amount));
      const hash = await signAndSubmitTransaction(payload);
      setTxHash(hash);
      setAmount("");
      setTimeout(fetchData, 3000);
    } catch (e: any) {
      setError(e.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || !address || !userPosition || parseInt(amount) <= 0) return;
    setLoading(true);
    setError(null);
    setTxHash(null);
    
    try {
      const payload = buildWithdrawPayload(CONTRACT_ADDRESS, parseInt(amount));
      const hash = await signAndSubmitTransaction(payload);
      setTxHash(hash);
      setAmount("");
      setTimeout(fetchData, 3000);
    } catch (e: any) {
      setError(e.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  const handleHarvest = async () => {
    if (!address) return;
    setHarvesting(true);
    try {
      const payload = buildHarvestPayload(CONTRACT_ADDRESS);
      await signAndSubmitTransaction(payload);
      setTimeout(fetchData, 3000);
    } catch (e: any) {
      console.error("Harvest error:", e);
    } finally {
      setHarvesting(false);
    }
  };

  const userPnL = userPosition ? userShareValue - userPosition.totalDeposited + userPosition.totalWithdrawn : 0;
  const userPnLPercent = userPosition && userPosition.totalDeposited > 0 
    ? ((userPnL / userPosition.totalDeposited) * 100) 
    : 0;

  return (
    <div className="h-full flex flex-col p-4 overflow-auto">
      <div className="max-w-5xl mx-auto w-full flex-1">
        <div className="flex items-center justify-between mb-3">
          <Link href="/vaults" className="inline-flex items-center gap-1 text-gray-500 hover:text-white text-xs">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {lastUpdate && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <button onClick={fetchData} disabled={dataLoading} className="p-1 hover:bg-accent rounded">
              <RefreshCw className={`w-3 h-3 ${dataLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">M</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">MOVE Maximizer</h1>
                <p className="text-gray-500 text-xs">Multi-strategy yield vault • {VAULT_STRATEGIES.length} protocols</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleHarvest} 
                disabled={harvesting || !connected}
                className="px-2 py-1 rounded bg-green-500/10 text-green-500 text-xs flex items-center gap-1 hover:bg-green-500/20 disabled:opacity-50"
              >
                {harvesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                Harvest
              </button>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs">
                Risk: {riskScore.toFixed(1)}/10
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-3 text-center text-sm">
            <div>
              <p className="text-xs text-gray-500">TVL</p>
              <p className="font-medium">{dataLoading ? "..." : `${vaultInfo?.totalAssets.toFixed(4) || "0"} MOVE`}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Target APY</p>
              <p className="font-medium text-green-500">{targetAPY.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Shares</p>
              <p className="font-medium">{vaultInfo?.totalShares.toLocaleString() || "0"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Yield</p>
              <p className="font-medium text-green-500">{vaultInfo?.totalYieldEarned.toFixed(4) || "0"} MOVE</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className={`font-medium ${vaultInfo?.isPaused ? "text-red-500" : "text-green-500"}`}>
                {vaultInfo?.isPaused ? "Paused" : "Active"}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Deposit/Withdraw */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card p-4 flex flex-col">
            <div className="flex gap-2 mb-3">
              {["deposit", "withdraw"].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => { setActiveTab(tab as any); setError(null); setTxHash(null); }}
                  className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === tab ? "bg-primary text-black" : "bg-accent text-gray-500 hover:text-white"}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {connected ? (
              <div className="flex-1 flex flex-col">
                <div className="bg-accent rounded p-2 mb-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">{activeTab === "deposit" ? "Wallet Balance" : "Your Shares"}</p>
                    <Activity className="w-3 h-3 text-gray-500" />
                  </div>
                  <p className="font-medium text-sm">
                    {activeTab === "deposit" 
                      ? `${userBalance.toFixed(4)} MOVE` 
                      : `${userPosition?.shares.toLocaleString() || 0}`
                    }
                  </p>
                </div>
                
                <div className="relative mb-2">
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    placeholder={activeTab === "deposit" ? "0.00 MOVE" : "0 shares"}
                    className="w-full bg-accent border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" 
                  />
                  <button 
                    onClick={() => setAmount(activeTab === "deposit" ? userBalance.toString() : (userPosition?.shares || 0).toString())} 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-primary text-xs hover:underline"
                  >
                    MAX
                  </button>
                </div>

                {activeTab === "deposit" && amount && parseFloat(amount) > 0 && (
                  <div className="text-xs text-gray-500 mb-2">
                    ≈ {vaultInfo && vaultInfo.totalAssets > 0 
                      ? Math.floor((parseFloat(amount) * vaultInfo.totalShares) / vaultInfo.totalAssets).toLocaleString()
                      : parseFloat(amount) * 1e8
                    } shares
                  </div>
                )}

                {error && <p className="text-red-500 text-xs mb-2 p-2 bg-red-500/10 rounded">{error}</p>}
                
                {txHash && (
                  <a 
                    href={`https://explorer.movementnetwork.xyz/txn/${txHash}?network=bardock+testnet`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-green-500 text-xs mb-2 p-2 bg-green-500/10 rounded flex items-center gap-1"
                  >
                    ✓ Transaction submitted <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <button 
                  onClick={activeTab === "deposit" ? handleDeposit : handleWithdraw} 
                  disabled={loading || !amount || parseFloat(amount) <= 0} 
                  className="mt-auto bg-primary text-black font-medium py-2 rounded text-sm disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : activeTab === "deposit" ? "Deposit" : "Withdraw"}
                </button>

                <p className="text-xs text-gray-600 mt-2 text-center">
                  {activeTab === "deposit" ? "No deposit fee" : "0.1% withdrawal fee"}
                </p>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Wallet className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                  <p className="text-gray-500 text-xs">Connect wallet to continue</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Position */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="glass-card p-4">
            <h3 className="font-medium text-sm mb-3 flex items-center justify-between">
              Your Position
              {userPosition && userPosition.shares > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${userPnL >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                  {userPnL >= 0 ? "+" : ""}{userPnLPercent.toFixed(2)}%
                </span>
              )}
            </h3>
            
            {connected && userPosition && userPosition.shares > 0 ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Shares Held</span>
                  <span className="font-mono">{userPosition.shares.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Deposited</span>
                  <span>{userPosition.totalDeposited.toFixed(4)} MOVE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Current Value</span>
                  <span className="text-green-500">{userShareValue.toFixed(4)} MOVE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Unrealized P&L</span>
                  <span className={userPnL >= 0 ? "text-green-500" : "text-red-500"}>
                    {userPnL >= 0 ? "+" : ""}{userPnL.toFixed(4)} MOVE
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Withdrawn</span>
                  <span>{userPosition.totalWithdrawn.toFixed(4)} MOVE</span>
                </div>
                {userPosition.depositTime > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">First Deposit</span>
                    <span>{new Date(userPosition.depositTime * 1000).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-xs text-center py-4">
                {connected ? "No active position" : "Connect wallet to view"}
              </p>
            )}

            <div className="mt-3 pt-2 border-t border-gray-800">
              <a 
                href={`https://explorer.movementnetwork.xyz/account/${CONTRACT_ADDRESS}?network=bardock+testnet`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-gray-600 hover:text-primary flex items-center gap-1"
              >
                View contract <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </motion.div>

          {/* Vault Metrics */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card p-4">
            <h3 className="font-medium text-sm mb-3">Vault Metrics</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Performance Fee</span>
                <span>10%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Withdrawal Fee</span>
                <span>0.1%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Min Deposit</span>
                <span>0.001 MOVE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Harvest Frequency</span>
                <span>On-demand</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Share Price</span>
                <span>
                  {vaultInfo && vaultInfo.totalShares > 0 
                    ? (vaultInfo.totalAssets / vaultInfo.totalShares * 1e8).toFixed(6)
                    : "1.000000"
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Realized APY</span>
                <span className="text-green-500">
                  {vaultInfo ? calculateRealAPY(vaultInfo).toFixed(1) : "0"}%
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Strategies */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="glass-card p-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm">Active Strategies</h3>
            <div className="flex items-center gap-2">
              {onChainProtocols.length > 0 && (
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Live APY
                </span>
              )}
              <span className="text-xs text-gray-500">Rebalanced on APY differential</span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {strategies.filter(s => s.active).map((strategy, i) => {
              const protocol = PROTOCOLS[strategy.protocolId];
              return (
                <motion.div 
                  key={strategy.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="bg-accent rounded-lg p-3 hover:bg-accent/80 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {strategy.protocolId === "meridian" && <Shield className="w-4 h-4 text-blue-400" />}
                      {strategy.protocolId === "echelon" && <Zap className="w-4 h-4 text-purple-400" />}
                      {strategy.protocolId === "liquidswap" && <TrendingUp className="w-4 h-4 text-green-400" />}
                      <span className="text-sm font-medium">{strategy.name}</span>
                    </div>
                    <a href={protocol?.url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{strategy.description}</p>
                  <div className="flex justify-between text-xs mb-2">
                    <span className={`px-1.5 py-0.5 rounded ${
                      strategy.riskLevel === "low" ? "bg-green-500/10 text-green-500" :
                      strategy.riskLevel === "medium" ? "bg-yellow-500/10 text-yellow-500" :
                      "bg-red-500/10 text-red-500"
                    }`}>
                      {strategy.riskLevel} risk
                    </span>
                    <span className="text-green-500 font-medium">{strategy.targetAPY}% APY</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500" 
                        style={{ width: formatAllocation(strategy.allocationBps) }} 
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-10 text-right">{formatAllocation(strategy.allocationBps)}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

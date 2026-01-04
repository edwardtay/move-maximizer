"use client";

import { motion } from "framer-motion";
import { Wallet, LogOut, Copy, ExternalLink } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useWalletContext } from "@/context/WalletContext";

export function ConnectWalletButton() {
  const { connected, address, disconnect, connect } = useWalletContext();
  const [showMenu, setShowMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (connected && address) {
    return (
      <div className="relative" ref={ref}>
        <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-2 bg-accent border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="font-medium">{truncate(address)}</span>
        </button>

        {showMenu && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="absolute right-0 mt-2 w-48 bg-card border border-gray-800 rounded-lg shadow-xl overflow-hidden z-50">
            <div className="p-3 border-b border-gray-800">
              <p className="text-xs text-gray-500 mb-1">Nightly</p>
              <p className="font-mono text-xs truncate">{address}</p>
            </div>
            <div className="p-1">
              <button onClick={() => navigator.clipboard.writeText(address)} className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-400 hover:bg-accent">
                <Copy className="w-3 h-3" /> Copy
              </button>
              <a href={`https://explorer.movementnetwork.xyz/account/${address}?network=bardock+testnet`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-400 hover:bg-accent">
                <ExternalLink className="w-3 h-3" /> Explorer
              </a>
              <button onClick={() => { disconnect(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-red-500 hover:bg-red-500/10">
                <LogOut className="w-3 h-3" /> Disconnect
              </button>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={connect} className="flex items-center gap-2 bg-primary text-black font-medium rounded-lg px-3 py-1.5 text-sm">
      <Wallet className="w-4 h-4" /> Connect
    </motion.button>
  );
}

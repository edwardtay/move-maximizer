"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, X, ExternalLink } from "lucide-react";
import { useState } from "react";
import { ConnectWalletButton } from "./wallet/ConnectWalletButton";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/vaults", label: "Vaults" },
  { href: "/portfolio", label: "Portfolio" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showNetwork, setShowNetwork] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800/50 bg-secondary/90 backdrop-blur-lg">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-yellow-300 flex items-center justify-center">
              <span className="text-black font-bold">M</span>
            </div>
            <span className="font-semibold">Move<span className="text-primary">Maximizer</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowNetwork(!showNetwork)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent text-xs hover:bg-accent/80"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-gray-400">Testnet</span>
              </button>
              
              {showNetwork && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-56 bg-card border border-gray-800 rounded-lg shadow-xl p-3 z-50"
                >
                  <p className="text-xs text-gray-500 mb-2">Movement Testnet</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-gray-500">Chain ID</span><span>250</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">RPC</span><span className="text-gray-400 truncate max-w-[120px]">testnet.movementnetwork.xyz</span></div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-800 space-y-1">
                    <a href="https://faucet.movementnetwork.xyz/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-xs text-primary hover:underline">
                      Get MOVE <ExternalLink className="w-3 h-3" />
                    </a>
                    <a href="https://explorer.movementnetwork.xyz/?network=bardock+testnet" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-xs text-gray-400 hover:text-white">
                      Explorer <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </motion.div>
              )}
            </div>
            <ConnectWalletButton />
          </div>

          <button className="md:hidden text-gray-400" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="md:hidden border-t border-gray-800 bg-secondary px-4 py-3 space-y-3">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="block text-sm text-gray-400" onClick={() => setIsOpen(false)}>
              {link.label}
            </Link>
          ))}
          <a href="https://faucet.movementnetwork.xyz/" target="_blank" rel="noopener noreferrer" className="block text-sm text-primary">
            Get MOVE →
          </a>
          <ConnectWalletButton />
        </motion.div>
      )}
    </nav>
  );
}

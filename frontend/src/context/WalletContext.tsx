"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface WalletContextType {
  connected: boolean;
  address: string | null;
  walletName: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [walletName, setWalletName] = useState("");

  const connect = async () => {
    if (typeof window === "undefined") return;

    try {
      const nightly = (window as any).nightly?.aptos;
      if (nightly) {
        const response = await nightly.connect();
        setAddress(response.address);
        setConnected(true);
        setWalletName("Nightly");
      } else {
        window.open("https://nightly.app/", "_blank");
      }
    } catch (e) {
      console.error("Connect error:", e);
    }
  };

  const disconnect = async () => {
    try {
      const nightly = (window as any).nightly?.aptos;
      if (nightly) await nightly.disconnect();
    } catch (e) {}
    setConnected(false);
    setAddress(null);
    setWalletName("");
  };

  return (
    <WalletContext.Provider value={{ connected, address, walletName, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWalletContext must be used within WalletProvider");
  return context;
}

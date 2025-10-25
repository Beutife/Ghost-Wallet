"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import { useState, useEffect } from "react";

const Navbar = () => {
  const { connect, connectors, error, isPending } = useConnect();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const [isConnecting, setIsConnecting] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleConnect = () => {
  setIsConnecting(true);

  console.log("%c🔌 Connect Button Clicked", "color: cyan; font-size:14px;");
  console.log("Available connectors:", connectors);

  const injectedConnector = connectors.find((c) => c.id === "injected");

  if (!injectedConnector) {
    console.error("%c❌ No injected wallet found", "color:red;");
    alert("No browser wallet detected. Please install MetaMask.");
    setIsConnecting(false);
    return;
  }

  console.log(
    "%c🦊 Attempting to connect with injected wallet...",
    "color:orange; font-size:13px;"
  );

  connect(
    { connector: injectedConnector },
    {
      onSuccess: (data) => {
        console.log(
          "%c✅ Wallet Connected Successfully!",
          "color:green; font-size:14px;"
        );
        console.log("Account:", data.accounts?.[0]); // 👈 FIXED HERE
        setIsConnecting(false);
      },
      onError: (err) => {
        console.error("%c❌ Connection Error", "color:red; font-size:14px;");
        console.error("Error Details:", err);
        setIsConnecting(false);
      },
    }
  );
};


  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-4xl animate-float">👻</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:scale-105 transition-transform">
              GhostWallet
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-foreground hover:text-primary transition-colors">
                Dashboard
              </Button>
            </Link>
            {mounted  && isConnected ? (
              <Button
                variant="ghost"
                className="gradient-purple text-primary-foreground hover:opacity-90 transition-opacity glow-effect"
                onClick={handleDisconnect}
              >
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="gradient-purple text-primary-foreground hover:opacity-90 transition-opacity glow-effect"
                onClick={handleConnect}
                disabled={isConnecting || isPending}
              >
                {isConnecting || isPending ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
            {error && <div className="text-red-500 text-sm">{error.message}</div>}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

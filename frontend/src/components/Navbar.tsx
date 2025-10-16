"use client"

import Link from "next/link";
import { Button } from "./ui/button";

const Navbar = () => {
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
            <Button variant="ghost" className="gradient-purple text-primary-foreground hover:opacity-90 transition-opacity glow-effect">
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

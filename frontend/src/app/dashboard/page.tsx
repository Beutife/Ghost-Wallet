"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/Navbar";
import StatsCard from "@/components/dashboardCard/StatsCard";
import GhostCard from "@/components/dashboardCard/GhostCard";
import EmptyState from "@/components/dashboardCard/EmptyState";
import CreateGhostModal from "@/components/modals/CreateGhostModal";
import { useGhostWallets } from "@/hooks/useGhostWallets";
import { useSession } from "@/hooks/useSession";
import { Skeleton } from "@/components/ui/skeleton";

interface Ghost {
  address: string;
  name: string;
  balance: string;
  usdValue: string;
  createdAt: number;
  expiresAt: number;
  sessionActive: boolean;
  sessionExpiresAt?: number;
  isExpired: boolean;
  transactions: number;
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { hasPassword } = useSession();
  const { ghosts, stats, loading, refetch } = useGhostWallets(address);
  
  // const [mounted, setMounted] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all");
  const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);



  // Debug logging

  
  useEffect(() => {
    console.log("=== DASHBOARD DEBUG ===");
    console.log("Connected address:", address);
    console.log("Ghosts found:", ghosts.length);
    console.log("Ghosts data:", ghosts);
    console.log("Loading state:", loading);
    console.log("Stats:", stats);
    console.log("======================");
  }, [ghosts, address, loading, stats]);

  // Filter ghosts
  const filteredGhosts = ghosts?.filter((ghost: Ghost) => {
    if (filter === "all") return true;
    if (filter === "active") return ghost.sessionActive && !ghost.isExpired;
    if (filter === "expired") return ghost.isExpired;
    return true;
  });

  // Show skeleton during hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 pt-24 pb-12">
          {/* Skeleton Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
          
          {/* Skeleton Header */}
          <div className="h-20 bg-muted/30 rounded-lg animate-pulse mb-8" />
          
          {/* Skeleton Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show connect wallet message
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 pt-32 text-center">
          <span className="text-6xl mb-4 block">👻</span>
          <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to view your ghost wallets
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-12">
        {/* Privacy Pool Alert */}
        {stats?.privacyPoolBalance === '0' && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You haven't deposited to the Privacy Pool yet. Deposit funds to
              anonymously fund your ghost wallets.
            </AlertDescription>
          </Alert>
        )}


        {/* Stats Cards - Show immediately with loading state */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatsCard 
            icon="" 
            label="Active Ghosts" 
            value={loading ? "..." : stats.activeGhosts} 
          />
          <StatsCard 
            icon="" 
            label="Total Created" 
            value={loading ? "..." : stats.totalCreated} 
          />
          <StatsCard 
            icon="" 
            label="Total Value" 
            value={loading ? "..." : `$${stats.totalValue}`} 
          />
          <StatsCard 
            icon="" 
            label="Gas Saved" 
            value={loading ? "..." : `$${stats.gasSaved}`} 
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Your Ghost Wallets</h1>
            <p className="text-muted-foreground">
              {loading 
                ? "Loading your wallets..." 
                : ghosts.length === 0
                  ? "No ghost wallets yet"
                  : `Manage your ${ghosts.length} temporary wallet${ghosts.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          <Button
            className="gradient-purple text-primary-foreground glow-effect hover:opacity-90 transition-opacity"
            onClick={() => setCreateModalOpen(true)}
            disabled={loading}
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Ghost
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {["all", "active", "expired"].map((tab) => (
            <Button
              key={tab}
              variant={filter === tab ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(tab as typeof filter)}
              className="capitalize"
              disabled={loading}
            >
              {tab}
              {!loading && filter === tab && (
                <span className="ml-2 text-xs opacity-70">
                  ({filteredGhosts.length})
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Ghost Cards */}
        {loading ? (
          // Skeleton cards while loading
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className="h-64 bg-muted/30 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : filteredGhosts.length === 0 ? (
          <EmptyState filter={filter} onCreateClick={() => setCreateModalOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredGhosts.map((ghost: Ghost, index: number) => (
              <GhostCard
                key={ghost.address}
                ghost={ghost}
                index={index}
                onRefetch={refetch}
              />
            ))}
          </div>
        )}

        {/* Show loading indicator at bottom if still loading */}
        {loading && ghosts.length > 0 && (
          <div className="text-center mt-8 text-muted-foreground">
            <div className="animate-spin inline-block text-2xl mb-2">👻</div>
            <p className="text-sm">Loading balances...</p>
          </div>
        )}

        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && !loading && (
          <div className="mt-8 p-4 bg-muted rounded-lg text-xs font-mono">
            <p>Debug Info:</p>
            <p>• Connected: {address}</p>
            <p>• Ghosts Found: {ghosts.length}</p>
            <p>• Filtered: {filteredGhosts.length}</p>
            <p>• Filter: {filter}</p>
          </div>
        )}
      </div>

      <CreateGhostModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => {
          console.log("✅ Ghost created, triggering refetch...");
          refetch();
        }}
      />
    </div>
  );
}
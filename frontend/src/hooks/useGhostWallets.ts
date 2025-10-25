// src/hooks/useGhostWallets.ts
"use client";

import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { CONTRACTS, ERC20_ABI } from "@/lib/contracts";
import { formatUnits } from "viem";


export interface GhostWallet {
  address: `0x${string}`;
  name: string;
  balance: string; // In USDC (e.g., "100.50")
  usdValue: string; // Always same as balance for stablecoin
  createdAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
  sessionActive: boolean;
  sessionExpiresAt?: number;
  isExpired: boolean;
  isDestroyed: boolean;
  transactions: number;
  owner: `0x${string}`;
}

export interface DashboardStats {
  activeGhosts: number;
  totalCreated: number;
  totalValue: string;
  gasSaved: string;
  privacyPoolBalance: string;
}


export function useGhostWallets(userAddress: `0x${string}` | undefined) {
  const publicClient = usePublicClient();
  const [ghosts, setGhosts] = useState<GhostWallet[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeGhosts: 0,
    totalCreated: 0,
    totalValue: "0.00",
    gasSaved: "0.00",
    privacyPoolBalance: "0",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userAddress) {
      loadGhosts();
    } else {
      setLoading(false);
    }
  }, [userAddress]);

  const loadGhosts = async () => {
    if (typeof window === "undefined" || !userAddress) return;

    try {
      setLoading(true);

      // Step 1: Load metadata from localStorage (FAST - no blockchain calls)
      const ghostWallets: GhostWallet[] = [];
      const keys = Object.keys(localStorage);

      for (const key of keys) {
        if (key.startsWith("ghost_metadata_")) {
          const address = key.replace("ghost_metadata_", "");
          const metaStr = localStorage.getItem(key);

          if (metaStr) {
            try {
              const meta = JSON.parse(metaStr);

              // Only load wallets created by this user
              if (meta.creator?.toLowerCase() === userAddress.toLowerCase()) {
                const now = Date.now();
                const createdAt = meta.createdAt || now;
                const duration = meta.duration || 7; // days
                const expiresAt = createdAt + duration * 24 * 60 * 60 * 1000;
                const isExpired = now > expiresAt;

                // Add to list with placeholder balance
                ghostWallets.push({
                  address: address as `0x${string}`,
                  name: meta.name || "Ghost Wallet",
                  balance: "0", // Placeholder - will load async
                  usdValue: "0",
                  createdAt,
                  expiresAt,
                  sessionActive: false,
                  isExpired,
                  transactions: 0,
                  owner: userAddress,
                  isDestroyed: false
                });
              }
            } catch (error) {
              console.error(`Failed to parse metadata for ${address}:`, error);
            }
          }
        }
      }

      // Sort by creation date (newest first)
      ghostWallets.sort((a, b) => b.createdAt - a.createdAt);

      // Set ghosts immediately with placeholder balances
      setGhosts(ghostWallets);
      setLoading(false); // Stop loading indicator

      // Step 2: Load balances asynchronously (background)
      if (publicClient && ghostWallets.length > 0) {
        loadBalancesAsync(ghostWallets);
      } else {
        calculateStats(ghostWallets);
      }
    } catch (error) {
      console.error("Failed to load ghosts:", error);
      setLoading(false);
    }
  };

  const loadBalancesAsync = async (ghostWallets: GhostWallet[]) => {
    if (!publicClient) return;

    try {
      // Load all balances in parallel for speed
      const balancePromises = ghostWallets.map(async (ghost) => {
        try {
          const balance = await publicClient.readContract({
            address: CONTRACTS.USDC,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [ghost.address as `0x${string}`],
          });

          const balanceFormatted = formatUnits(balance as bigint, 6);
          return {
            address: ghost.address,
            balance: balanceFormatted,
            usdValue: balanceFormatted,
          };
        } catch (error) {
          console.error(`Failed to load balance for ${ghost.address}:`, error);
          return {
            address: ghost.address,
            balance: "0",
            usdValue: "0",
          };
        }
      });

      // Wait for all balances
      const balances = await Promise.all(balancePromises);

      // Update ghosts with real balances
      const updatedGhosts = ghostWallets.map((ghost) => {
        const balanceData = balances.find((b) => b.address === ghost.address);
        return {
          ...ghost,
          balance: balanceData?.balance || "0",
          usdValue: balanceData?.usdValue || "0",
        };
      });

      setGhosts(updatedGhosts);
      calculateStats(updatedGhosts);
    } catch (error) {
      console.error("Failed to load balances:", error);
      calculateStats(ghostWallets); // Calculate with placeholder balances
    }
  };

  const calculateStats = (ghostWallets: GhostWallet[]) => {
    const now = Date.now();
    const activeGhosts = ghostWallets.filter(
      (g) => !g.isExpired && now < g.expiresAt
    ).length;

    const totalValue = ghostWallets
      .reduce((sum, g) => sum + parseFloat(g.balance || "0"), 0)
      .toFixed(2);

    // Estimate gas saved (assuming each ghost saves ~$5 in gas fees)
    const gasSaved = (ghostWallets.length * 5).toFixed(2);

    setStats({
      activeGhosts,
      totalCreated: ghostWallets.length,
      totalValue,
      gasSaved,
      privacyPoolBalance: "0", // TODO: Implement privacy pool balance
    });
  };

  const refetch = () => {
    loadGhosts();
  };

  return {
    ghosts,
    stats,
    loading,
    refetch,
  };
}
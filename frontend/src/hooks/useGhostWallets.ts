// src/hooks/useGhostWallets.ts
"use client";

import { useState, useEffect } from "react";
import { useReadContract, usePublicClient } from "wagmi";
import { CONTRACTS, GHOST_FACTORY_ABI, GHOST_WALLET_ABI, ERC20_ABI } from "@/lib/contracts";
import type { GhostWallet, DashboardStats } from "@/types/ghost";
import { formatUnits, isAddress } from "viem";

export function useGhostWallets(userAddress: `0x${string}` | undefined) {
  const [ghosts, setGhosts] = useState<GhostWallet[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeGhosts: 0,
    totalCreated: 0,
    totalValue: "0",
    gasSaved: "0",
    privacyPoolBalance: "0",
  });
  const [loading, setLoading] = useState(true);
  const publicClient = usePublicClient();


  //  Read ghost addresses from contract
  const {
    data: ghostAddresses,
    refetch: refetchAddresses,
    isLoading: isLoadingAddresses,
  } = useReadContract({
    address: CONTRACTS.GHOST_FACTORY,
    abi: GHOST_FACTORY_ABI,
    functionName: "getUserWallets",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  useEffect(() => {
    //  Early return without setState to prevent infinite loops
    if (!ghostAddresses || !publicClient || !userAddress) {
      // Only update if values actually changed
      if (loading) setLoading(false);
      if (ghosts.length > 0) setGhosts([]);
      return;
    }

    let mounted = true; //  Cleanup flag

    const loadGhostDetails = async () => {
      if (!mounted) return;
      setLoading(true);

      try {
        const addresses = ghostAddresses as `0x${string}`[];
        const ghostDetails: GhostWallet[] = [];

        for (const address of addresses) {
          if (!mounted) break; // Check if still mounted
          if (!isAddress(address)) {
            console.warn(`Invalid ghost wallet address: ${address}`);
            continue;
          }

          // Read balance from USDC contract
          const balance = await publicClient.readContract({
            address: CONTRACTS.USDC,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address],
          });

          

          // Read destroyed status
          const isDestroyed = await publicClient.readContract({
            address,
            abi: GHOST_WALLET_ABI,
            functionName: "destroyed",
            args: [],
          });

          // ✅ Safe localStorage access (client-side only)
          let metadata = {};
          if (typeof window !== "undefined") {
            const metadataStr = localStorage.getItem(`ghost_metadata_${address}`);
            metadata = metadataStr ? JSON.parse(metadataStr) : {};
          }

          const createdAt = (metadata as any).createdAt || Date.now() / 1000;
          const duration = (metadata as any).duration || 30;
          const expiresAt = createdAt + duration * 86400;

          ghostDetails.push({
            address,
            name: (metadata as any).name || "Ghost Wallet",
            balance: balance ? formatUnits(balance as bigint, 6) : "0",
            usdValue: balance ? formatUnits(balance as bigint, 6) : "0",
            createdAt,
            expiresAt,
            sessionActive: false, // Will be updated by useSession separately
            isExpired: Date.now() / 1000 > expiresAt,
            isDestroyed: !!isDestroyed,
            transactions: 0,
            owner: userAddress,
          });
        }

        if (!mounted) return; // Final check before setState

        setGhosts(ghostDetails);

        // Calculate stats
        const activeCount = ghostDetails.filter((g) => !g.isExpired).length;
        const totalValue = ghostDetails.reduce(
          (sum, g) => sum + parseFloat(g.usdValue),
          0
        );

        setStats({
          activeGhosts: activeCount,
          totalCreated: ghostDetails.length,
          totalValue: totalValue.toFixed(2),
          gasSaved: "0",
          privacyPoolBalance: "0",
        });
      } catch (error) {
        console.error("Failed to load ghosts:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadGhostDetails();

    // ✅ Cleanup function
    return () => {
      mounted = false;
    };
  }, [ghostAddresses, userAddress, publicClient]); // ✅ Removed getSessionExpiry dependency

  return {
    ghosts,
    stats,
    loading: loading || isLoadingAddresses,
    refetch: refetchAddresses,
  };
}
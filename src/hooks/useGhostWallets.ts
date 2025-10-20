// "use client";

// import { useState, useEffect } from "react";
// import { useAccount, useReadContract } from "wagmi";
// import { CONTRACTS, GHOST_FACTORY_ABI } from "@/lib/contracts";
// import type { GhostWallet, DashboardStats } from "@/types/ghost";
// import { ERC20_ABI } from "@/lib/contracts";

// export function useGhostWallets(userAddress: `0x${string}` | undefined) {

//     //const {address} = useAccount()
//   const [ghosts, setGhosts] = useState<GhostWallet[]>([]);
//   const [stats, setStats] = useState<DashboardStats>({
//     activeGhosts: 0,
//     totalCreated: 0,
//     totalValue: "0",
//     gasSaved: "0",
//     privacyPoolBalance: "0",
//   });
//   const [loading, setLoading] = useState(true);

//   //  Read from smart contract with proper type checking
//   const {
//     data: ghostAddresses,
//     refetch: refetchAddresses,
//     isLoading: isLoadingAddresses,
//   } = useReadContract({
//     address: CONTRACTS.GHOST_FACTORY,
//     abi: GHOST_FACTORY_ABI,
//     functionName: "getUserWallets",
//     args: userAddress ? [userAddress] : undefined,
//     query: {
//       enabled: !!userAddress, // ✅ Only run if userAddress exists
//     },
//   });
   

//   useEffect(() => {
//     //  Guard against undefined
//     if (!ghostAddresses) {
//       setLoading(false);
//       return;
//     }

//     const loadGhostDetails = async () => {
//       setLoading(true);

//       try {
//         //  Type assertion with safety check
//         const addresses = ghostAddresses as `0x${string}`[];
        
//         const ghostPromises = addresses.map(async (address) => {
//           // Get metadata from localStorage
//           const metadataStr = localStorage.getItem(`ghost_metadata_${address}`);
//           const metadata = metadataStr ? JSON.parse(metadataStr) : {};

//            const { data: balance } = useReadContract({
//                 address: CONTRACTS.USDC,
//                 abi: ERC20_ABI,
//                 functionName: "balanceOf",
//                 args: [address],
//                 });

//           return {
//             address,
//             name: metadata.name || "Ghost Wallet",
//             balance: balance ? (Number(balance) / 1e6).toFixed(2) : "0", 
//             usdValue: balance ? (Number(balance) / 1e6).toFixed(2) : "0",
//             createdAt: metadata.createdAt || Date.now() / 1000,
//             expiresAt: (metadata.createdAt || Date.now() / 1000) + (metadata.duration || 30) * 86400,
//             sessionActive: false, 
//             isExpired: false, 
//             isDestroyed: false, 
//             transactions: 0, 
//             owner: userAddress!,
//           } as GhostWallet;
//         });

//         const loadedGhosts = await Promise.all(ghostPromises);
//         setGhosts(loadedGhosts);

//         // Calculate stats
//         const activeCount = loadedGhosts.filter((g) => !g.isExpired).length;
//         const totalValue = loadedGhosts.reduce(
//           (sum, g) => sum + parseFloat(g.usdValue),
//           0
//         );

//         setStats({
//           activeGhosts: activeCount,
//           totalCreated: loadedGhosts.length,
//           totalValue: totalValue.toFixed(2),
//           gasSaved: "0",
//           privacyPoolBalance: "0",
//         });
//       } catch (error) {
//         console.error("Failed to load ghosts:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadGhostDetails();
//   }, [ghostAddresses, userAddress]);

//   const refetch = async () => {
//     await refetchAddresses();
//   };

//   return {
//     ghosts,
//     stats,
//     loading: loading || isLoadingAddresses,
//     refetch,
//   };
// }
// src/hooks/useGhostWallets.ts
"use client";

import { useState, useEffect } from "react";
import { useReadContract, usePublicClient } from "wagmi";
import { CONTRACTS, GHOST_FACTORY_ABI, GHOST_WALLET_ABI, ERC20_ABI } from "@/lib/contracts";
import type { GhostWallet, DashboardStats } from "@/types/ghost";
import { useSession } from "@/hooks/useSession";
import { formatUnits } from "viem";

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
  const { getSessionExpiry } = useSession();
  const publicClient = usePublicClient();

  const { data: ghostAddresses, refetch: refetchAddresses, isLoading: isLoadingAddresses } = useReadContract({
    address: CONTRACTS.GHOST_FACTORY,
    abi: GHOST_FACTORY_ABI,
    functionName: "getUserWallets",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  useEffect(() => {
    if (!ghostAddresses || !publicClient) {
      setLoading(false);
      return;
    }

    const loadGhostDetails = async () => {
      setLoading(true);
      try {
        const addresses = ghostAddresses as `0x${string}`[];
        const ghostDetails: GhostWallet[] = [];

        for (const address of addresses) {
          const balance = await publicClient.readContract({
            address: CONTRACTS.USDC,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address],
          });
          const isDestroyed = await publicClient.readContract({
            address,
            abi: GHOST_WALLET_ABI,
            functionName: "destroyed",
            args: [],
          });
          const metadataStr = localStorage.getItem(`ghost_metadata_${address}`);
          const metadata = metadataStr ? JSON.parse(metadataStr) : {};
          const sessionExpiresAt = getSessionExpiry(address);
          ghostDetails.push({
            address,
            name: metadata.name || "Ghost Wallet",
            balance: balance ? formatUnits(balance as bigint, 6) : "0",
            usdValue: balance ? formatUnits(balance as bigint, 6) : "0",
            createdAt: metadata.createdAt || Date.now() / 1000,
            expiresAt: (metadata.createdAt || Date.now() / 1000) + (metadata.duration || 30) * 86400,
            sessionActive: !!sessionExpiresAt,
            isExpired: Date.now() / 1000 > ((metadata.createdAt || Date.now() / 1000) + (metadata.duration || 30) * 86400),
            isDestroyed: !!isDestroyed,
            transactions: 0,
            owner: userAddress!,
          });
        }

        setGhosts(ghostDetails);
        const activeCount = ghostDetails.filter((g) => !g.isExpired).length;
        const totalValue = ghostDetails.reduce((sum, g) => sum + parseFloat(g.usdValue), 0);
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
        setLoading(false);
      }
    };

    loadGhostDetails();
  }, [ghostAddresses, userAddress, publicClient, getSessionExpiry]);

  return { ghosts, stats, loading: loading || isLoadingAddresses, refetch: refetchAddresses };
}
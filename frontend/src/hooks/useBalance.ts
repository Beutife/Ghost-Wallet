/**
 * FETCHES BALANCE FOR GHOST WALLETS
 * - Reads USDC balance from blockchain
 * - Converts to formatted string
 * - Auto-refreshes on interval
 */
"use client";

import { useReadContract } from "wagmi";
import { CONTRACTS, ERC20_ABI } from "@/lib/contracts";
import { formatUsdc } from "@/lib/utils";

export function useBalance(ghostAddress: `0x${string}` | undefined) {
  // Read USDC balance from contract
  const { data: balance, refetch, isLoading, error } = useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: ghostAddress ? [ghostAddress] : undefined,
    query: {
      enabled: !!ghostAddress,
      // Refresh every 10 seconds
      refetchInterval: 10000,
    },
  });

  // Format balance for display
  const formattedBalance = balance ? formatUsdc(balance) : "0.00";

  return {
    balance: formattedBalance,
    rawBalance: balance || BigInt(0),
    isLoading,
    error,
    refetch,
  };
}
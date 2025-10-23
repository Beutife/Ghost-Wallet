/**
 * FETCHES TRANSACTION HISTORY
 * - Gets transactions from Blockscout API
 * - Formats for display
 * - Categorizes by type
 */
"use client";

import { useState, useEffect } from "react";
import type { Transaction } from "@/types/ghost";

interface BlockscoutTransaction {
  hash: string;
  from: { hash: string };
  to: { hash: string } | null;
  value: string;
  timestamp: string;
  status: "ok" | "error";
}

export function useTransactions(ghostAddress: `0x${string}` | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ghostAddress) {
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        setLoading(true);

        // Fetch from Blockscout API
        const response = await fetch(
          `https://base.blockscout.com/api/v2/addresses/${ghostAddress}/transactions`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch transactions");
        }

        const data = await response.json();

        // Format transactions
        const formatted: Transaction[] = data.items.map((tx: BlockscoutTransaction) => ({
          hash: tx.hash,
          from: tx.from.hash,
          to: tx.to?.hash || ghostAddress,
          value: tx.value,
          timestamp: new Date(tx.timestamp).getTime() / 1000,
          status: tx.status === "ok" ? "success" : "failed",
          type: determineTransactionType(tx, ghostAddress),
        }));

        setTransactions(formatted);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        setError("Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [ghostAddress]);

  // Determine transaction type
  const determineTransactionType = (tx: BlockscoutTransaction, ghostAddress: string): Transaction["type"] => {
    const from = tx.from.hash.toLowerCase();
    const to = tx.to?.hash?.toLowerCase();
    const ghost = ghostAddress.toLowerCase();

    if (from === ghost) return "send";
    if (to === ghost) return "receive";
    return "send";
  };

  // Refresh transactions
  const refetch = () => {
    if (ghostAddress) {
      setLoading(true);
      // Trigger re-fetch by changing state
      setTransactions([]);
    }
  };

  return {
    transactions,
    loading,
    error,
    refetch,
  };
}
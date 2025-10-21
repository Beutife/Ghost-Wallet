/**
 * TYPE DEFINITIONS FOR GHOST WALLETS
 * Defines the shape of data throughout your app
 */

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

export interface Transaction {
  hash: `0x${string}`;
  from: `0x${string}`;
  to: `0x${string}`;
  value: string;
  timestamp: number;
  status: "pending" | "success" | "failed";
  type: "send" | "receive" | "sweep" | "destroy";
}

export interface CreateGhostParams {
  name: string;
  amount: string;
  duration: number; // in seconds
  enableLimits: boolean;
  maxPerTx?: string;
  maxPerDay?: string;
}

export interface FundGhostParams {
  ghostAddress: `0x${string}`;
  amount: string;
  fromPrivacyPool: boolean;
}
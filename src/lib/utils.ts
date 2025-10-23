import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind classes intelligently
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Shorten Ethereum address
 * 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb27 → 0x742d...0bEb27
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format number with commas
 * 1000000 → 1,000,000
 */
export function formatNumber(num: number | string): string {
  return Number(num).toLocaleString("en-US");
}

/**
 * Format USDC amount (6 decimals)
 * 1000000 (raw) → "1.00" (formatted)
 */
export function formatUsdc(amount: bigint | string): string {
  const num = typeof amount === "string" ? BigInt(amount) : amount;
  const formatted = Number(num) / 1e6;
  return formatted.toFixed(2);
}

/**
 * Parse USDC input to raw amount
 * "100.50" → 100500000 (raw with 6 decimals)
 */
export function parseUsdc(amount: string): bigint {
  const num = parseFloat(amount);
  return BigInt(Math.floor(num * 1e6));
}

/**
 * Check if session is active
 */
export function isSessionActive(expiresAt: number): boolean {
  return Date.now() / 1000 < expiresAt;
}

/**
 * Get time remaining in human format
 */
export function getTimeRemaining(expiresAt: number): string {
  const now = Date.now() / 1000;
  const diff = expiresAt - now;

  if (diff <= 0) return "Expired";

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(createdAt: number, expiresAt: number): number {
  const total = expiresAt - createdAt;
  const elapsed = Date.now() / 1000 - createdAt;
  return Math.min((elapsed / total) * 100, 100);
}

/**
 * Get progress color based on percentage
 */
export function getProgressColor(progress: number): string {
  if (progress < 50) return "bg-green-500";
  if (progress < 75) return "bg-amber-500";
  return "bg-red-500";
}

/**
 * Format transaction hash
 */
export function formatTxHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

/**
 * Get Base block explorer URL
 */
export function getExplorerUrl(hash: string, type: "tx" | "address" = "tx"): string {
  const baseUrl = "https://basescan.org";
  return `${baseUrl}/${type}/${hash}`;
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy:", error);
    return false;
  }
}
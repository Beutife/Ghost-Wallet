// lib/blockscout-service.ts
// Blockscout API integration for Ghost Wallet

const BLOCKSCOUT_BASE_URL = "https://base-sepolia.blockscout.com/api/v2";

export interface BlockscoutTransaction {
  hash: string;
  from: {
    hash: string;
  };
  to: {
    hash: string;
  };
  value: string;
  timestamp: string;
  status: string;
  method: string;
  tx_types: string[];
  token_transfers?: Array<{
    token: {
      symbol: string;
      decimals: string;
      address: string;
      name: string;
    };
    total: {
      value: string;
      decimals: string;
    };
    from: {
      hash: string;
    };
    to: {
      hash: string;
    };
    type: string;
  }>;
  fee: {
    value: string;
  };
  gas_used: string;
  block: number;
  confirmation_duration: string;
}

export interface BlockscoutBalance {
  coin_balance: string;
  exchange_rate: string;
  token?: {
    circulating_market_cap: string;
    decimals: string;
    holders: string;
    name: string;
    symbol: string;
    total_supply: string;
    type: string;
  };
}

export interface BlockscoutTokenBalance {
  token: {
    address: string;
    name: string;
    symbol: string;
    decimals: string;
    type: string;
  };
  value: string;
  token_id: string | null;
}

/**
 * Fetch transactions for a given address
 * @param address - Ethereum address to fetch transactions for
 * @param filter - Optional filter: 'to', 'from', or 'to | from'
 * @returns Array of transactions
 */
export async function fetchTransactions(
  address: string,
  filter: string = "to | from"
): Promise<BlockscoutTransaction[]> {
  try {
    const response = await fetch(
      `${BLOCKSCOUT_BASE_URL}/addresses/${address}/transactions?filter=${encodeURIComponent(filter)}`
    );
    
    // if (!response.ok) {
    //   throw new Error(`Blockscout API error: ${response.status}`);
    // }
    
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return [];
  }
}

/**
 * Fetch a single transaction by hash
 * @param txHash - Transaction hash
 * @returns Transaction details
 */
export async function fetchTransaction(
  address: string
): Promise<BlockscoutTransaction[]> {
  try {
    const response = await fetch(
      `https://base-sepolia.blockscout.com/api/v2/addresses/${address}/transactions`
    );
    
    if (!response.ok) return [];
    
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch transaction:", error);
    return [];
  }
}

/**
 * Fetch address balance and info
 * @param address - Ethereum address
 * @returns Balance information
 */
export async function fetchAddressBalance(
  address: string
): Promise<BlockscoutBalance | null> {
  try {
    const response = await fetch(
      `${BLOCKSCOUT_BASE_URL}/addresses/${address}`
    );
    
    if (!response.ok) {
      throw new Error(`Blockscout API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch address balance:", error);
    return null;
  }
}

/**
 * Fetch token balances for an address
 * @param address - Ethereum address
 * @param tokenType - Optional token type filter: 'ERC-20', 'ERC-721', 'ERC-1155'
 * @returns Array of token balances
 */
export async function fetchTokenBalances(
  address: string,
  tokenType?: string
): Promise<BlockscoutTokenBalance[]> {
  try {
    let url = `${BLOCKSCOUT_BASE_URL}/addresses/${address}/tokens`;
    if (tokenType) {
      url += `?type=${encodeURIComponent(tokenType)}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Blockscout API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Failed to fetch token balances:", error);
    return [];
  }
}

/**
 * Fetch token transfers for an address
 * @param address - Ethereum address
 * @param tokenAddress - Optional specific token address to filter by
 * @returns Array of token transfers
 */
export async function fetchTokenTransfers(
  address: string,
  tokenAddress?: string
): Promise<any[]> {
  try {
    let url = `${BLOCKSCOUT_BASE_URL}/addresses/${address}/token-transfers`;
    if (tokenAddress) {
      url += `?token=${tokenAddress}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Blockscout API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Failed to fetch token transfers:", error);
    return [];
  }
}

/**
 * Get USDC balance specifically
 * @param address - Ethereum address
 * @param usdcAddress - USDC token contract address
 * @returns USDC balance as formatted string
 */
export async function fetchUSDCBalance(
  address: string,
  usdcAddress: string
): Promise<string> {
  try {
    const tokenBalances = await fetchTokenBalances(address, "ERC-20");
    const usdcBalance = tokenBalances.find(
      (t) => t.token.address.toLowerCase() === usdcAddress.toLowerCase()
    );
    
    if (usdcBalance) {
      const decimals = parseInt(usdcBalance.token.decimals);
      const balance = parseFloat(usdcBalance.value) / Math.pow(10, decimals);
      return balance.toFixed(2);
    }
    
    return "0.00";
  } catch (error) {
    console.error("Failed to fetch USDC balance:", error);
    return "0.00";
  }
}

/**
 * Format transaction value for display
 * @param tx - Transaction object
 * @returns Formatted value string
 */
export function formatTransactionValue(tx: BlockscoutTransaction): string {
  // Check for token transfers first
  if (tx.token_transfers && tx.token_transfers.length > 0) {
    const transfer = tx.token_transfers[0];
    const value = transfer.total.value;
    const decimals = parseInt(transfer.total.decimals);
    const amount = (parseInt(value) / Math.pow(10, decimals)).toFixed(2);
    return `${amount} ${transfer.token.symbol}`;
  }
  
  // Fallback to ETH value
  if (tx.value && tx.value !== "0") {
    const ethValue = (parseInt(tx.value) / 1e18).toFixed(6);
    return `${ethValue} ETH`;
  }
  
  return "0 ETH";
}

/**
 * Format timestamp to relative time
 * @param timestamp - ISO timestamp string
 * @returns Formatted time string
 */
export function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Check if address is involved in transaction
 * @param tx - Transaction object
 * @param address - Address to check
 * @returns 'sent', 'received', or 'self'
 */
export function getTransactionDirection(
  tx: BlockscoutTransaction,
  address: string
): "sent" | "received" | "self" {
  const from = tx.from.hash.toLowerCase();
  const to = tx.to.hash.toLowerCase();
  const addr = address.toLowerCase();
  
  if (from === addr && to === addr) return "self";
  if (from === addr) return "sent";
  return "received";
}

/**
 * Get explorer URL for transaction
 * @param txHash - Transaction hash
 * @returns Full URL to Blockscout explorer
 */
export function getTransactionUrl(txHash: string): string {
  return `https://base-sepolia.blockscout.com/tx/${txHash}`;
}

/**
 * Get explorer URL for address
 * @param address - Ethereum address
 * @returns Full URL to Blockscout explorer
 */
export function getAddressUrl(address: string): string {
  return `https://base-sepolia.blockscout.com/address/${address}`;
}
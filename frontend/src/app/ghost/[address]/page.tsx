"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePublicClient } from "wagmi";
import { 
  ArrowLeft, 
  Send, 
  Download, 
  Trash2, 
  Copy, 
  ExternalLink, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import SendPaymentModal from "@/components/modals/SendPaymentModal";
import SweepFundsModal from "@/components/modals/SweepFundsModal";
import DestroyWallet from "@/components/modals/DestroyGhostModal";
import { CONTRACTS, ERC20_ABI } from "@/lib/contracts";
import { formatUnits } from "viem";
import { toast } from "sonner";

// Blockscout API integration
const BLOCKSCOUT_API = "https://base-sepolia.blockscout.com/api/v2";

interface BlockscoutTransaction {
  hash: string;
  from: { hash: string };
  to: { hash: string };
  value: string;
  timestamp: string;
  status: string;
  method: string;
  block: number;
  token_transfers?: Array<{
    token: { symbol: string; decimals: string };
    total: { value: string; decimals: string };
    from: { hash: string };
    to: { hash: string };
  }>;
}

export default function GhostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const publicClient = usePublicClient();

  const [mounted, setMounted] = useState(false);
  const [metadata, setMetadata] = useState<any>({});
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(true);
  const [sendOpen, setSendOpen] = useState(false);
  const [sweepOpen, setSweepOpen] = useState(false);
  const [destroyOpen, setDestroyOpen] = useState(false);
  
  // Transaction state
  const [transactions, setTransactions] = useState<BlockscoutTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  
  const ghostAddress = params.address as string;

  useEffect(() => {
    setMounted(true);
    loadData();
  }, [ghostAddress]);

  const loadData = async () => {
    if (typeof window !== "undefined" && ghostAddress) {
      setLoading(true);
      
      // Load metadata
      const metaStr = localStorage.getItem(`ghost_metadata_${ghostAddress}`);
      const meta = metaStr ? JSON.parse(metaStr) : {};
      setMetadata(meta);

      // Load balance from blockchain
      if (publicClient) {
        try {
          const bal = await publicClient.readContract({
            address: CONTRACTS.USDC,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [ghostAddress as `0x${string}`],
          });
          setBalance(formatUnits(bal as bigint, 6));
        } catch (error) {
          console.error("Failed to load balance:", error);
          setBalance("0");
        }
      }

      // Load transactions from Blockscout
      await loadTransactions();
      
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!ghostAddress) return;
    
    setLoadingTx(true);
    try {
      const response = await fetch(
        `${BLOCKSCOUT_API}/addresses/${ghostAddress}/transactions`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (!response.ok) {
        console.warn(`Blockscout returned ${response.status}`);
        setTransactions([]);
        return;
      }

      const data = await response.json();
      const txs = data.items || [];
      setTransactions(txs.slice(0, 10)); // Show last 10 transactions
    } catch (error) {
      console.error("Failed to load transactions:", error);
      setTransactions([]);
    } finally {
      setLoadingTx(false);
    }
  };

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(ghostAddress);
    toast.success("Address copied!");
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadData();
    toast.success("Refreshed!");
  };

  const shortenAddress = (addr: string, chars = 6) => {
    return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString();
  };

  const calculateExpiry = () => {
    if (!metadata.createdAt || !metadata.duration) return "N/A";
    const expiryDate = new Date(metadata.createdAt + metadata.duration * 24 * 60 * 60 * 1000);
    return expiryDate.toLocaleDateString();
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatTransactionValue = (tx: BlockscoutTransaction) => {
    // Check for token transfers
    if (tx.token_transfers && tx.token_transfers.length > 0) {
      const transfer = tx.token_transfers[0];
      const value = transfer.total.value;
      const decimals = parseInt(transfer.total.decimals);
      const amount = (parseInt(value) / Math.pow(10, decimals)).toFixed(2);
      return `${amount} ${transfer.token.symbol}`;
    }

    // Fallback to ETH
    if (tx.value && tx.value !== "0") {
      const ethValue = (parseInt(tx.value) / 1e18).toFixed(6);
      return `${ethValue} ETH`;
    }

    return "0 ETH";
  };

  const getTransactionDirection = (tx: BlockscoutTransaction) => {
    const from = tx.from.hash.toLowerCase();
    const to = tx.to.hash.toLowerCase();
    const addr = ghostAddress.toLowerCase();

    if (from === addr && to === addr) return "self";
    if (from === addr) return "sent";
    return "received";
  };

  const getMethodLabel = (method: string) => {
    if (!method) return "Transfer";
    const methodMap: Record<string, string> = {
      transfer: "Transfer",
      approve: "Approve",
      execute: "Execute",
      multicall: "Batch",
    };
    return methodMap[method] || method;
  };

  if (!mounted) {
    return null;
  }

  if (!ghostAddress) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 pt-32 text-center">
          <h2 className="text-3xl font-bold mb-4">Invalid Ghost Address</h2>
          <Button onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-6 pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">👻</span>
                <h1 className="text-3xl sm:text-4xl font-bold">{metadata.name || "Ghost Wallet"}</h1>
                <Badge className="bg-green-500">Active</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                <p className="font-mono">{shortenAddress(ghostAddress, 10)}</p>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCopyAddress}>
                  <Copy className="h-3 w-3" />
                </Button>
                <a
                  href={`https://base-sepolia.blockscout.com/address/${ghostAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Balance & Transactions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                Current Balance
              </h3>
              <p className="text-4xl font-bold mb-6">
                ${parseFloat(balance).toFixed(2)} USDC
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  className="flex-1"
                  onClick={() => setSendOpen(true)}
                  disabled={parseFloat(balance) === 0}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Payment
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSweepOpen(true)}
                  disabled={parseFloat(balance) === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Sweep Funds
                </Button>
              </div>
            </Card>

            {/* Transaction History Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Transaction History</h3>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadTransactions}
                    disabled={loadingTx}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${loadingTx ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      window.open(`https://base-sepolia.blockscout.com/address/${ghostAddress}`, "_blank")
                    }
                  >
                    View All →
                  </Button>
                </div>
              </div>

              {loadingTx ? (
                <div className="text-center text-muted-foreground py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p className="mb-2">No transactions yet</p>
                  <p className="text-sm">
                    Transactions will appear here after you send or receive funds
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => {
                    const direction = getTransactionDirection(tx);
                    const isIncoming = direction === "received";
                    const isSelf = direction === "self";

                    return (
                      <div
                        key={tx.hash}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() =>
                          window.open(`https://base-sepolia.blockscout.com/tx/${tx.hash}`, "_blank")
                        }
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Icon */}
                            <div
                              className={`p-2 rounded-full flex-shrink-0 ${
                                isSelf
                                  ? "bg-blue-500/20 text-blue-500"
                                  : isIncoming
                                  ? "bg-green-500/20 text-green-500"
                                  : "bg-red-500/20 text-red-500"
                              }`}
                            >
                              {isSelf ? (
                                <RefreshCw className="h-4 w-4" />
                              ) : isIncoming ? (
                                <ArrowDownRight className="h-4 w-4" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4" />
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    isSelf
                                      ? "bg-blue-500/20 text-blue-500 border-blue-500/30"
                                      : isIncoming
                                      ? "bg-green-500/20 text-green-500 border-green-500/30"
                                      : "bg-red-500/20 text-red-500 border-red-500/30"
                                  }`}
                                >
                                  {isSelf ? "Self" : direction}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-blue-500/20 text-blue-500 border-blue-500/30"
                                >
                                  {getMethodLabel(tx.method)}
                                </Badge>
                                {tx.status === "ok" && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-green-500/20 text-green-500 border-green-500/30"
                                  >
                                    ✓
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <span className="truncate">
                                  {isIncoming ? "From" : "To"}:{" "}
                                  {shortenAddress(isIncoming ? tx.from.hash : tx.to.hash)}
                                </span>
                                <span>•</span>
                                <span className="whitespace-nowrap">
                                  {formatRelativeTime(tx.timestamp)}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-xs text-primary hover:underline">
                                View on Blockscout
                                <ExternalLink className="h-3 w-3" />
                              </div>
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="text-right flex-shrink-0">
                            <p
                              className={`font-semibold ${
                                isSelf ? "text-blue-500" : isIncoming ? "text-green-500" : ""
                              }`}
                            >
                              {!isSelf && (isIncoming ? "+" : "-")}
                              {formatTransactionValue(tx)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {transactions.length >= 10 && (
                    <div className="text-center pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `https://base-sepolia.blockscout.com/address/${ghostAddress}`,
                            "_blank"
                          )
                        }
                      >
                        View All on Blockscout →
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Powered by Blockscout */}
              <div className="mt-4 pt-4 border-t text-center">
                <p className="text-xs text-muted-foreground">
                  Powered by{" "}
                  <a
                    href="https://blockscout.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Blockscout
                  </a>
                </p>
              </div>
            </Card>
          </div>

          {/* Right Column - Wallet Info */}
          <div className="space-y-6">
            {/* Wallet Details */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Wallet Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Purpose</p>
                  <p className="font-medium">{metadata.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Initial Funding</p>
                  <p className="font-medium">{metadata.amount || "0"} USDC</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="font-medium">{parseFloat(balance).toFixed(2)} USDC</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(metadata.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{metadata.duration || "0"} days</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expires</p>
                  <p className="font-medium">{calculateExpiry()}</p>
                </div>
              </div>
            </Card>

            {/* Receive Funds */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Receive Funds</h3>
              <div className="bg-white dark:bg-muted p-4 rounded-lg mb-4">
                <div className="aspect-square bg-muted dark:bg-background rounded flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">QR Code</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={handleCopyAddress}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Address
              </Button>
            </Card>

            {/* Danger Zone */}
            <Card className="p-6 border-red-500/50">
              <h3 className="text-lg font-semibold text-red-500 mb-4">⚠️ Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently destroy this ghost wallet.
              </p>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setDestroyOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Destroy Ghost
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SendPaymentModal
        open={sendOpen}
        onOpenChange={setSendOpen}
        ghostAddress={ghostAddress as `0x${string}`}
        balance={balance}
        onSuccess={handleRefresh}
      />

      <SweepFundsModal
        open={sweepOpen}
        onOpenChange={setSweepOpen}
        ghostAddress={ghostAddress as `0x${string}`}
        balance={balance}
        onSuccess={handleRefresh}
      />

      <DestroyWallet
        open={destroyOpen}
        onOpenChange={setDestroyOpen}
        ghostAddress={ghostAddress as `0x${string}`}
        ghostName={metadata.name || "Ghost Wallet"}
        balance={balance}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
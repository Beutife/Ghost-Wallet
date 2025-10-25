"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePublicClient } from "wagmi";
import { ArrowLeft, Send, Download, Trash2, Copy, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import SendPaymentModal from "@/components/modals/SendPaymentModal";
import SweepFundsModal from "@/components/modals/SweepFundsModal";
import { CONTRACTS, ERC20_ABI } from "@/lib/contracts";
import { formatUnits } from "viem";
import { toast } from "sonner";
import DestroyWallet from "@/components/modals/DestroyGhostModal";

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
 const  [destroyOpen, setDestroyOpen] = useState(false);  const ghostAddress = params.address as string;

  useEffect(() => {
    setMounted(true);
    loadData();
  }, [ghostAddress]);

  const loadData = async () => {
    if (typeof window !== "undefined" && ghostAddress) {
      // Load metadata
      const metaStr = localStorage.getItem(`ghost_metadata_${ghostAddress}`);
      const meta = metaStr ? JSON.parse(metaStr) : {};
      setMetadata(meta);

      // Load real balance from blockchain
      setLoading(false);

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
      
    }
  };

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(ghostAddress);
    toast.success("Address copied!");
  };

  const handleRefresh = () => {
    setLoading(true);
    loadData();
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
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">👻</span>
                <h1 className="text-4xl font-bold">{metadata.name || "Ghost Wallet"}</h1>
                <Badge className="bg-green-500">Active</Badge>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <p className="font-mono text-sm">{shortenAddress(ghostAddress, 12)}</p>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCopyAddress}>
                  <Copy className="h-3 w-3" />
                </Button>
                <a
                  href={`https://sepolia.basescan.org/address/${ghostAddress}`}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                Current Balance
              </h3>
              <p className="text-4xl font-bold mb-6">
                ${parseFloat(balance).toFixed(2)} USDC
              </p>

              <div className="flex gap-2">
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

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Transaction History</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open(`https://sepolia.basescan.org/address/${ghostAddress}`, "_blank")}
                >
                  View on Explorer →
                </Button>
              </div>

              <div className="text-center text-muted-foreground py-8">
                <p className="mb-2">View all transactions on BaseScan</p>
                <a
                  href={`https://sepolia.basescan.org/address/${ghostAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Open Block Explorer →
                </a>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
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

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Receive Funds</h3>
              <div className="bg-white p-4 rounded-lg mb-4">
                <div className="aspect-square bg-muted rounded flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">QR Code</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={handleCopyAddress}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Address
              </Button>
            </Card>

            <Card className="p-6 border-red-500/50">
              <h3 className="text-lg font-semibold text-red-500 mb-4">
                ⚠️ Danger Zone
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently destroy this ghost wallet.
              </p>
              <Button variant="destructive" className="w-full" onClick={()=>setDestroyOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Destroy Ghost
              </Button>
            </Card>
          </div>
        </div>
      </div>

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
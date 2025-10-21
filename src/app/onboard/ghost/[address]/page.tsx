"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ArrowLeft, Send, Download, Trash2, PlayCircle, StopCircle, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import { useBalance } from "@/hooks/useBalance";
import { useTransactions } from "@/hooks/useTransactions";
import { useSession } from "@/hooks/useSession";
import StartSessionModal from "@/components/modals/StartSessionModal";
import EndSessionModal from "@/components/modals/EndSessionModal";
import SendPaymentModal from "@/components/modals/SendPaymentModal";
import SweepFundsModal from "@/components/modals/SweepFundsModal";
import DestroyGhostModal from "@/components/modals/DestroyGhostModal";
import { formatDistanceToNow } from "date-fns";
import { shortenAddress, getExplorerUrl, copyToClipboard } from "@/lib/utils";
import { toast } from "sonner";

export default function GhostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address: userAddress } = useAccount();

  const ghostAddress = params.address as `0x${string}`;

  // Hooks
  const { balance } = useBalance(ghostAddress);
  const { transactions, loading: txLoading, refetch: refetchTx } = useTransactions(ghostAddress);
  const { isSessionActive, getSessionExpiry } = useSession();

  // Modals
  const [startSessionOpen, setStartSessionOpen] = useState(false);
  const [endSessionOpen, setEndSessionOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [sweepOpen, setSweepOpen] = useState(false);
  const [destroyOpen, setDestroyOpen] = useState(false);

  // Get ghost metadata from localStorage with fallback
  const metadata = JSON.parse(localStorage.getItem(`ghost_metadata_${ghostAddress}`) || "{}");

  const sessionActive = isSessionActive(ghostAddress);
  const sessionExpiry = getSessionExpiry(ghostAddress);

  const handleCopyAddress = async () => {
    const success = await copyToClipboard(ghostAddress);
    if (success) toast.success("Address copied!");
  };

  const handleRefresh = () => {
    refetchTx();
  };

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

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">👻</span>
                <h1 className="text-4xl font-bold">{metadata.name || "Ghost Wallet"}</h1>
                {sessionActive ? (
                  <Badge className="bg-green-500">Session Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <p className="font-mono">{shortenAddress(ghostAddress, 8)}</p>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCopyAddress}>
                  <Copy className="h-3 w-3" />
                </Button>
                {/* Fix: Wrap ExternalLink button in an anchor tag correctly */}
                <a
                  href={getExplorerUrl(ghostAddress, "address")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              </div>
            </div>

            <div className="flex gap-2">
              {sessionActive ? (
                <Button variant="outline" onClick={() => setEndSessionOpen(true)}>
                  <StopCircle className="mr-2 h-4 w-4" />
                  End Session
                </Button>
              ) : (
                <Button onClick={() => setStartSessionOpen(true)}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Start Session
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Session Alert */}
        {sessionActive && sessionExpiry && (
          <Alert className="mb-6 bg-green-500/10 border-green-500/20">
            <AlertDescription>
              Session active - Expires{" "}
              {formatDistanceToNow(new Date(sessionExpiry * 1000), { addSuffix: true })}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                Current Balance
              </h3>
              {/* Fix: Handle balance as a number or string safely */}
              <p className="text-4xl font-bold mb-6">
                ${parseFloat(balance || "0").toFixed(2)} USDC
              </p>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => setSendOpen(true)}
                  disabled={!sessionActive || parseFloat(balance || "0") === 0}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Payment
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSweepOpen(true)}
                  disabled={parseFloat(balance || "0") === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Sweep Funds
                </Button>
              </div>
            </Card>

            {/* Transaction History */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Transaction History</h3>
                <Button variant="ghost" size="sm" onClick={handleRefresh}>
                  Refresh
                </Button>
              </div>

              {txLoading ? (
                <p className="text-center text-muted-foreground py-8">
                  Loading transactions...
                </p>
              ) : transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No transactions yet
                </p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div
                      key={tx.hash}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={tx.type === "send" ? "default" : "secondary"}>
                            {tx.type}
                          </Badge>
                          <span className="text-sm font-medium">
                            {tx.type === "send" ? "Sent to" : "Received from"}{" "}
                            {shortenAddress(tx.to || tx.from, 8)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(tx.timestamp * 1000), { addSuffix: true })}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">
                          {tx.type === "send" ? "-" : "+"}
                          {parseFloat(tx.value || "0").toFixed(2)} USDC
                        </p>
                        <a
                          href={getExplorerUrl(tx.hash, "tx")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          View →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Details Card */}
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
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {metadata.createdAt
                      ? formatDistanceToNow(new Date(metadata.createdAt), { addSuffix: true })
                      : "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{metadata.duration || "0"} days</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="font-medium">{transactions.length}</p>
                </div>
              </div>
            </Card>

            {/* QR Code Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Receive Funds</h3>
              <div className="bg-white p-4 rounded-lg mb-4">
                {/* Placeholder for QR Code */}
                <div className="aspect-square bg-muted rounded flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">QR Code</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={handleCopyAddress}>
                Copy Address
              </Button>
            </Card>

            {/* Danger Zone */}
            <Card className="p-6 border-red-500/50">
              <h3 className="text-lg font-semibold text-red-500 mb-4">
                ⚠️ Danger Zone
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                This will sweep all funds back to your main wallet and permanently
                destroy this ghost.
              </p>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setDestroyOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Destroy Ghost Wallet
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <StartSessionModal
        open={startSessionOpen}
        onOpenChange={setStartSessionOpen}
        ghostAddress={ghostAddress}
        onSuccess={handleRefresh}
      />

      <EndSessionModal
        open={endSessionOpen}
        onOpenChange={setEndSessionOpen}
        ghostAddress={ghostAddress}
        sessionKey={ghostAddress} // Replace with actual session key in production
        onSuccess={handleRefresh}
      />

      <SendPaymentModal
        open={sendOpen}
        onOpenChange={setSendOpen}
        ghostAddress={ghostAddress}
        balance={balance}
        onSuccess={handleRefresh}
      />

      <SweepFundsModal
        open={sweepOpen}
        onOpenChange={setSweepOpen}
        ghostAddress={ghostAddress}
        balance={balance}
        onSuccess={handleRefresh}
      />

      <DestroyGhostModal
        open={destroyOpen}
        onOpenChange={setDestroyOpen}
        ghostAddress={ghostAddress}
        ghostName={metadata.name || "Ghost Wallet"}
        balance={balance}
        onSuccess={() => router.push("/dashboard")}
      />
    </div>
  );
}
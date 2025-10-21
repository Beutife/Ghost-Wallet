"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Copy, Send, Download, ExternalLink, PlayCircle, StopCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import StartSessionModal from "@/components/modals/StartSessionModal";
import SendPaymentModal from "@/components/modals/SendPaymentModal";
import SweepFundsModal from "@/components/modals/SweepFundsModal";

interface GhostCardProps {
  ghost: {
    address: string;
    name: string;
    balance: string;
    usdValue: string;
    createdAt: number;
    expiresAt: number;
    sessionActive: boolean;
    sessionExpiresAt?: number;
    isExpired: boolean;
    transactions: number;
  };
  index: number;
  onRefetch: () => void;
}

export default function GhostCard({ ghost, index, onRefetch }: GhostCardProps) {
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sweepModalOpen, setSweepModalOpen] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(ghost.address);
    toast.success("Address copied!");
  };

  // Calculate progress
  const totalTime = ghost.expiresAt - ghost.createdAt;
  const elapsed = Date.now() / 1000 - ghost.createdAt;
  const progress = Math.min((elapsed / totalTime) * 100, 100);

  const getProgressColor = () => {
    if (progress < 50) return "bg-green-500";
    if (progress < 75) return "bg-amber-500";
    return "bg-red-500";
  };

  const getStatusBadge = () => {
    if (ghost.isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (ghost.sessionActive) {
      return <Badge variant="default" className="bg-green-500">Session Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  return (
    <>
      <Card
        className="glass-card p-6 hover:scale-105 transition-all hover:glow-effect"
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold">{ghost.name}</h3>
              {getStatusBadge()}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground font-mono">
                {ghost.address.slice(0, 6)}...{ghost.address.slice(-4)}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={copyAddress}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <span className="text-3xl animate-float">👻</span>
        </div>

        {/* Balance */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-1">Balance</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ${ghost.usdValue}
          </p>
          <p className="text-xs text-muted-foreground">{ghost.balance} USDC</p>
        </div>

        {/* Session Status */}
        {ghost.sessionActive && ghost.sessionExpiresAt && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-green-600">
                Session Active
              </p>
              <p className="text-xs text-muted-foreground">
                Expires {formatDistanceToNow(ghost.sessionExpiresAt * 1000, { addSuffix: true })}
              </p>
            </div>
          </div>
        )}

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Wallet Lifetime</p>
            <p className="text-sm font-medium">
              {ghost.isExpired
                ? "Expired"
                : formatDistanceToNow(ghost.expiresAt * 1000, { addSuffix: true })}
            </p>
          </div>
          <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressColor()} transition-all duration-300`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50 mb-4">
          <p className="text-xs text-muted-foreground">
            Created {formatDistanceToNow(ghost.createdAt * 1000, { addSuffix: true })}
          </p>
          <p className="text-xs text-muted-foreground">
            {ghost.transactions} transactions
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {!ghost.isExpired && !ghost.sessionActive && (
            <Button
              size="sm"
              variant="default"
              className="w-full"
              onClick={() => setSessionModalOpen(true)}
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Start Session
            </Button>
          )}
          
          {ghost.sessionActive && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => setSendModalOpen(true)}
            >
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => setSweepModalOpen(true)}
            disabled={parseFloat(ghost.balance) === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Sweep Funds
          </Button>

          <Link href={`/ghost/${ghost.address}`} className="col-span-2">
            <Button size="sm" variant="secondary" className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Details
            </Button>
          </Link>
        </div>
      </Card>

      {/* Modals */}
      <StartSessionModal
        open={sessionModalOpen}
        onOpenChange={setSessionModalOpen}
        ghostAddress={ghost.address}
        onSuccess={onRefetch}
      />

      <SendPaymentModal
        open={sendModalOpen}
        onOpenChange={setSendModalOpen}
        ghostAddress={ghost.address as `0x${string}`}
        balance={ghost.balance}
        onSuccess={onRefetch}
      /> 

      <SweepFundsModal
        open={sweepModalOpen}
        onOpenChange={setSweepModalOpen}
        ghostAddress={ghost.address as `0x${string}`}
        balance={ghost.balance}
        onSuccess={onRefetch}
      />
    </>
  );
}
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Download } from "lucide-react";
import { useAccount, useWriteContract } from "wagmi";
import { GHOST_WALLET_ABI, CONTRACTS, ERC20_ABI } from "@/lib/contracts";
import { parseUsdc } from "@/lib/utils";
import { toast } from "sonner";
import { encodeFunctionData } from "viem";

interface SweepFundsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ghostAddress: `0x${string}`;
  balance: string;
  onSuccess: () => void;
}

export default function SweepFundsModal({
  open,
  onOpenChange,
  ghostAddress,
  balance,
  onSuccess,
}: SweepFundsModalProps) {
  const { address: mainWallet } = useAccount();
  const { writeContract, isPending } = useWriteContract();

  const handleSweep = async () => {
    if (!mainWallet) {
      toast.error("Main wallet not connected");
      return;
    }

    if (parseFloat(balance) <= 0) {
      toast.error("No funds to sweep");
      return;
    }

    try {
      const rawAmount = parseUsdc(balance);

      // Create calldata for USDC transfer to main wallet
      const transferData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [mainWallet, rawAmount],
      });

      // Call ghost wallet execute function
      await writeContract({
        address: ghostAddress,
        abi: GHOST_WALLET_ABI,
        functionName: "execute",
        args: [
          CONTRACTS.USDC, // target (USDC contract)
          BigInt(0), // value (no ETH)
          transferData, // calldata
        ],
      });

      toast.success(`${balance} USDC swept to main wallet!`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to sweep funds:", error);
      toast.error("Failed to sweep funds");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Sweep Funds Back?</DialogTitle>
          <DialogDescription>
            Return all remaining funds to your main wallet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Amount Display */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-lg text-center">
            <Download className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold">{balance} USDC</p>
            <p className="text-sm text-muted-foreground mt-1">
              Will be returned to your main wallet
            </p>
          </div>

          {/* Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The ghost wallet will remain active until it expires, but will have 0 balance.
              You can add more funds later if needed.
            </AlertDescription>
          </Alert>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">From:</span>
              <span className="font-mono">
                {ghostAddress.slice(0, 6)}...{ghostAddress.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">To:</span>
              <span className="font-mono">
                {mainWallet?.slice(0, 6)}...{mainWallet?.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gas fees:</span>
              <span className="text-green-500">FREE ✨</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSweep} disabled={isPending}>
            {isPending ? "Sweeping..." : "Sweep Funds"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
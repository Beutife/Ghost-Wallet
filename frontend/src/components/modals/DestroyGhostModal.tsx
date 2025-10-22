"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useAccount, useWriteContract } from "wagmi";
import { GHOST_WALLET_ABI } from "@/lib/contracts";
import { toast } from "sonner";

interface DestroyGhostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ghostAddress: `0x${string}`;
  ghostName: string;
  balance: string;
  onSuccess: () => void;
}

export default function DestroyGhostModal({
  open,
  onOpenChange,
  ghostAddress,
  ghostName,
  balance,
  onSuccess,
}: DestroyGhostModalProps) {
  const { address: mainWallet } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [confirmed, setConfirmed] = useState(false);

  const handleDestroy = async () => {
    if (!mainWallet) {
      toast.error("Main wallet not connected");
      return;
    }

    if (!confirmed) {
      toast.error("Please confirm you understand this action");
      return;
    }

    try {
      // Call destroy function (automatically sweeps remaining funds)
      await writeContract({
        address: ghostAddress,
        abi: GHOST_WALLET_ABI,
        functionName: "destroy",
        args: [mainWallet], // recipient (main wallet)
      });

      // Clean up local storage
      localStorage.removeItem(`ghost_key_${ghostAddress}`);
      localStorage.removeItem(`ghost_metadata_${ghostAddress}`);
      sessionStorage.removeItem(`session_${ghostAddress}`);

      toast.success("Ghost wallet destroyed 👻💨");
      onSuccess();
      onOpenChange(false);
      setConfirmed(false);
    } catch (error) {
      console.error("Failed to destroy ghost:", error);
      toast.error("Failed to destroy ghost wallet");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Destroy Ghost Wallet?
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This will permanently destroy "{ghostName}"
            </AlertDescription>
          </Alert>

          {/* What Will Happen */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">What will happen:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Remaining balance ({balance} USDC) will be sent to your main wallet</li>
              <li>• Ghost wallet contract will be destroyed</li>
              <li>• All encrypted keys will be deleted locally</li>
              <li>• Transaction history will be cleared</li>
              <li>• This action is permanent and cannot be reversed</li>
            </ul>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-2 bg-muted p-4 rounded-lg">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(!!checked)}
            />
            <Label
              htmlFor="confirm"
              className="text-sm font-normal leading-relaxed cursor-pointer"
            >
              I understand this action is permanent and will destroy this ghost wallet forever
            </Label>
          </div>

          {/* Ghost Info */}
          <div className="text-center py-4 border rounded-lg">
            <span className="text-4xl mb-2 block opacity-50">👻</span>
            <p className="font-semibold">{ghostName}</p>
            <p className="text-sm text-muted-foreground font-mono">
              {ghostAddress.slice(0, 10)}...{ghostAddress.slice(-8)}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDestroy}
            disabled={!confirmed || isPending}
          >
            {isPending ? "Destroying..." : "Destroy Ghost Wallet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
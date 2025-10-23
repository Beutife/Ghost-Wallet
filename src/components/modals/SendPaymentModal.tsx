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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useWriteContract } from "wagmi";
import { encodeFunctionData } from "viem"; 
import { GHOST_WALLET_ABI, CONTRACTS, ERC20_ABI } from "@/lib/contracts";
import { parseUsdc } from "@/lib/utils";
import { toast } from "sonner";
import { isAddress } from "viem";

interface SendPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ghostAddress: `0x${string}`;
  balance: string;
  onSuccess: () => void;
}

export default function SendPaymentModal({
  open,
  onOpenChange,
  ghostAddress,
  balance,
  onSuccess,
}: SendPaymentModalProps) {
  const { writeContract, isPending } = useWriteContract();

  const [formData, setFormData] = useState({
    recipient: "",
    amount: "",
    message: "",
  });

  const [errors, setErrors] = useState({
    recipient: "",
    amount: "",
  });

  const validateForm = () => {
    const newErrors = { recipient: "", amount: "" };
    let isValid = true;

    // Validate recipient
    if (!formData.recipient) {
      newErrors.recipient = "Recipient address is required";
      isValid = false;
    } else if (!isAddress(formData.recipient)) {
      newErrors.recipient = "Invalid Ethereum address";
      isValid = false;
    }

    // Validate amount
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
      isValid = false;
    } else if (parseFloat(formData.amount) > parseFloat(balance)) {
      newErrors.amount = "Insufficient balance";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSend = async () => {
    if (!validateForm()) return;

    try {
      const rawAmount = parseUsdc(formData.amount);

      // Create calldata for USDC transfer
      const transferData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [formData.recipient as `0x${string}`, rawAmount],
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

      toast.success("Payment sent!");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Failed to send payment:", error);
      toast.error("Failed to send payment");
    }
  };

  const resetForm = () => {
    setFormData({ recipient: "", amount: "", message: "" });
    setErrors({ recipient: "", amount: "" });
  };

  const calculateRemaining = () => {
    const remaining = parseFloat(balance) - parseFloat(formData.amount || "0");
    return remaining.toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Payment</DialogTitle>
          <DialogDescription>
            Send USDC from your ghost wallet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipient Address */}
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={formData.recipient}
              onChange={(e) =>
                setFormData({ ...formData, recipient: e.target.value })
              }
            />
            {errors.recipient && (
              <p className="text-sm text-red-500">{errors.recipient}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USDC)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="10.00"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Available: {balance} USDC</span>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => setFormData({ ...formData, amount: balance })}
              >
                Use Max
              </Button>
            </div>
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount}</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a note..."
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              rows={3}
            />
          </div>

          {/* Summary */}
          <div className="bg-muted p-4 rounded-lg space-y-1">
            <p className="text-sm font-semibold">Transaction Summary</p>
            <div className="flex justify-between text-sm">
              <span>Amount:</span>
              <span>{formData.amount || "0.00"} USDC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Gas fees:</span>
              <span className="text-green-500">FREE ✨</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t pt-1">
              <span>Remaining balance:</span>
              <span>{calculateRemaining()} USDC</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isPending}>
            {isPending ? "Sending..." : "Send Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
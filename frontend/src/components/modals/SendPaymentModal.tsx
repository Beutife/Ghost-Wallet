"use client";

import { useState, useEffect } from "react";
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
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { isAddress, parseUnits, encodeFunctionData } from "viem";
import { CONTRACTS, ERC20_ABI, GHOST_WALLET_ABI } from "@/lib/contracts";
import { toast } from "sonner";

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
  const [formData, setFormData] = useState({
    recipient: "",
    amount: "",
    message: "",
  });

  const [errors, setErrors] = useState({
    recipient: "",
    amount: "",
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success("Payment sent successfully!");
      onSuccess();
      onOpenChange(false);
      resetForm();
    }
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Transaction failed");
    }
  }, [error]);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const validateForm = () => {
    const newErrors = { recipient: "", amount: "" };
    let isValid = true;

    if (!formData.recipient) {
      newErrors.recipient = "Recipient address is required";
      isValid = false;
    } else if (!isAddress(formData.recipient)) {
      newErrors.recipient = "Invalid Ethereum address";
      isValid = false;
    }

    const numAmount = parseFloat(formData.amount);
    const numBalance = parseFloat(balance);

    if (!formData.amount || numAmount <= 0) {
      newErrors.amount = "Amount must be greater than 0";
      isValid = false;
    } else if (numAmount > numBalance) {
      newErrors.amount = `Insufficient balance`;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSend = async () => {
    if (!validateForm()) return;

    try {
      const amount = parseUnits(formData.amount, 6); // USDC has 6 decimals

      // Encode USDC transfer call
      const transferData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [formData.recipient as `0x${string}`, amount],
      });

      // Execute through ghost wallet
      writeContract({
        address: ghostAddress,
        abi: GHOST_WALLET_ABI,
        functionName: "execute",
        args: [CONTRACTS.USDC, BigInt(0), transferData],
      });
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
    const numBalance = parseFloat(balance) || 0;
    const numAmount = parseFloat(formData.amount) || 0;
    const remaining = numBalance - numAmount;
    return remaining >= 0 ? remaining.toFixed(2) : "0.00";
  };

  const handleUseMax = () => {
    setFormData({ ...formData, amount: balance });
  };

  const sending = isPending || isConfirming;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Payment</DialogTitle>
          <DialogDescription>
            Send USDC from your ghost wallet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address *</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={formData.recipient}
              onChange={(e) => {
                setFormData({ ...formData, recipient: e.target.value });
                setErrors({ ...errors, recipient: "" });
              }}
              className={errors.recipient ? "border-red-500" : ""}
              disabled={sending}
            />
            {errors.recipient && (
              <p className="text-sm text-red-500">{errors.recipient}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USDC) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="10.00"
              value={formData.amount}
              onChange={(e) => {
                setFormData({ ...formData, amount: e.target.value });
                setErrors({ ...errors, amount: "" });
              }}
              className={errors.amount ? "border-red-500" : ""}
              disabled={sending}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Available: {balance} USDC</span>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={handleUseMax}
                type="button"
                disabled={sending}
              >
                Use Max
              </Button>
            </div>
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount}</p>
            )}
          </div>

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
              disabled={sending}
            />
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-semibold mb-2">Transaction Summary</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Send amount:</span>
              <span className="font-medium">{formData.amount || "0.00"} USDC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Network fees:</span>
              <span className="text-green-500 font-medium">Sponsored </span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="font-semibold">Remaining:</span>
              <span className="font-semibold">{calculateRemaining()} USDC</span>
            </div>
          </div>

          {hash && (
            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Transaction: <a href={`https://sepolia.basescan.org/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="underline">{hash.slice(0, 10)}...</a>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={sending || !formData.recipient || !formData.amount}
          >
            {isPending ? "Confirm in wallet..." : isConfirming ? "Sending..." : "Send Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
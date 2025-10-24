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
import { ExternalLink, CheckCircle2, Clock, Loader2 } from "lucide-react";

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
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        resetForm();
      }, 2000);
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
  const showSuccess = isSuccess && hash;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {showSuccess ? "Payment Sent! 🎉" : "Send Payment"}
          </DialogTitle>
          <DialogDescription>
            {showSuccess 
              ? "Your transaction has been confirmed on the blockchain"
              : "Send USDC from your ghost wallet"
            }
          </DialogDescription>
        </DialogHeader>

        {showSuccess ? (
          // Success view
          <div className="space-y-4 py-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Transaction Successful</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sent {formData.amount} USDC to{" "}
                {formData.recipient.slice(0, 6)}...{formData.recipient.slice(-4)}
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                  <p className="font-mono text-xs break-all">{hash}</p>
                </div>
              </div>
              <a
                href={`https://sepolia.basescan.org/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 mt-3"
              >
                View on Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {formData.message && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Message</p>
                <p className="text-sm">{formData.message}</p>
              </div>
            )}
          </div>
        ) : (
          // Form view
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
                <span className="text-green-500 font-medium">Sponsored ✨</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="font-semibold">Remaining:</span>
                <span className="font-semibold">{calculateRemaining()} USDC</span>
              </div>
            </div>

            {hash && !isSuccess && (
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Transaction Pending...
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Hash: {hash.slice(0, 10)}...{hash.slice(-8)}
                </p>
                <a
                  href={`https://sepolia.basescan.org/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600"
                >
                  Track on Explorer
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {showSuccess ? (
            <Button 
              onClick={() => {
                onSuccess();
                onOpenChange(false);
                resetForm();
              }}
              className="w-full"
            >
              Done
            </Button>
          ) : (
            <>
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
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirm in wallet...
                  </>
                ) : isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Payment"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
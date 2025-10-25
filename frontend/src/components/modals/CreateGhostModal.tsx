// src/components/modals/CreateGhostModal.tsx
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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { CONTRACTS, GHOST_FACTORY_ABI, ERC20_ABI } from "@/lib/contracts";
import { generateEphemeralKey, encryptEphemeralKey } from "@/lib/ephemeral-keys";
import { toast } from "sonner";
import { parseUnits, parseEventLogs } from "viem";

interface CreateGhostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateGhostModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateGhostModalProps) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    duration: 3,
    enableLimits: false,
    maxPerTx: "",
    maxPerDay: "",
  });

  const [step, setStep] = useState<"form" | "password" | "creating">("form");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creatingStep, setCreatingStep] = useState("");

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  if (!publicClient) {
    return null;
  }

  const durations = [
    { label: "1 Day", value: 1 },
    { label: "3 Days", value: 3 },
    { label: "7 Days", value: 7 },
    { label: "30 Days", value: 30 },
  ];

  const quickAmounts = [50, 100, 200, 500];

  const parseUsdc = (amount: string) => {
    return parseUnits(amount, 6);
  };

  const handleCreate = async () => {
    if (!address) {
      toast.error("Please connect wallet");
      return;
    }

    if (!formData.name || !formData.amount) {
      toast.error("Please fill required fields");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    setStep("password");
  };

  const handleConfirmCreate = async () => {
    if (!password) {
      toast.error("Please enter your master password");
      return;
    }

    setStep("creating");
    setError(null);

    try {
      // 1. Generate ephemeral keypair
      setCreatingStep("Generating secure keys...");
      const ephemeralKey = generateEphemeralKey();

      // 2. Encrypt private key with password
      setCreatingStep("Encrypting keys...");
      const encryptedKey = await encryptEphemeralKey(ephemeralKey.privateKey, password);

      // 3. Call factory to create ghost wallet
      setCreatingStep("Creating ghost wallet on-chain...");
      const maxPerTx = formData.enableLimits && formData.maxPerTx 
        ? parseUsdc(formData.maxPerTx) 
        : BigInt(0);
      const maxPerDay = formData.enableLimits && formData.maxPerDay 
        ? parseUsdc(formData.maxPerDay) 
        : BigInt(0);
      
      const txHash = await writeContractAsync({
        address: CONTRACTS.GHOST_FACTORY,
        abi: GHOST_FACTORY_ABI,
        functionName: "createGhost",
        args: [address as `0x${string}`],
      });

      // 4. Get ghost wallet address from transaction receipt
      setCreatingStep("Confirming transaction...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      if (receipt.status !== "success") {
        throw new Error(`Transaction failed: ${receipt.status}`);
      }

      const logs = parseEventLogs({
        abi: GHOST_FACTORY_ABI, 
        eventName: "GhostCreated",
        logs: receipt.logs,
      });
      
      const event = logs.find((log) => log.eventName === "GhostCreated");

      if (!event || !event.args.wallet) {
        console.error("Transaction receipt logs:", receipt.logs);
        throw new Error("Failed to retrieve ghost wallet address.");
      }

      const ghostAddress = event.args.wallet;
      console.log("✅ Ghost wallet created:", ghostAddress);

      // 5. Fund ghost wallet with USDC
      if (formData.amount) {
        setCreatingStep("Funding ghost wallet...");
        await writeContractAsync({
          address: CONTRACTS.USDC,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [ghostAddress, parseUsdc(formData.amount)],
        });
      }

      // 6. Store encrypted key and metadata locally
      setCreatingStep("Saving locally...");
      if (typeof window !== "undefined") {
        localStorage.setItem(`ghost_key_${ghostAddress}`, encryptedKey);
        
        const metadata = {
          name: formData.name,
          amount: formData.amount,
          duration: formData.duration,
          createdAt: Date.now(),
          creator: address, // 👈 CRITICAL: Save creator address
        };
        
        localStorage.setItem(
          `ghost_metadata_${ghostAddress}`,
          JSON.stringify(metadata)
        );
        
        console.log("✅ Metadata saved:", metadata);
      }

      toast.success("Ghost wallet created successfully! 👻");
      
      // Wait a bit before closing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess(); // Trigger refetch
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Failed to create ghost:", error);
      const errorMessage = error.message || "Failed to create ghost wallet";
      setError(errorMessage);
      toast.error(errorMessage);
      setStep("form");
      setCreatingStep("");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      amount: "",
      duration: 3,
      enableLimits: false,
      maxPerTx: "",
      maxPerDay: "",
    });
    setPassword("");
    setError(null);
    setStep("form");
    setCreatingStep("");
  };

  const calculateExpiry = () => {
    const days = formData.duration;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    return expiry.toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">👻</span>
            Create Ghost Wallet
          </DialogTitle>
          <DialogDescription>
            Set up your temporary wallet with custom parameters
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "form" && (
          <div className="space-y-4 py-4">
            {/* Wallet Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Wallet Purpose <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Conference Spending"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Give your ghost a memorable name
              </p>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount to Fund (USDC) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="100"
                min="0.01"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
              <div className="flex gap-2 flex-wrap">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormData({ ...formData, amount: amount.toString() })
                    }
                    type="button"
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="grid grid-cols-2 gap-2">
                {durations.map((d) => (
                  <Button
                    key={d.value}
                    type="button"
                    variant={formData.duration === d.value ? "default" : "outline"}
                    onClick={() =>
                      setFormData({ ...formData, duration: d.value })
                    }
                  >
                    {d.label}
                  </Button>
                ))}
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Wallet expires on {calculateExpiry()}. Remaining funds auto-return.
                </AlertDescription>
              </Alert>
            </div>

            {/* Spending Limits */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="limits"
                  checked={formData.enableLimits}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enableLimits: !!checked })
                  }
                />
                <Label htmlFor="limits" className="cursor-pointer">
                  Enable spending limits (Optional)
                </Label>
              </div>

              {formData.enableLimits && (
                <div className="space-y-2 pl-6 pt-2">
                  <div>
                    <Label htmlFor="maxPerTx">Max per transaction</Label>
                    <Input
                      id="maxPerTx"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="50"
                      value={formData.maxPerTx}
                      onChange={(e) =>
                        setFormData({ ...formData, maxPerTx: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxPerDay">Max per day</Label>
                    <Input
                      id="maxPerDay"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="200"
                      value={formData.maxPerDay}
                      onChange={(e) =>
                        setFormData({ ...formData, maxPerDay: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-muted p-4 rounded-lg space-y-1">
              <p className="text-sm font-semibold mb-2">📋 Summary</p>
              <p className="text-sm">• Funding: {formData.amount || "0"} USDC</p>
              <p className="text-sm">• Duration: {formData.duration} days</p>
              <p className="text-sm">• Expires: {calculateExpiry()}</p>
            </div>
          </div>
        )}

        {step === "password" && (
          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Enter your master password to encrypt your ghost wallet keys
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="password">Master Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your master password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && password) {
                    handleConfirmCreate();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
        )}

        {step === "creating" && (
          <div className="space-y-6 py-8 text-center">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">👻</span>
              </div>
            </div>
            <div>
              <p className="font-semibold text-lg mb-2">Creating your ghost wallet...</p>
              {creatingStep && (
                <p className="text-sm text-muted-foreground animate-pulse">
                  {creatingStep}
                </p>
              )}
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please don't close this window. This may take a minute.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
          {step === "form" && (
            <>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={!formData.name || !formData.amount}
                type="button"
              >
                Continue →
              </Button>
            </>
          )}

          {step === "password" && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setStep("form")}
                type="button"
              >
                ← Back
              </Button>
              <Button 
                onClick={handleConfirmCreate} 
                disabled={!password}
                type="button"
              >
                Create Ghost Wallet
              </Button>
            </>
          )}

          {step === "creating" && (
            <Button disabled className="w-full">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
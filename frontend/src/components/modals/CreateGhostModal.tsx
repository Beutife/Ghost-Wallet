// src/components/modals/CreateGhostModal.tsx
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

  if (!publicClient) {
    return <p>Loading public client...</p>;
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
      const ephemeralKey = generateEphemeralKey();

      // 2. Encrypt private key with password
      const encryptedKey = await encryptEphemeralKey(ephemeralKey.privateKey, password);

      // 3. Call factory to create ghost wallet
      const durationInSeconds = formData.duration * 24 * 60 * 60; // Convert days to seconds const maxPerTx = formData.enableLimits && formData.maxPerTx ? parseUsdc(formData.maxPerTx) : BigInt(0); const maxPerDay = formData.enableLimits && formData.maxPerDay ? parseUsdc(formData.maxPerDay) : BigInt(0);
      const maxPerTx = formData.enableLimits && formData.maxPerTx ? parseUsdc(formData.maxPerTx) : BigInt(0);
      const maxPerDay = formData.enableLimits && formData.maxPerDay ? parseUsdc(formData.maxPerDay) : BigInt(0);
      
      const txHash = await writeContractAsync({
        address: CONTRACTS.GHOST_FACTORY,
        abi: GHOST_FACTORY_ABI,
        functionName: "createGhost",
        args: [address as `0x${string}`],
        //gas: BigInt(1000000n), // Increase gas limit to prevent out-of-gas errors
      });

      // 4. Get ghost wallet address from transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") {
        throw new Error(`Transaction failed: ${receipt.status}`);
      }

      const ghostCreatedEvent = [
        {
          type: "event",
          name: "GhostCreated",
          inputs: [
            { name: "owner", type: "address", indexed: true },
            { name: "wallet", type: "address", indexed: true },
          ],
        },
      ] as const;
      const logs = parseEventLogs({
        abi: GHOST_FACTORY_ABI, // Use full ABI to ensure compatibility
        eventName: "GhostCreated",
        logs: receipt.logs,
      });
      const event = logs.find((log) => log.eventName === "GhostCreated");

      if (!event || !event.args.wallet) {
        console.error("Transaction receipt logs:", receipt.logs);
        throw new Error("Failed to retrieve ghost wallet address. Check contract ABI and event emission.");
      }

      const ghostAddress = event.args.wallet;

      // 5. Fund ghost wallet with USDC
      if (formData.amount) {
        await writeContractAsync({
          address: CONTRACTS.USDC,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [ghostAddress, parseUsdc(formData.amount)],
        });
      }

      // 6. Store encrypted key and metadata locally
      if (typeof window !== "undefined") {
        localStorage.setItem(`ghost_key_${ghostAddress}`, encryptedKey);
        localStorage.setItem(
          `ghost_metadata_${ghostAddress}`,
          JSON.stringify({
            name: formData.name,
            amount: formData.amount,
            duration: formData.duration,
            createdAt: Date.now(),
          })
        );
      }

      toast.success("Ghost wallet created!");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Failed to create ghost:", error);
      setError(error.message || "Failed to create ghost wallet");
      toast.error(error.message || "Failed to create ghost wallet");
      setStep("form");
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
  };

  const calculateExpiry = () => {
    const days = formData.duration;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    return expiry.toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Ghost Wallet</DialogTitle>
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
              <Label htmlFor="name">Wallet Purpose (Optional)</Label>
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
              <Label htmlFor="amount">Amount to Fund (USDC)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="100"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
              <div className="flex gap-2">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormData({ ...formData, amount: amount.toString() })
                    }
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
                <Label htmlFor="limits">Enable spending limits</Label>
              </div>

              {formData.enableLimits && (
                <div className="space-y-2 pl-6">
                  <div>
                    <Label>Max per transaction</Label>
                    <Input
                      type="number"
                      placeholder="50"
                      value={formData.maxPerTx}
                      onChange={(e) =>
                        setFormData({ ...formData, maxPerTx: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Max per day</Label>
                    <Input
                      type="number"
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
              <p className="text-sm font-semibold">Summary</p>
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
                Enter your master password 
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
              />
            </div>
          </div>
        )}

        {step === "creating" && (
          <div className="space-y-4 py-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto" />
            <div>
              <p className="font-semibold">Creating ghost wallet...</p>
              {/* <p className="text-sm text-muted-foreground mt-2">
                1. Generating ephemeral keys...
              </p>
              <p className="text-sm text-muted-foreground">
                2. Deploying wallet contract...
              </p>
              <p className="text-sm text-muted-foreground">
                3. Encrypting keys locally...
              </p> */}
            </div>
          </div>
        )}

        <DialogFooter className="sticky bottom-0 bg-background pt-4">
          {step === "form" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Continue</Button>
            </>
          )}

          {step === "password" && (
            <>
              <Button variant="outline" onClick={() => setStep("form")}>
                Back
              </Button>
              <Button onClick={handleConfirmCreate} disabled={!password}>
                Create Ghost Wallet
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
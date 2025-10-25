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
import { AlertCircle, Loader2, Coins, CheckCircle2, ArrowRight } from "lucide-react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { CONTRACTS, GHOST_FACTORY_ABI, ERC20_ABI } from "@/lib/contracts";
import { generateEphemeralKey, encryptEphemeralKey } from "@/lib/ephemeral-keys";
import { toast } from "sonner";
import { parseUnits, parseEventLogs, formatUnits } from "viem";

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

  const [step, setStep] = useState<"checking" | "mint" | "form" | "password" | "creating">("checking");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creatingStep, setCreatingStep] = useState("");
  const [usdcBalance, setUsdcBalance] = useState<string>("0");
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [minting, setMinting] = useState(false);

  const durations = [
    { label: "1 Day", value: 1 },
    { label: "3 Days", value: 3 },
    { label: "7 Days", value: 7 },
    { label: "30 Days", value: 30 },
  ];

  const quickAmounts = [50, 100, 200, 500];

  const parseUsdc = (amount: string) => parseUnits(amount, 6);

  // Check USDC balance when modal opens
  const checkUsdcBalance = async () => {
    if (!address || !publicClient) return;
    
    setBalanceLoading(true);
    try {
      const balance = await publicClient.readContract({
        address: CONTRACTS.USDC,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
      });
      
      const formattedBalance = formatUnits(balance as bigint, 6);
      setUsdcBalance(formattedBalance);
      
      // If balance is 0, show mint step
      if (parseFloat(formattedBalance) === 0) {
        setStep("mint");
      } else {
        setStep("form");
      }
    } catch (err) {
      console.error("Failed to check USDC balance:", err);
      toast.error("Failed to check USDC balance");
      setStep("form"); // Allow them to proceed anyway
    } finally {
      setBalanceLoading(false);
    }
  };

  // Check balance when modal opens
  useEffect(() => {
    if (open && address) {
      setStep("checking");
      checkUsdcBalance();
    }
  }, [open, address]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleMint = async () => {
    if (!address || !publicClient) {
      toast.error("Please connect wallet");
      return;
    }

    setMinting(true);
    try {
      toast.info("Minting 1000 MockUSDC...");
      
      const txHash = await writeContractAsync({
        address: CONTRACTS.USDC,
        abi: ERC20_ABI,
        functionName: "mint",
        args: [address, parseUsdc("1000")],
      });

      toast.info("Confirming transaction...");
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      toast.success("✅ 1000 MockUSDC minted successfully!");
      
      // Refresh balance
      await checkUsdcBalance();
      
      // Move to form if balance is now > 0
      const newBalance = parseFloat(usdcBalance);
      if (newBalance > 0) {
        setStep("form");
      }
    } catch (err: any) {
      console.error("Failed to mint USDC:", err);
      toast.error(err.message || "Failed to mint MockUSDC");
    } finally {
      setMinting(false);
    }
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

    // Check if user has enough balance
    const userBalance = parseFloat(usdcBalance);
    if (userBalance < amount) {
      toast.error(`Insufficient USDC. You have ${usdcBalance} USDC but need ${amount} USDC`);
      setStep("mint");
      return;
    }

    setStep("password");
  };

  const handleConfirmCreate = async () => {
    if (!password || !publicClient) {
      toast.error("Please enter your master password");
      return;
    }

    setStep("creating");
    setError(null);

    try {
      // Generate ephemeral keypair
      setCreatingStep("Generating secure keys...");
      const ephemeralKey = generateEphemeralKey();

      // Encrypt private key
      setCreatingStep("Encrypting keys...");
      const encryptedKey = await encryptEphemeralKey(ephemeralKey.privateKey, password);

      // Create ghost wallet
      setCreatingStep("Creating ghost wallet on-chain...");
      const txHash = await writeContractAsync({
        address: CONTRACTS.GHOST_FACTORY,
        abi: GHOST_FACTORY_ABI,
        functionName: "createGhost",
        args: [address as `0x${string}`],
      });

      // Wait for confirmation
      setCreatingStep("Confirming transaction...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      if (receipt.status !== "success") {
        throw new Error(`Transaction failed: ${receipt.status}`);
      }

      // Get ghost address from events
      const logs = parseEventLogs({
        abi: GHOST_FACTORY_ABI,
        eventName: "GhostCreated",
        logs: receipt.logs,
      });

      const event = logs.find((log) => log.eventName === "GhostCreated");
      if (!event || !event.args.wallet) {
        throw new Error("Failed to retrieve ghost wallet address.");
      }

      const ghostAddress = event.args.wallet;
      console.log("✅ Ghost wallet created:", ghostAddress);

      // Fund ghost wallet
      setCreatingStep("Funding ghost wallet...");
      const fundTxHash = await writeContractAsync({
        address: CONTRACTS.USDC,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [ghostAddress, parseUsdc(formData.amount)],
      });

      await publicClient.waitForTransactionReceipt({ hash: fundTxHash });

      // Save locally
      setCreatingStep("Saving locally...");
      if (typeof window !== "undefined") {
        localStorage.setItem(`ghost_key_${ghostAddress}`, encryptedKey);
        
        const metadata = {
          name: formData.name,
          amount: formData.amount,
          duration: formData.duration,
          createdAt: Date.now(),
          creator: address, // CRITICAL: Save creator address
        };
        
        localStorage.setItem(
          `ghost_metadata_${ghostAddress}`,
          JSON.stringify(metadata)
        );
        
        console.log(" Metadata saved:", metadata);
      }

      toast.success("Ghost wallet created successfully! 👻");
      
      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      console.error("Failed to create ghost:", err);
      const errorMessage = err.message || "Failed to create ghost wallet";
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
    setStep("checking");
    setCreatingStep("");
    setUsdcBalance("0");
    setBalanceLoading(true);
  };

  const calculateExpiry = () => {
    const days = formData.duration;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    return expiry.toLocaleDateString();
  };

  if (!publicClient) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <span className="text-2xl sm:text-3xl">👻</span>
            Create Ghost Wallet
          </DialogTitle>
          <DialogDescription className="text-sm">
            Set up your temporary wallet with custom parameters
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Checking Balance Step */}
        {step === "checking" && (
          <div className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">Checking your USDC balance...</p>
          </div>
        )}

        {/* Mint USDC Step */}
        {step === "mint" && (
          <div className="py-6 space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                <Coins className="h-8 w-8 text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No MockUSDC Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You need MockUSDC to fund your ghost wallet. Click below to mint free testnet tokens.
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Current Balance:</strong> {usdcBalance} USDC
                <br />
                <strong>You'll receive:</strong> 1000 MockUSDC (testnet only)
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleMint}
                disabled={minting}
                size="lg"
                className="w-full"
              >
                {minting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Minting...
                  </>
                ) : (
                  <>
                    <Coins className="mr-2 h-4 w-4" />
                    Mint 1000 MockUSDC
                  </>
                )}
              </Button>

              {parseFloat(usdcBalance) > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setStep("form")}
                  size="lg"
                  className="w-full"
                >
                  Continue with Current Balance
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>

            <p className="text-xs text-center text-muted-foreground">
              This is testnet MockUSDC with no real value
            </p>
          </div>
        )}

        {/* Form Step */}
        {step === "form" && (
          <div className="space-y-4 py-4">
            {/* Balance Display */}
            <Alert className="bg-green-500/10 border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-sm">
                <strong>Available Balance:</strong> {parseFloat(usdcBalance).toFixed(2)} USDC
              </AlertDescription>
            </Alert>

            {/* Wallet Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Wallet Purpose <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Conference Spending"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Give your ghost a memorable name
              </p>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">
                Amount to Fund (USDC) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="100"
                min="0.01"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="text-sm"
              />
              <div className="flex gap-2 flex-wrap">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, amount: amount.toString() })}
                    type="button"
                    className="text-xs"
                    disabled={parseFloat(usdcBalance) < amount}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
              {parseFloat(formData.amount) > parseFloat(usdcBalance) && (
                <p className="text-xs text-red-500">
                  Insufficient balance. You need {formData.amount} USDC but only have {usdcBalance} USDC.
                </p>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Duration</Label>
              <div className="grid grid-cols-2 gap-2">
                {durations.map((d) => (
                  <Button
                    key={d.value}
                    type="button"
                    variant={formData.duration === d.value ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, duration: d.value })}
                    className="text-sm"
                  >
                    {d.label}
                  </Button>
                ))}
              </div>
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Wallet expires on <strong>{calculateExpiry()}</strong>. Remaining funds auto-return.
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
                <Label htmlFor="limits" className="cursor-pointer text-sm">
                  Enable spending limits (Optional)
                </Label>
              </div>

              {formData.enableLimits && (
                <div className="space-y-3 pl-6 pt-2">
                  <div className="space-y-1">
                    <Label htmlFor="maxPerTx" className="text-sm">Max per transaction</Label>
                    <Input
                      id="maxPerTx"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="50"
                      value={formData.maxPerTx}
                      onChange={(e) => setFormData({ ...formData, maxPerTx: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="maxPerDay" className="text-sm">Max per day</Label>
                    <Input
                      id="maxPerDay"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="200"
                      value={formData.maxPerDay}
                      onChange={(e) => setFormData({ ...formData, maxPerDay: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-muted p-4 rounded-lg space-y-1">
              <p className="text-sm font-semibold mb-2">📋 Summary</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Funding:</span>
                  <span className="font-medium">{formData.amount || "0"} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{formData.duration} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires:</span>
                  <span className="font-medium">{calculateExpiry()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Remaining:</span>
                  <span className="font-medium">
                    {(parseFloat(usdcBalance) - parseFloat(formData.amount || "0")).toFixed(2)} USDC
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Password Step */}
        {step === "password" && (
          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Enter your master password to encrypt your ghost wallet keys locally
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Master Password</Label>
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
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This password encrypts your keys and is stored only on your device
              </p>
            </div>
          </div>
        )}

        {/* Creating Step */}
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
              <AlertDescription className="text-sm">
                Please don't close this window. This may take a minute.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t flex-col sm:flex-row gap-2">
          {step === "mint" && (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              type="button"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          )}

          {step === "form" && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  if (parseFloat(usdcBalance) === 0) {
                    setStep("mint");
                  } else {
                    onOpenChange(false);
                  }
                }}
                type="button"
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.name || !formData.amount || parseFloat(formData.amount) > parseFloat(usdcBalance)}
                type="button"
                className="w-full sm:w-auto"
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {step === "password" && (
            <>
              <Button
                variant="outline"
                onClick={() => setStep("form")}
                type="button"
                className="w-full sm:w-auto"
              >
                ← Back
              </Button>
              <Button
                onClick={handleConfirmCreate}
                disabled={!password}
                type="button"
                className="w-full sm:w-auto"
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
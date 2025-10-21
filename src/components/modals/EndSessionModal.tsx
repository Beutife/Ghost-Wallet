// "use client";

// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { AlertCircle, Loader2 } from "lucide-react";
// import { useWriteContract, usePublicClient } from "wagmi";
// import { CONTRACTS, GHOST_FACTORY_ABI } from "@/lib/contracts";
// import { toast } from "sonner";
// import { parseEventLogs } from "viem";

// // Define props interface to fix TypeScript error
// interface EndSessionModalProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   ghostAddress: `0x${string}`;
//   sessionKey: `0x${string}`;
//   onSuccess: () => void;
// }

// export default function EndSessionModal({
//   open,
//   onOpenChange,
//   ghostAddress,
//   sessionKey,
//   onSuccess,
// }: EndSessionModalProps) {
//   const { writeContractAsync } = useWriteContract();
//   const publicClient = usePublicClient();
//   const [password, setPassword] = useState("");
//   const [step, setStep] = useState<"password" | "ending">("password");

//   // Check if publicClient is available
//   if (!publicClient) {
//     return <p>Loading public client...</p>;
//   }

//   const handleEndSession = async () => {
//     if (!password) {
//       toast.error("Please enter your master password");
//       return;
//     }

//     setStep("ending");

//     try {
//       const txHash = await writeContractAsync({
//         address: ghostAddress, // Use ghostAddress as the contract address
//         abi: GHOST_FACTORY_ABI, // Replace with your ghost wallet ABI if different
//         functionName: "createGhost", // Adjust to your contract's function name
//         args: [sessionKey], // Pass sessionKey or other required args
//       });

//       // Get confirmation from transaction receipt
//       const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
//       const sessionEndedEvent = [
//         {
//           type: "event",
//           name: "SessionEnded",
//           inputs: [{ name: "ghostAddress", type: "address", indexed: true }],
//         },
//       ] as const;
//       const logs = parseEventLogs({
//         abi: sessionEndedEvent,
//         logs: receipt.logs,
//       });
//       const event = logs.find((log) => log.eventName === "SessionEnded");

//       if (!event || !event.args.ghostAddress) {
//         throw new Error("Failed to confirm session end");
//       }

//       toast.success("Session ended successfully!");
//       onSuccess();
//       onOpenChange(false);
//       setPassword("");
//       setStep("password");
//     } catch (error) {
//       console.error("Failed to end session:", error);
//       toast.error("Failed to end session");
//       setStep("password");
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[425px]">
//         <DialogHeader>
//           <DialogTitle>End Ghost Wallet Session</DialogTitle>
//           <DialogDescription>
//             Confirm your master password to end the session for this ghost wallet.
//           </DialogDescription>
//         </DialogHeader>

//         {step === "password" && (
//           <div className="space-y-4 py-4">
//             <Alert>
//               <AlertCircle className="h-4 w-4" />
//               <AlertDescription>
//                 This action will end the session for the wallet at {ghostAddress.slice(0, 6)}...
//                 {ghostAddress.slice(-4)}. Remaining funds will be returned.
//               </AlertDescription>
//             </Alert>

//             <div className="space-y-2">
//               <Label htmlFor="password">Master Password</Label>
//               <Input
//                 id="password"
//                 type="password"
//                 placeholder="Enter your master password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//               />
//             </div>
//           </div>
//         )}

//         {step === "ending" && (
//           <div className="space-y-4 py-8 text-center">
//             <Loader2 className="h-12 w-12 animate-spin mx-auto" />
//             <div>
//               <p className="font-semibold">Ending session...</p>
//               <p className="text-sm text-muted-foreground mt-2">
//                 Processing transaction to end the session...
//               </p>
//             </div>
//           </div>
//         )}

//         <DialogFooter>
//           {step === "password" && (
//             <>
//               <Button variant="outline" onClick={() => onOpenChange(false)}>
//                 Cancel
//               </Button>
//               <Button onClick={handleEndSession} disabled={!password}>
//                 End Session
//               </Button>
//             </>
//           )}
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }
// src/components/modals/EndSessionModal.tsx
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useWriteContract } from "wagmi";
import { GHOST_WALLET_ABI } from "@/lib/contracts";
import { toast } from "sonner";

interface EndSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ghostAddress: `0x${string}`;
  sessionKey: `0x${string}`;
  onSuccess: () => void;
}

export default function EndSessionModal({
  open,
  onOpenChange,
  ghostAddress,
  sessionKey,
  onSuccess,
}: EndSessionModalProps) {
  const { writeContractAsync } = useWriteContract();
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"password" | "ending">("password");

  const handleEndSession = async () => {
    if (!password) {
      toast.error("Please enter your master password");
      return;
    }

    setStep("ending");

    try {
      await writeContractAsync({
        address: ghostAddress,
        abi: GHOST_WALLET_ABI,
        functionName: "revokeEphemeralKey",
        args: [sessionKey],
      });

      toast.success("Session ended successfully!");
      onSuccess();
      onOpenChange(false);
      setPassword("");
      setStep("password");
    } catch (error) {
      console.error("Failed to end session:", error);
      toast.error("Failed to end session");
      setStep("password");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>End Ghost Wallet Session</DialogTitle>
          <DialogDescription>
            Confirm your master password to end the session for this ghost wallet.
          </DialogDescription>
        </DialogHeader>
        {step === "password" && (
          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This action will end the session for the wallet at {ghostAddress.slice(0, 6)}...
                {ghostAddress.slice(-4)}. Remaining funds will remain in the wallet.
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
        {step === "ending" && (
          <div className="space-y-4 py-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto" />
            <div>
              <p className="font-semibold">Ending session...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Processing transaction to end the session...
              </p>
            </div>
          </div>
        )}
        <DialogFooter>
          {step === "password" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleEndSession} disabled={!password}>
                End Session
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
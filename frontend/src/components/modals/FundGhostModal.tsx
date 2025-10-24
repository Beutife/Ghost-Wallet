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
// import { AlertCircle } from "lucide-react";
// //import { usePrivacyPool } from "@/hooks/usePrivacyPool";
// import { useAccount } from "wagmi";
// import { toast } from "sonner";

// interface FundGhostModalProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   ghostAddress: `0x${string}`;
//   onSuccess: () => void;
// }

// export default function FundGhostModal({
//   open,
//   onOpenChange,
//   ghostAddress,
//   onSuccess,
// }: FundGhostModalProps) {
//   const { address } = useAccount();
//   //const { poolBalance, withdraw, isWithdrawing } = usePrivacyPool(address);
//   const [amount, setAmount] = useState("");

// //   const handleFund = async () => {
// //     if (!amount || parseFloat(amount) <= 0) {
// //       toast.error("Please enter a valid amount");
// //       return;
// //     }

// //     if (parseFloat(amount) > parseFloat(poolBalance)) {
// //       toast.error("Insufficient privacy pool balance");
// //       return;
// //     }

// //     try {
// //       // In production, you'd generate ZK proof here
// //       const mockProof = "0x" as `0x${string}`;

// //       await withdraw(ghostAddress, amount, mockProof);
      
// //       toast.success("Ghost wallet funded!");
// //       onSuccess();
// //       onOpenChange(false);
// //       setAmount("");
// //     } catch (error) {
// //       console.error("Failed to fund:", error);
// //       toast.error("Failed to fund ghost wallet");
// //     }
// //   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[500px]">
//         <DialogHeader>
//           <DialogTitle>Fund Ghost Wallet</DialogTitle>
//           <DialogDescription>
//             Withdraw from privacy pool to fund this ghost anonymously
//           </DialogDescription>
//         </DialogHeader>

//         <div className="space-y-4 py-4">
//           {/* Privacy Pool Balance */}
//           <Alert>
//             <AlertCircle className="h-4 w-4" />
//             <AlertDescription>
//               {/* Privacy Pool Balance: {poolBalance} USDC */}
//             </AlertDescription>
//           </Alert>

//           {/* Amount Input */}
//           <div className="space-y-2">
//             <Label htmlFor="amount">Amount (USDC)</Label>
//             <Input
//               id="amount"
//               type="number"
//               placeholder="100"
//               value={amount}
//               onChange={(e) => setAmount(e.target.value)}
//             />
//           </div>

//           {/* Quick Amounts */}
//           <div className="flex gap-2">
//             {[50, 100, 200].map((quick) => (
//               <Button
//                 key={quick}
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setAmount(quick.toString())}
//               >
//                 ${quick}
//               </Button>
//             ))}
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setAmount(poolBalance)}
//             >
//               Max
//             </Button>
//           </div>

//           {/* Info */}
//           <Alert>
//             <AlertCircle className="h-4 w-4" />
//             <AlertDescription>
//               Funds will be withdrawn anonymously from the privacy pool using zero-knowledge proofs
//             </AlertDescription>
//           </Alert>
//         </div>

//         <DialogFooter>
//           <Button variant="outline" onClick={() => onOpenChange(false)}>
//             Cancel
//           </Button>
//           <Button onClick={handleFund} disabled={isWithdrawing}>
//             {isWithdrawing ? "Funding..." : "Fund Ghost"}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }
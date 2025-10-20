// "use client";

// import { useState, useEffect } from "react";
// import { useAccount } from "wagmi";
// import { Plus, AlertCircle } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import Navbar from "@/components/Navbar";
// import StatsCard from "@/components/dashboardCard/StatsCard";
// import GhostCard from "@/components/dashboardCard/GhostCard";
// import EmptyState from "@/components/dashboardCard/EmptyState";
// import CreateGhostModal from "@/components/modals/CreateGhostModal";
// import { useGhostWallets } from "@/hooks/useGhostWallets";
// import { useSession } from "@/hooks/useSession";
// import router from "next/router";

// export default function Dashboard() {
//   const { address, isConnected } = useAccount();
//   const { hasPassword, isSessionActive } = useSession();
//   const { ghosts, stats, loading, refetch } = useGhostWallets(address);
//   const [createModalOpen, setCreateModalOpen] = useState(false);
//   const [filter, setFilter] = useState<"all" | "active" | "expired">("all");

//   // Redirect to onboarding if no master password
//   useEffect(() => {
//     if (isConnected && !hasPassword) {
//       router.push("/onboarding");
//     }
//   }, [isConnected, hasPassword]);

//   // Filter ghosts based on status
//   const filteredGhosts = ghosts.filter((ghost: { sessionActive: any; isExpired: any; }) => {
//     if (filter === "all") return true;
//     if (filter === "active") return ghost.sessionActive && !ghost.isExpired;
//     if (filter === "expired") return ghost.isExpired;
//     return true;
//   });

//   if (!isConnected) {
//     return (
//       <div className="min-h-screen bg-background">
//         <Navbar />
//         <div className="container mx-auto px-6 pt-32 text-center">
//           <span className="text-6xl mb-4 block">👻</span>
//           <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
//           <p className="text-muted-foreground mb-6">
//             Connect your wallet to view your ghost wallets
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-background">
//       <Navbar />

//       <div className="container mx-auto px-6 pt-24 pb-12">
//         {/* Privacy Pool Warning */}
//         {stats.privacyPoolBalance === '0' && (
//           <Alert className="mb-6">
//             <AlertCircle className="h-4 w-4" />
//             <AlertDescription>
//               You haven't deposited to the Privacy Pool yet. Deposit funds to
//               anonymously fund your ghost wallets.
//               <Button variant="link" className="ml-2">
//                 Deposit Now
//               </Button>
//             </AlertDescription>
//           </Alert>
//         )}

//         {/* Stats Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-fade-in">
//           <StatsCard
//             icon="👻"
//             label="Active Ghosts"
//             value={stats.activeGhosts}
//           />
//           <StatsCard
//             icon="🔮"
//             label="Total Created"
//             value={stats.totalCreated}
//           />
//           <StatsCard
//             icon="💰"
//             label="Total Value"
//             value={`$${stats.totalValue}`}
//           />
//           <StatsCard
//             icon="⚡"
//             label="Gas Saved"
//             value={`$${stats.gasSaved}`}
//           />
//         </div>

//         {/* Header with Filters */}
//         <div className="flex items-center justify-between mb-8">
//           <div>
//             <h1 className="text-4xl font-bold mb-2">Your Ghost Wallets</h1>
//             <p className="text-muted-foreground">
//               Manage your temporary wallets
//             </p>
//           </div>
//           <Button
//             className="gradient-purple text-primary-foreground glow-effect hover:opacity-90 transition-opacity"
//             onClick={() => setCreateModalOpen(true)}
//           >
//             <Plus className="mr-2 h-5 w-5" />
//             Create Ghost
//           </Button>
//         </div>

//         {/* Filter Tabs */}
//         <div className="flex gap-2 mb-6">
//           {["all", "active", "expired"].map((tab) => (
//             <Button
//               key={tab}
//               variant={filter === tab ? "default" : "outline"}
//               size="sm"
//               onClick={() => setFilter(tab as typeof filter)}
//               className="capitalize"
//             >
//               {tab}
//             </Button>
//           ))}
//         </div>

//         {/* Ghost Cards Grid */}
//         {loading ? (
//           <div className="text-center py-12">
//             <div className="animate-spin text-4xl mb-4">👻</div>
//             <p className="text-muted-foreground">Loading your ghosts...</p>
//           </div>
//         ) : filteredGhosts.length === 0 ? (
//           <EmptyState
//             filter={filter}
//             onCreateClick={() => setCreateModalOpen(true)}
//           />
//         ) : (
//           <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
//             {filteredGhosts.map((ghost: any, index: number) => (
//               <GhostCard
//                 key={ghost.address}
//                 ghost={{
//                   address: ghost.address || '',
//                   name: ghost.name || 'Unnamed Ghost',
//                   balance: ghost.balance || '0',
//                   usdValue: ghost.usdValue || '0',
//                   createdAt: ghost.createdAt || 0,
//                   expiresAt: ghost.expiresAt || 0,
//                   sessionActive: ghost.sessionActive || false,
//                   sessionExpiresAt: ghost.sessionExpiresAt,
//                   isExpired: ghost.isExpired || false,
//                   transactions: ghost.transactions || 0
//                 }}
//                 index={index}
//                 onRefetch={refetch}
//               />
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Create Ghost Modal */}
//       <CreateGhostModal
//         open={createModalOpen}
//         onOpenChange={setCreateModalOpen}
//         onSuccess={refetch}
//       />
//     </div>
//   );
// }
// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/Navbar";
import StatsCard from "@/components/dashboardCard/StatsCard";
import GhostCard from "@/components/dashboardCard/GhostCard";
import EmptyState from "@/components/dashboardCard/EmptyState";
import CreateGhostModal from "@/components/modals/CreateGhostModal";
import { useGhostWallets } from "@/hooks/useGhostWallets";
import { useSession } from "@/hooks/useSession";
import router from "next/router";

interface Ghost {
  address: string;
  name: string;
  balance: string;
  usdValue: string;
  createdAt: number;
  expiresAt: number;
  sessionActive: boolean;
  sessionExpiresAt?: number;
  isExpired: boolean;
  transactions: number;
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { hasPassword, isSessionActive } = useSession();
  const { ghosts, stats, loading, refetch } = useGhostWallets(address);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all");

  useEffect(() => {
    if (isConnected && !hasPassword) {
      router.push("/onboarding");
    }
  }, [isConnected, hasPassword]);

  const filteredGhosts = ghosts.filter((ghost: Ghost) => {
    if (filter === "all") return true;
    if (filter === "active") return ghost.sessionActive && !ghost.isExpired;
    if (filter === "expired") return ghost.isExpired;
    return true;
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 pt-32 text-center">
          <span className="text-6xl mb-4 block">👻</span>
          <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to view your ghost wallets
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-12">
        {stats.privacyPoolBalance === '0' && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You haven't deposited to the Privacy Pool yet. Deposit funds to
              anonymously fund your ghost wallets.
              <Button variant="link" className="ml-2">
                Deposit Now
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-fade-in">
          <StatsCard icon="👻" label="Active Ghosts" value={stats.activeGhosts} />
          <StatsCard icon="🔮" label="Total Created" value={stats.totalCreated} />
          <StatsCard icon="💰" label="Total Value" value={`$${stats.totalValue}`} />
          <StatsCard icon="⚡" label="Gas Saved" value={`$${stats.gasSaved}`} />
        </div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Your Ghost Wallets</h1>
            <p className="text-muted-foreground">Manage your temporary wallets</p>
          </div>
          <Button
            className="gradient-purple text-primary-foreground glow-effect hover:opacity-90 transition-opacity"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Ghost
          </Button>
        </div>
        <div className="flex gap-2 mb-6">
          {["all", "active", "expired"].map((tab) => (
            <Button
              key={tab}
              variant={filter === tab ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(tab as typeof filter)}
              className="capitalize"
            >
              {tab}
            </Button>
          ))}
        </div>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin text-4xl mb-4">👻</div>
            <p className="text-muted-foreground">Loading your ghosts...</p>
          </div>
        ) : filteredGhosts.length === 0 ? (
          <EmptyState filter={filter} onCreateClick={() => setCreateModalOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredGhosts.map((ghost: Ghost, index: number) => (
              <GhostCard
                key={ghost.address}
                ghost={{
                  address: ghost.address || '',
                  name: ghost.name || 'Unnamed Ghost',
                  balance: String(ghost.balance || '0'),
                  usdValue: String(ghost.usdValue || '0'),
                  createdAt: Number(ghost.createdAt || 0),
                  expiresAt: Number(ghost.expiresAt || 0),
                  sessionActive: Boolean(ghost.sessionActive || false),
                  sessionExpiresAt: ghost.sessionExpiresAt ? Number(ghost.sessionExpiresAt) : undefined,
                  isExpired: Boolean(ghost.isExpired || false),
                  transactions: Number(ghost.transactions || 0),
                }}
                index={index}
                onRefetch={() => refetch()} // Wrap refetch
              />
            ))}
          </div>
        )}
      </div>
      <CreateGhostModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={refetch}
      />
    </div>
  );
}




  // const { address } = useAccount();
  // const { ghosts, stats, loading, refetch } = useGhostWallets(address);
  // const { activeSessions } = useSession();
  // const [createModalOpen, setCreateModalOpen] = useState(false);
  // const [filter, setFilter] = useState<"all" | "active" | "expired">("all");

  
  //   <div className="container mx-auto p-6 min-h-screen">
  //     <div className="flex justify-between items-center mb-8">
  //       <h1 className="text-3xl font-bold">Ghost Wallet Dashboard</h1>
  //       <Button
  //         className="gradient-purple text-primary-foreground glow-effect"
  //         onClick={() => setCreateModalOpen(true)}
  //       >
  //         <Plus className="mr-2 h-5 w-5" />
  //         Create Ghost Wallet
  //       </Button>
  //     </div>

  //     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
  //       <StatsCard icon="👻" label="Active Ghosts" value={stats.activeGhosts} />
  //       <StatsCard icon="💸" label="Total Value" value={`$${stats.totalValue}`} />
  //       <StatsCard icon="⛽" label="Gas Saved" value={stats.gasSaved} />
  //     </div>

  //     <div className="flex gap-4 mb-6">
  //       <Button
  //         variant={filter === "all" ? "default" : "outline"}
  //         onClick={() => setFilter("all")}
  //       >
  //         All
  //       </Button>
  //       <Button
  //         variant={filter === "active" ? "default" : "outline"}
  //         onClick={() => setFilter("active")}
  //       >
  //         Active
  //       </Button>
  //       <Button
  //         variant={filter === "expired" ? "default" : "outline"}
  //         onClick={() => setFilter("expired")}
  //       >
  //         Expired
  //       </Button>
  //     </div>

  //     {loading ? (
  //       <div className="text-center py-12">
  //         <p className="text-muted-foreground">Loading ghost wallets...</p>
  //       </div>
  //     ) : ghosts.length === 0 ? (
  //       <EmptyState filter={filter} onCreateClick={() => setCreateModalOpen(true)} />
  //     ) : (
  //       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  //         {ghosts
  //           .filter((ghost) =>
  //             filter === "all"
  //               ? true
  //               : filter === "active"
  //               ? !ghost.isExpired
  //               : ghost.isExpired
  //           )
  //           .map((ghost, index) => (
  //             <GhostCard
  //               key={ghost.address}
  //               ghost={{
  //                 ...ghost,
  //                 sessionActive: activeSessions.includes(ghost.address),
  //                 sessionExpiresAt: activeSessions.includes(ghost.address)
  //                   ? Date.now() / 1000 + 3600 // Placeholder
  //                   : undefined,
  //               }}
  //               index={index}
  //               onRefetch={() => refetch()}
  //             />
  //           ))}
  //       </div>
  //     )}

  //     <CreateGhostModal
  //       open={createModalOpen}
  //       onOpenChange={setCreateModalOpen}
  //       onSuccess={() => refetch()}
  //     />
  //   </div>
  

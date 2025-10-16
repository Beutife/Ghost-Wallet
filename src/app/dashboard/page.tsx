import { Plus, Send, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

const Dashboard = () => {
  const stats = [
    { label: "Active Ghosts", value: "3", icon: "👻" },
    { label: "Total Created", value: "12", icon: "🔮" },
    { label: "Total Value", value: "$485", icon: "💰" },
    { label: "Gas Saved", value: "$23.40", icon: "⚡" },
  ];

  const ghosts = [
    {
      name: "Travel Fund",
      address: "0x1234...5678",
      balance: "85.50",
      timeLeft: "1 day",
      progress: 66,
      created: "2 days ago",
    },
    {
      name: "Shopping Spree",
      address: "0x9abc...def0",
      balance: "42.00",
      timeLeft: "5 hours",
      progress: 90,
      created: "2 days ago",
    },
    {
      name: "Gift Wallet",
      address: "0x5555...9999",
      balance: "100.00",
      timeLeft: "2 days",
      progress: 33,
      created: "1 day ago",
    },
  ];

  const getProgressColor = (progress: number) => {
    if (progress < 50) return "bg-green-500";
    if (progress < 75) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 pt-24 pb-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-fade-in">
          {stats.map((stat, index) => (
            <Card key={index} className="glass-card p-6 hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">{stat.icon}</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {stat.value}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Your Ghost Wallets</h1>
            <p className="text-muted-foreground">Manage your temporary wallets</p>
          </div>
          <Button className="gradient-purple text-primary-foreground glow-effect hover:opacity-90 transition-opacity">
            <Plus className="mr-2 h-5 w-5" />
            Create Ghost
          </Button>
        </div>

        {/* Ghost Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {ghosts.map((ghost, index) => (
            <Card 
              key={index} 
              className="glass-card p-6 hover:scale-105 transition-all hover:glow-effect"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">{ghost.name}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{ghost.address}</p>
                </div>
                <span className="text-3xl animate-float">👻</span>
              </div>

              {/* Balance */}
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-1">Balance</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  ${ghost.balance}
                </p>
                <p className="text-xs text-muted-foreground">{ghost.balance} USDC</p>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Time Remaining</p>
                  <p className="text-sm font-medium">{ghost.timeLeft}</p>
                </div>
                <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getProgressColor(ghost.progress)} transition-all duration-300`}
                    style={{ width: `${ghost.progress}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground">Created {ghost.created}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-primary">
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-primary">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-primary">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State (hidden when there are ghosts) */}
        {ghosts.length === 0 && (
          <Card className="glass-card p-12 text-center">
            <span className="text-6xl mb-4 block opacity-50">👻</span>
            <h3 className="text-2xl font-bold mb-2">No Ghost Wallets Yet</h3>
            <p className="text-muted-foreground mb-6">Create your first temporary wallet to get started</p>
            <Button className="gradient-purple text-primary-foreground glow-effect">
              <Plus className="mr-2 h-5 w-5" />
              Create Ghost Wallet
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

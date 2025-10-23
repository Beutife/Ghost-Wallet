"use client"

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  filter?: string;
  onCreateClick: () => void;
}

export default function EmptyState({ filter = "all", onCreateClick }: EmptyStateProps) {
  const getMessage = () => {
    switch (filter) {
      case "active":
        return {
          emoji: "😴",
          title: "No active ghost wallets",
          description: "Create a ghost wallet or start a session on an existing one",
        };
      case "expired":
        return {
          emoji: "💨",
          title: "No expired ghost wallets",
          description: "Expired wallets will appear here",
        };
      default:
        return {
          emoji: "👻",
          title: "No ghost wallets yet",
          description: "Create your first ghost wallet to get started!",
        };
    }
  };

  const { emoji, title, description } = getMessage();

  return (
    <Card className="glass-card p-12 text-center">
      <span className="text-6xl mb-4 block opacity-50">{emoji}</span>
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      {filter === "all" && (
        <Button
          className="gradient-purple text-primary-foreground glow-effect"
          onClick={onCreateClick}
        >
          <Plus className="mr-2 h-5 w-5" />
          Create Ghost Wallet
        </Button>
      )}
    </Card>
  );
}
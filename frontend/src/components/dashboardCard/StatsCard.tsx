"use client"

import { Card } from "@/components/ui/card";

interface StatsCardProps {
  icon: string;
  label: string;
  value: string | number;
}

export default function StatsCard({ icon, label, value }: StatsCardProps) {
  return (
    <Card className="glass-card p-6 hover:scale-105 transition-transform">
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {value}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </Card>
  );
}
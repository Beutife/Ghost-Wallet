"use client"

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { sdk } from '@farcaster/miniapp-sdk';
import { useEffect } from 'react';
import { Metadata } from 'next';


const Index = () => {

  const metadata: Metadata = {
    other: {
      'base:app_id': '693b47cb8a7c4e55fec73ec6',
    },
  };

  useEffect(() => {
    sdk.actions.ready();
    }, []);


  const features = [
    {
      
      emoji: "⏰",
      title: "Auto-Expire",
      description: "Set custom durations. Wallets automatically expire and return your funds safely.",
    },
    {
      emoji: "💰",
      title: "Spending Limits",
      description: "Lock in exact amounts. Never overspend on temporary purchases or gifts.",
    },
    {
      emoji: "⚡",
      title: "Gasless Transactions",
      description: "Zero gas fees on all operations. We handle the blockchain complexity for you.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-32 pb-20 text-center">
        <div className="animate-fade-in">
          <div className="mb-8 inline-block">
            <span className="text-9xl animate-float inline-block">👻</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Create. Use. Vanish.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Temporary smart wallets that auto-expire. Perfect for one-time purchases, 
            gifts, or time-limited spending.
          </p>

          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button 
                size="lg" 
                className="gradient-purple text-primary-foreground text-lg px-8 py-6 glow-effect hover:scale-105 transition-transform"
              >
                Get Started
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 border-primary/50 hover:bg-primary/10 hover:scale-105 transition-transform"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="glass-card p-8 hover:scale-105 transition-all hover:glow-effect text-center group"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="mb-6">
                <span className="text-6xl block mb-4 group-hover:animate-float">{feature.emoji}</span>
              </div>
              
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="glass-card p-12 text-center glow-effect">
          <h2 className="text-4xl font-bold mb-4">
            Ready to create your first ghost wallet?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands using temporary wallets for safer, smarter spending
          </p>
          <Link href="/dashboard">
            <Button 
              size="lg" 
              className="gradient-purple text-primary-foreground text-lg px-8 py-6 hover:scale-105 transition-transform"
            >
              Launch App
            </Button>
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-border/50">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <span>Built on</span>
          <span className="font-bold text-primary">Base</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
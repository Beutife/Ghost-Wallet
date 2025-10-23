"use client"

export default function Footer() {
  return (
    <footer className="container mx-auto px-6 py-8 border-t border-border/50 mt-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Built on</span>
          <span className="font-bold text-primary">Base</span>
          <span>•</span>
          <span>Powered by</span>
          <span className="font-bold text-accent">Lit Protocol</span>
        </div>
        
        <div className="flex gap-4 text-sm text-muted-foreground">
          <a href="#" className="hover:text-primary transition">
            Docs
          </a>
          <a href="#" className="hover:text-primary transition">
            GitHub
          </a>
          <a href="#" className="hover:text-primary transition">
            Twitter
          </a>
          <a href="#" className="hover:text-primary transition">
            Discord
          </a>
        </div>
      </div>
    </footer>
  );
}
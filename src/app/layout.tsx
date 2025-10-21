import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/provider";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "GhostWallet",
  description: "Secure Web3 Wallet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Navbar />
          {children}
          </Providers>
      </body>
    </html>
  );
}

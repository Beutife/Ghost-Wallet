import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/provider";
import Navbar from "@/components/Navbar";
import { Metadata } from 'next';



const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "GhostWallet",
  description: "Secure Web3 Wallet",
};
export const metadata: Metadata = {
  other: {
    'base:app_id': '693b47cb8a7c4e55fec73ec6',
  },
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

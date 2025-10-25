// src/lib/wagmi-config.ts
import { http, createConfig, createStorage, cookieStorage } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { coinbaseWallet, walletConnect, injected } from "wagmi/connectors";

const DEPLOYMENT_URL = 
  typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://ghost-wallet-seven.vercel.app/';

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected({ shimDisconnect: true }), 
    coinbaseWallet({ appName: 'GhostWallet' }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID!,
      metadata: {
        name: "Ghost Wallet",
        description: "Temporary smart wallets that auto-expire",
        url: process.env.NEXT_PUBLIC_APP_URL || DEPLOYMENT_URL,
        icons: ["https://ghostwallet.xyz/icon.pnghttps://ghost-wallet-m5th.vercel.app/ghost-icon.png"],
      },
      showQrModal: true,
    }),
    coinbaseWallet({
      appName: "Ghost Wallet",
      appLogoUrl: "https://ghostwallet.xyz/icon.png",
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
  //  FIX: Use cookie storage instead of localStorage for SSR
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});
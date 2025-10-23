// src/lib/wagmi-config.ts
import { http, createConfig, createStorage, cookieStorage } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { coinbaseWallet, walletConnect, injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected({ shimDisconnect: true }), // MetaMask, Rainbow, etc.
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID!,
      metadata: {
        name: "Ghost Wallet",
        description: "Temporary smart wallets that auto-expire",
        url: "https://ghostwallet.xyz",
        icons: ["https://ghostwallet.xyz/icon.png"],
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
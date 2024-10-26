"use client";

import { ReactQueryProvider } from "@/components/ReactQueryProvider";
import { Toaster } from "@/components/ui/toaster";
import { NetworkId } from "@/config";
import { useState, useEffect } from "react";
import { NearContext, Wallet } from "@/wallets/near";
import { wagmiConfig } from "../wagmi";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";

// export const metadata = {
//   title: "NextJS Boilerplate Template",
//   description: "NextJS Boilerplate Template is a...",
// };

export default function RootLayout({ children }) {
  const wallet = new Wallet({ networkId: NetworkId });

  const [signedAccountId, setSignedAccountId] = useState("");

  useEffect(() => {
    wallet.startUp(setSignedAccountId);
  }, []);

  return (
    <html lang="en">
      <body>
        <NearContext.Provider value={{ wallet, signedAccountId }}>
          <WagmiProvider config={wagmiConfig}>
            <RainbowKitProvider>
              <ReactQueryProvider>
                <div id="root">{children}</div>

                <Toaster />
              </ReactQueryProvider>
            </RainbowKitProvider>
          </WagmiProvider>
        </NearContext.Provider>
      </body>
    </html>
  );
}

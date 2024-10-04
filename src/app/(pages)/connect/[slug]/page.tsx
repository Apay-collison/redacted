"use client";

import ConnectBtn from "@/components/commands/ConnectBtn";
import { useEffect, useState } from "react";

export default function Page({ params }: { params: { slug: string } }) {
  const [message, setMessage] = useState("Welcome to Apay, connect wallet to begin");
  const [signature, setSignature] = useState(false);

  useEffect(() => {
    console.log(params.slug);
  }, []);

  const handleConnectWallet = () => {
    setMessage("Processing..");
  };
  const handleWalletConnected = () => {
    setMessage("One more step, complete sign to zoom in!");
  };

  const handleCompleteSignIn = (isSuccess: boolean, errorMsg?: string) => {
    
    if (isSuccess) {
      setMessage("Off you go! see you soon frien.");
      setSignature(true);
    } else {
      setMessage(`❌ An error occurred: ${errorMsg}`);
    }
  };

  return (
    <main className="flex items-center justify-center h-screen w-full text-center">
      <div className="bg-gray-100 w-2/5 h-3/4 border-2 border-black flex flex-col">
        <div className="bg-gray-900 h-7 flex justify-between items-center px-3">
          <p className="text-white text-lg font-semibold">Connect Wallet</p>
          <div className="flex items-end space-x-2">
            <img src="/icons/minus.svg" alt="Minimize" />
            <img src="/icons/minimize.svg" alt="Minimize" />
            <img src="/icons/close.svg" alt="Close" />
          </div>
        </div>

        {/* Main section */}
        <div className="flex flex-col items-center justify-center h-full">
          <div className="flex flex-col items-center justify-center mb-4">
            <img src="/welcome.jpeg" className="w-[300px] h-[300px] mx-auto mb-4" alt="Welcome" />
            <p className="text-2xl">{message}</p>
          </div>

          {/* Space for button, message, and etc. */}
          <div>
            <ConnectBtn params={params} onConnectWallet={handleConnectWallet} onWalletConnected={handleWalletConnected} onCompleteSignIn={handleCompleteSignIn} />
          </div>
        </div>
      </div>
    </main>
  );
}

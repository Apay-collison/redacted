"use client";

import { Vote } from "@/components/commands/Vote";
import { useEffect, useState } from "react";

export default function Page({ params }: { params: { slug: string } }) {
  const [message, setMessage] = useState("Connect wallet to vote!");

  useEffect(() => {
    console.log(params.slug);
  }, []);

  const handleWalletConnected = () => {
    setMessage("Just click vote.. when you're ready!");
  };

  const handleCompleteSignIn = (isSuccess: boolean, errorMsg?: string) => {
    if (isSuccess) {
      setMessage("Viola.. You're good to go.");
    } else {
      setMessage(`❌ An error occurred: ${errorMsg}`);
    }
  };

  return (
    <main className="flex items-center justify-center h-screen w-full text-center">
      <div className="bg-gray-100 w-2/5 h-3/4 border-2 border-black flex flex-col">
        <div className="bg-gray-900 h-7 flex justify-between items-center px-3">
          <p className="text-white text-lg font-semibold">Vote</p>
          <div className="flex items-end space-x-2">
            <img src="/icons/minus.svg" alt="Minimize" />
            <img src="/icons/minimize.svg" alt="Minimize" />
            <img src="/icons/close.svg" alt="Close" />
          </div>
        </div>

        {/* Main section */}
        <div className="flex flex-col items-center justify-center h-full">
          <div className="flex flex-col items-center justify-center">
            <img src="/vote.png" className="w-[300px] h-[300px] mx-auto" alt="Welcome" />
            <p className="text-2xl mt-3">{message}</p>
          </div>

          {/* Space for button, message, and etc. */}
          <div>
            <Vote params={params} onWalletConnected={handleWalletConnected} onCompleteSignIn={handleCompleteSignIn} />
          </div>
        </div>
      </div>
    </main>
  );
}

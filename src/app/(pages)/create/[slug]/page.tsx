"use client";

import { CreateVote } from "@/components/commands/CreateVote";
import { useEffect } from "react";

export default function Page({ params }: { params: { slug: string } }) {
  useEffect(() => {
    console.log(params.slug);
  }, []);

  return (
    <main className="flex items-center justify-center h-screen w-full text-center">
      <div className="bg-gray-100 w-2/5 h-3/4 border-2 border-black flex flex-col ">
        <div className="bg-gray-900 h-7 flex justify-between items-center px-3">
          <p className="text-white text-lg font-semibold">Create vote</p>
          <div className="flex items-end space-x-2">
            <img src="/icons/minus.svg" alt="Minimize" />
            <img src="/icons/minimize.svg" alt="Minimize" />
            <img src="/icons/close.svg" alt="Close" />
          </div>
        </div>

        {/* Main section */}
        <div className="flex flex-col items-center justify-center h-full">
          {/* Space for button, message, and etc. */}
          <div>
            <CreateVote params={params} />
          </div>
        </div>
      </div>
    </main>
  );
}

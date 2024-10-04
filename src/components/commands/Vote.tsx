"use client";

import { OpStatus } from "./op-status";
//
import React, { useState, useCallback, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast } from "@/components/ui/use-toast";
import { VOTING_MODULE_ADDRESS } from "@/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { aptosClient } from "@/utils/aptosClient";
import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

// Helper functions
const createTransactionPayload = (functionName: string, args: any[]): InputTransactionData => ({
  data: {
    function: `${VOTING_MODULE_ADDRESS}::Voting::${functionName}`,
    functionArguments: args,
  },
});

type Scores = [string[], number[]];

const fetchScores = async (account: string ): Promise<Scores | null> => {
  if (!account) return null;
  try {
    const result = await aptosClient().view<Scores>({
      payload: {
        function: `${VOTING_MODULE_ADDRESS}::Voting::view_current_scores`,
        functionArguments: [account],
      },
    });
    return result ? [result[0], result[1].map(Number)] : null;
  } catch (error) {
    console.error("Failed to fetch scores:", error);
    return null;
  }
};

export const Vote = ({ params }: { params: { slug: string } }) => {
  const { account, signAndSubmitTransaction } = useWallet();
  const [sending, setSending] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
    const [topic, setTopic] = useState<string>("");
    const [creatorAddr, setCreatorAddr] = useState<string>("");
  // const [options, setOptions] = useState<string>("");


  function formatAddress(address: any) {
    if (!address || address.length < 10) {
      return address; // Return the full address if it's too short
    }
    const firstPart = address.slice(0, 4);
    const lastPart = address.slice(-6);
    return `${firstPart}...${lastPart}`;
  }

  async function send() {
    setSending(true);
    setMessage("Loading...");
    // collect all the form values from the user input
    // const creatorAddr = "0xf9424969a5cfeb4639c4c75c2cd0ca62620ec624f4f28d76c4881a1e567d753f";
    try {
      const response = await fetch(`/api/vote?autolink=${params.slug}`, {
        method: "GET", // Specify the request method
      });
      const json = await response.json();
      const choice = JSON.parse(json).choice;
      const voteId = JSON.parse(json).voteId;

    //   console.log(json);
    //   console.log(account);
        const options = await fetchScores(creatorAddr);
        const selectedOption = options && options[0][choice]

      console.log("Voting Information:", {
        selectedOption: options ? options[0][choice] : "No options available",
        voteId,
        availableOptions: options ? options[0] : "No options available",
        scores: options ? options[1] : "No scores available",
      });

      const paddedOptions = [selectedOption, creatorAddr, "", ""].slice(0, 2);
      const payload = createTransactionPayload("vote", paddedOptions);
      const tx = await signAndSubmitTransaction(payload);
      await aptosClient().waitForTransaction(tx.hash);

      const body = {
          autolink: `${params.slug}`,
          transactionHash: tx.hash,
          network: "Testnet",
          voteId: voteId?.toString(),
      };

      const postResponse = await fetch("/api/vote", {
          method: "POST", // Specify the request method
          headers: {
              "Content-Type": "application/json", // Set the Content-Type header
          },
          body: JSON.stringify(body), // Convert the data to a JSON string
      });

      if (postResponse.ok) {
          setMessage("✅\nYou may now close the window");
      } else {
          const json = await postResponse.json();
          setMessage(`❌ You may now close the window`);
      }
    } catch (error) {
      console.error(error);
      setMessage(`❌ You may now close the window`);
    }
  }
    // [!endregion sending-user-op]
    useEffect(() => {
        setCreatorAddr(account?.address ?? "No address available");
    }, [account]);
    

  return (
    <>
      {!sending && (
        <div className="flex flex-col items-start gap-4 p-4 text-gray-300">
          <div className="flex flex-col items-center gap-2">
            <span className="font-bold ">Address:</span>
            <div className=" border border-gray-300 rounded-full p-2 px-4">{formatAddress(account?.address)}</div>
          </div>

          <button
            className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105"
            onClick={send}
          >
            Vote {}
          </button>
        </div>
      )}
      {sending && (
        <>
          <h2 className="text-white">{message}</h2>
        </>
      )}
    </>
  );
};

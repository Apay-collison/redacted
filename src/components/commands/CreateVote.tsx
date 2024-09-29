"use client";

import React, { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast } from "@/components/ui/use-toast";
import { VOTING_MODULE_ADDRESS } from "@/constants";

export const CreateVote = ({ params }: { params: { slug: string } }) => {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  async function send() {
    if (!account) {
      toast({ title: "Error", description: "Please connect your wallet." });
      return;
    }

    setSending(true);
    setMessage("Loading...");

    try {
      // Fetching the options for the vote
      const response = await fetch(`/api/create?autolink=${params.slug}`);
      const json = await response.json();
      const options = JSON.parse(json).option;
      const optionsNum = options.length;

      // Prepare the transaction payload
      const transactionPayload = {
        data: {
          function: `${VOTING_MODULE_ADDRESS}::Voting::create_vote`, // Update to your actual function
          functionArguments: [optionsNum, options],
        },
      };

      // Sign and submit the transaction
      const txnHash = await signAndSubmitTransaction(transactionPayload);

      const body = {
        autolink: `${params.slug}`,
        transactionHash: txnHash,
        network: "Testnet",
      };

      // Post transaction details to your server
      const postResponse = await fetch("/api/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (postResponse.ok) {
        setMessage("✅\nYou may now close the window");
      } else {
        const json = await postResponse.json();
        setMessage(`❌\nAn error occurred: ${json.error}`);
      }
    } catch (error) {
      console.error(error);
      setMessage(`❌\nAn error occurred: ${error}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {!sending && connected && (
        <div className="flex flex-col items-start gap-4 p-4">
          <div className="flex items-center gap-2">
            <span className="font-bold">Address:</span>
            <div className="text-gray-300 border border-gray-300 rounded-full p-2 px-4">{account?.address}</div>
          </div>

          <button
            className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105"
            onClick={send}
          >
            Create Vote
          </button>
        </div>
      )}
      {sending && <h2 className="text-white">{message}</h2>}
    </>
  );
};

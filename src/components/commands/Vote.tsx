"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { VOTING_MODULE_ADDRESS } from "@/constants";
import { aptosClient } from "@/utils/aptosClient";
import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "../WalletSelector";
import { Button } from "../ui/button";

// Helper functions
const createTransactionPayload = (functionName: string, args: any[]): InputTransactionData => ({
  data: {
    function: `${VOTING_MODULE_ADDRESS}::Voting::${functionName}`,
    functionArguments: args,
  },
});

type Scores = [string[], number[]];

const fetchScores = async (account: string): Promise<Scores | null> => {
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

export const Vote = ({
  params,
  onWalletConnected,
  onCompleteSignIn,
}: {
  params: { slug: string };
  onWalletConnected: () => void;
  onCompleteSignIn: (isSuccess: boolean, errorMsg?: string) => void;
}) => {
  const { account, signAndSubmitTransaction, connected } = useWallet();
  const [sending, setSending] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [creatorAddr, setCreatorAddr] = useState<string>("");

  function formatAddress(address: any) {
    if (!address || address.length < 10) {
      return address;
    }
    const firstPart = address.slice(0, 4);
    const lastPart = address.slice(-6);
    return `${firstPart}...${lastPart}`;
  }

  async function send() {
    setSending(true);
    setMessage("Loading...");

    try {
      const response = await fetch(`/api/vote?autolink=${params.slug}`, {
        method: "GET",
      });
      const json = await response.json();
      const choice = JSON.parse(json).choice;
      const voteId = JSON.parse(json).voteId;

      const options = await fetchScores(creatorAddr);
      const selectedOption = options && options[0][choice];

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
        onCompleteSignIn(true);
        setMessage("✅ You may now close the window");
      } else {
        const json = await postResponse.json();
        setMessage("");
        onCompleteSignIn(false, json.error);
      }
    } catch (error) {
      console.error(error);
      setMessage("");
      onCompleteSignIn(false, "failed to vote");
    }
  }
  // [!endregion sending-user-op]
  useEffect(() => {
    setCreatorAddr(account?.address ?? "No address available");
    connected && onWalletConnected();
  }, [account?.address]);

  return (
    <>
      {!sending && (
        <div className="flex flex-col items-center p-4 text-gray-900 w-[350px]">
          {account?.address && (
            <div className="flex items-center justify-center gap-2">
              <span className="font-bold text-xl">Voter Address:</span>
              <div className="text-gray-700">{formatAddress(account?.address)}</div>
            </div>
          )}

          {!account?.address && <WalletSelector />}
          <Button
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-sm shadow-lg transition duration-200 ease-in-out transform hover:scale-105"
            onClick={send}
          >
            Vote
          </Button>
        </div>
      )}
      {sending && (
        <>
          <h2 className="text-black mt-3">{message}</h2>
        </>
      )}
    </>
  );
};

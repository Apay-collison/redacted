"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, NearContext } from "@/wallets/near";

const CONTRACT_ID = process.env.NEXT_PUBLIC_VOTING_CONTRACT_ID || "";

type Scores = [string[], number[]];

const fetchScores = async (wallet: Wallet, account: string): Promise<Scores | null> => {
  if (!account) return null;
  try {
    const result = await wallet.viewMethod({
      contractId: CONTRACT_ID,
      method: 'view_current_scores',
      args: { account_id: account }
    });
    return result ? [result.options, result.votes.map(Number)] : null;
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
  const [wallet] = useState(() => new Wallet({ networkId: 'testnet', createAccessKeyFor: CONTRACT_ID }));
  const [signedAccountId, setSignedAccountId] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [creatorAddr, setCreatorAddr] = useState<string>("");

  // Initialize wallet
  useEffect(() => {
    wallet.startUp((accountId: React.SetStateAction<string>) => {
      setSignedAccountId(accountId);
      if (accountId) {
        setCreatorAddr(accountId);
        onWalletConnected();
      }
    });
  }, [wallet, onWalletConnected]);

  const formatAddress = (address: string): string => {
    if (!address || address.length < 10) {
      return address;  
    }
    const firstPart = address.slice(0, 4);
    const lastPart = address.slice(-6);
    return `${firstPart}...${lastPart}`;
  };

  const send = async () => {
    if (!signedAccountId) {
      onCompleteSignIn(false, "Please connect your wallet first");
      return;
    }

    setSending(true);
    setMessage("Loading...");

    try {
      const response = await fetch(`/api/vote?autolink=${params.slug}`, {
        method: "GET",
      });
      const json = await response.json();
      const choice = JSON.parse(json).choice;
      const voteId = JSON.parse(json).voteId;

      const options = await fetchScores(wallet, creatorAddr);
      const selectedOption = options && options[0][choice];

      console.log("Voting Information:", {
        selectedOption: options ? options[0][choice] : "No options available",
        voteId,
        availableOptions: options ? options[0] : "No options available",
        scores: options ? options[1] : "No scores available",
      });

      // Call the NEAR contract to vote
      const result = await wallet.callMethod({
        contractId: CONTRACT_ID,
        method: 'vote',
        args: {
          option: selectedOption,
          creator_account_id: creatorAddr
        },
        gas: '100000',
        deposit: ''
      });

      const body = {
        autolink: params.slug,
        transactionHash: result,
        network: "testnet",
        voteId: voteId?.toString(),
      };

      const postResponse = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
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
    } finally {
      setSending(false);
    }
  };

  return (
    <NearContext.Provider value={{ wallet, signedAccountId }}>
      {!sending && (
        <div className="flex flex-col items-center p-4 text-gray-900 w-[350px]">
          {signedAccountId && (
            <div className="flex items-center justify-center gap-2">
              <span className="font-bold text-xl">Voter Address:</span>
              <div className="text-gray-700">{formatAddress(signedAccountId)}</div>
            </div>
          )}

          {!signedAccountId && (
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => wallet.signIn()}
            >
              Connect NEAR Wallet
            </Button>
          )}

          {signedAccountId && (
            <Button
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-sm shadow-lg transition duration-200 ease-in-out transform hover:scale-105"
              onClick={send}
            >
              Vote
            </Button>
          )}
        </div>
      )}
      
      {sending && (
        <div className="text-center">
          <h2 className="text-black mt-3">{message}</h2>
        </div>
      )}
    </NearContext.Provider>
  );
};
"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast } from "@/components/ui/use-toast";
import { VOTING_MODULE_ADDRESS } from "@/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { aptosClient } from "@/utils/aptosClient";
import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { finished } from "stream";

// Types
type Scores = [string[], number[]];
type VotingOption = { option: string; votes: number };

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

const checkWinner = async (account: string): Promise<string[]> => {
  if (!account) return [];
  try {
    const result = await aptosClient().view<[string]>({
      payload: {
        function: `${VOTING_MODULE_ADDRESS}::Voting::view_winner`,
        functionArguments: [account],
      },
    });
    return result;
  } catch (error) {
    console.error("Failed to check winner:", error);
    return [];
  }
};

const formatAddress = (address: string): string =>
  address && address.length >= 10 ? `${address.slice(0, 4)}...${address.slice(-6)}` : address;

// Sub-components
const VotingOptions: React.FC<{ winner: string[]; currentScores: Scores | null }> = ({ winner, currentScores }) => (
  <div className="space-y-2">
    {currentScores
      ? currentScores[0].map((option, index) => (
          <div key={index} className="bg-gray-100 p-3 rounded-md text-gray-800 flex justify-between">
            <span>{option}</span>
            <span className="font-bold">{currentScores[1][index]} votes</span>
          </div>
        ))
      : winner.map((option, index) => (
          <div key={index} className="bg-gray-100 p-3 rounded-md text-gray-800">
            {option}
          </div>
        ))}
  </div>
);

export const Tally: React.FC<{ params: { slug: string } }> = ({ params }) => {
  const { account, signAndSubmitTransaction } = useWallet();
  const [creatorAddr, setCreatorAddr] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [winner, setWinner] = useState<string[]>([]);
  const [currentScores, setCurrentScores] = useState<Scores | null>(null);

  const createTransactionPayload = useCallback(
    (functionName: string, args: (string | number)[]): InputTransactionData => ({
      data: {
        function: `${VOTING_MODULE_ADDRESS}::Voting::${functionName}`,
        functionArguments: args,
      },
    }),
    [],
  );

  const checkInitialization = useCallback(async () => {
    if (!creatorAddr) return;
    try {
      const scores = await fetchScores(creatorAddr);
      if (scores && scores[0].length > 0) {
        setIsInitialized(true);
        setCurrentScores(scores);
        const winnerResult = await checkWinner(creatorAddr);
        if (winnerResult) setWinner(winnerResult);
      }
    } catch (error) {
      console.error("Failed to check initialization:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initialize voting data",
      });
    }
  }, [creatorAddr]);

  const handleDeclareWinner = async () => {
    if (!creatorAddr) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No creator address available",
      });
      return;
    }

    setSending(true);
    setMessage("Declaring winner...");

    try {
      const response = await fetch(`/api/tally?autolink=${params.slug}`, { method: "GET" });
      const { voteId } = await response.json();

      const payload = createTransactionPayload("declare_winner", [creatorAddr]);
      const tx = await signAndSubmitTransaction(payload);
      await aptosClient().waitForTransaction(tx.hash);

      const body = {
        autolink: params.slug,
        transactionHash: tx.hash,
        network: "Testnet",
        finished: true,
        voteId,
      };

      const postResponse = await fetch("/api/tally", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (postResponse.ok) {
        setMessage("✅ Winner declared successfully! You may now close the window.");
        toast({ title: "Success", description: "Winner declared successfully!" });
      } else {
        
        setMessage(`❌ You may now close the window`);
      }
    } catch (error) {
      console.error("Error declaring winner:", error);
      setMessage(`❌ You may now close the window`);
      
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    setCreatorAddr(account?.address ?? "");
  }, [account]);

  useEffect(() => {
    const initializeComponent = async () => {
      await checkInitialization();
      const winnerResult = await checkWinner(creatorAddr);
      setWinner(winnerResult);
    };

    initializeComponent();
  }, [checkInitialization, creatorAddr, message, handleDeclareWinner]);

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden max-w-md mx-auto w-[350px]">
      <img
        src="https://waveedfund.org/wp-content/uploads/2023/03/standard-vote.jpg"
        alt="Voting Concept"
        className="w-full h-auto object-cover"
      />

      <div className="p-6 flex flex-col justify-between">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {winner.length > 0 ? "Current Polls" : "Create New Vote"}
        </h2>

        {!sending && (
          <>
            {!currentScores && winner.length > 0 && (
              <div className="mb-6">
                <Label className="text-lg font-semibold text-gray-700">Winner:</Label>
                <p className="mt-1 text-gray-800 text-base">{winner.join(", ")}</p>
              </div>
            )}

            <div className="mb-2">
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                {winner.length > 0 ? `Declared Winner: ${winner.join(", ")}` : "Voting Options:"}
              </Label>
              <VotingOptions winner={winner} currentScores={currentScores} />
            </div>

            <div className="mt-4">
              <Label className="text-sm font-semibold text-gray-700">Creator Address:</Label>
              <div className="text-gray-800 border border-gray-300 rounded-full p-2 px-4 mt-1">
                {formatAddress(creatorAddr)}
              </div>
            </div>

            <Button
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105"
              onClick={handleDeclareWinner}
              disabled={sending || !isInitialized}
            >
              Declare Winner
            </Button>
          </>
        )}

        {sending && (
          <div className="text-center text-gray-800 my-8">
            <h2 className="text-xl">{message}</h2>
          </div>
        )}
      </div>
    </div>
  );
};

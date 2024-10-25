"use client";

import React, { useState, useCallback, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Wallet, NearContext } from "@/wallets/near";

// Types
type Scores = [string[], number[]];
type VotingOption = { option: string; votes: number };

const CONTRACT_ID = process.env.NEXT_PUBLIC_VOTING_CONTRACT_ID || "";

const VotingOptions: React.FC<{ winner: string[]; currentScores: Scores | null }> = ({ winner, currentScores }) => (
  <div className="space-y-2">
    {currentScores
      ? currentScores[0].map((option, index) => (
          <div key={index} className="bg-indigo-100 p-3 text-gray-800 flex justify-between">
            <span>{option}</span>
            <span className="font-bold">{currentScores[1][index]} votes</span>
          </div>
        ))
      : winner.map((option, index) => (
          <div key={index} className="bg-indigo-100 p-3 text-gray-800">
            {option}
          </div>
        ))}
  </div>
);

export const Tally: React.FC<{ params: { slug: string } }> = ({ params }) => {
  const [wallet] = useState(() => new Wallet({ networkId: 'testnet', createAccessKeyFor: CONTRACT_ID }));
  const [signedAccountId, setSignedAccountId] = useState<string>("");
  const [creatorAddr, setCreatorAddr] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [winner, setWinner] = useState<string[]>([]);
  const [currentScores, setCurrentScores] = useState<Scores | null>(null);

  // Initialize wallet
  useEffect(() => {
    wallet.startUp((accountId: React.SetStateAction<string>) => {
      setSignedAccountId(accountId);
      if (accountId) {
        setCreatorAddr(accountId);
      }
    });
  }, [wallet]);

  const fetchScores = useCallback(async (account: string): Promise<Scores | null> => {
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
  }, [wallet]);

  const checkWinner = useCallback(async (account: string): Promise<string[]> => {
    if (!account) return [];
    try {
      const result = await wallet.viewMethod({
        contractId: CONTRACT_ID,
        method: 'view_winner',
        args: { account_id: account }
      });
      return result || [];
    } catch (error) {
      console.error("Failed to check winner:", error);
      return [];
    }
  }, [wallet]);

  const checkInitialization = useCallback(async () => {
    if (!creatorAddr) return;
    try {
      const scores = await fetchScores(creatorAddr);
      if (scores && scores[0].length > 0) {
        setIsInitialized(true);
        setCurrentScores(scores);
      }
    } catch (error) {
      console.error("Failed to check initialization:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initialize voting data",
      });
    }
  }, [creatorAddr, fetchScores]);

  const handleDeclareWinner = async () => {
    if (!creatorAddr || !signedAccountId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please connect your wallet first",
      });
      return;
    }

    setSending(true);
    setMessage("Declaring winner...");

    try {
      const response = await fetch(`/api/tally?autolink=${params.slug}`, { method: "GET" });
      const { voteId } = await response.json();

      // Call the smart contract method
      const result = await wallet.callMethod({
        contractId: CONTRACT_ID,
        method: 'declare_winner',
        args: { account_id: creatorAddr },
        gas: '100000',
        deposit: ''
      });

      const body = {
        autolink: params.slug,
        transactionHash: result,
        network: 'testnet',
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
        const winnerResult = await checkWinner(creatorAddr);
        setWinner(winnerResult);
      } else {
        setMessage(`❌ You may now close the window`);
      }
    } catch (error) {
      console.error("Error declaring winner:", error);
      setMessage(`❌ You may now close the window`);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to declare winner",
      });
    } finally {
      setSending(false);
    }
  };

  // Check initialization when creatorAddr changes
  useEffect(() => {
    checkInitialization();
  }, [checkInitialization, creatorAddr]);

  // Check for winner when initialized
  useEffect(() => {
    const fetchWinner = async () => {
      if (isInitialized && creatorAddr) {
        const winnerResult = await checkWinner(creatorAddr);
        setWinner(winnerResult);
      }
    };

    fetchWinner();
  }, [isInitialized, creatorAddr, checkWinner]);

  return (
    <NearContext.Provider value={{ wallet, signedAccountId }}>
      <div className="max-w-md mx-auto w-[400px]">
        <img
          src={winner.length > 0 ? "/winner.png" : "https://waveedfund.org/wp-content/uploads/2023/03/standard-vote.jpg"}
          alt="Voting Concept"
          className="w-full h-[150px] object-contain"
        />

        <div className="p-6 flex flex-col justify-between">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {winner.length > 0 ? "Current Polls" : "Create New Vote"}
          </h2>

          {!sending && (
            <>
              {!signedAccountId && (
                <Button
                  className="w-full mb-4 bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => wallet.signIn()}
                >
                  Connect NEAR Wallet
                </Button>
              )}

              {!currentScores && winner.length > 0 && (
                <div className="mb-4">
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

              <div className="mt-3 flex space-x-2 items-center justify-center">
                <Label className="text-sm font-semibold text-gray-700">Creator Address:</Label>
                <div className="text-gray-800">{creatorAddr}</div>
              </div>

              {signedAccountId && (
                <Button
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105"
                  onClick={handleDeclareWinner}
                  disabled={sending || !isInitialized}
                >
                  Declare Winner
                </Button>
              )}
            </>
          )}

          {sending && (
            <div className="text-center text-gray-800 my-8">
              <h2 className="text-xl">{message}</h2>
            </div>
          )}
        </div>
      </div>
    </NearContext.Provider>
  );
};
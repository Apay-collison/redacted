import React, { useState, useCallback, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast } from "@/components/ui/use-toast";
import { VOTING_MODULE_ADDRESS } from "@/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { aptosClient } from "@/utils/aptosClient";
import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

// Types
interface VotingOption {
  option: string;
  votes: number;
}

type Scores = [string[], number[]];

// Helper functions
const createTransactionPayload = (functionName: string, args: any[]): InputTransactionData => ({
  data: {
    function: `${VOTING_MODULE_ADDRESS}::Voting::${functionName}`,
    functionArguments: args,
  },
});

const fetchScores = async (account: { address: string } | null): Promise<Scores | null> => {
  if (!account) return null;
  try {
    const result = await aptosClient().view<Scores>({
      payload: {
        function: `${VOTING_MODULE_ADDRESS}::Voting::view_current_scores`,
        functionArguments: [account.address],
      },
    });
    return result ? [result[0], result[1].map(Number)] : null;
  } catch (error) {
    console.error("Failed to fetch scores:", error);
    return null;
  }
};

const checkWinner = async (account: { address: string } | null): Promise<string[] | null> => {
  if (!account) return null;
  try {
    const result = await aptosClient().view<[string]>({
      payload: {
        function: `${VOTING_MODULE_ADDRESS}::Voting::view_winner`,
        functionArguments: [account.address],
      },
    });
    return result;
  } catch (error) {
    console.error("Failed to check winner:", error);
    return null;
  }
};

// Sub-components
interface VotingOptionsProps {
  options: string[];
  currentScores: Scores | null;
}

const VotingOptions: React.FC<VotingOptionsProps> = ({ options, currentScores }) => (
  <div className="space-y-2">
    {currentScores
      ? currentScores[0].map((option, index) => (
          <div key={index} className="bg-gray-100 p-3 rounded-md text-gray-800 flex justify-between">
            <span>{option}</span>
            <span className="font-bold">{currentScores[1][index]} votes</span>
          </div>
        ))
      : options.map((option, index) => (
          <div key={index} className="bg-gray-100 p-3 rounded-md text-gray-800">
            {option}
          </div>
        ))}
  </div>
);

// Main component
interface CreateVoteProps {
  params: { slug: string };
}

export const CreateVote: React.FC<CreateVoteProps> = ({ params }) => {
  const { account, signAndSubmitTransaction } = useWallet();
  const [sending, setSending] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [options, setOptions] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [winner, setWinner] = useState<string[] | null>(null);
  const [currentScores, setCurrentScores] = useState<Scores | null>(null);

  const fetchVotingOptions = useCallback(async () => {
    try {
      const response = await fetch(`/api/create?autolink=${params.slug}`);
      const json = await response.json();
      const parsedData = JSON.parse(json);
      setTopic(parsedData.topic || "");
      setOptions(parsedData.option || []);
    } catch (error) {
      console.error("Error fetching voting options:", error);
    }
  }, [params.slug]);

  const checkInitialization = useCallback(async () => {
    if (!account) return;
    try {
      const scores = await fetchScores(account);
      if (scores && scores[0].length > 0) {
        setIsInitialized(true);
        setCurrentScores(scores);
        const winnerResult = await checkWinner(account);
        if (winnerResult) setWinner(winnerResult);
      }
    } catch (error) {
      console.error("Failed to check initialization:", error);
    }
  }, [account]);

  const handleCreateVote = useCallback(async () => {
    if (!account) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please connect your wallet first.",
      });
      return;
    }

    if (options.length < 2 || options.length > 3) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide 2 or 3 options to create a vote.",
      });
      return;
    }

     await checkInitialization();

    setSending(true);
    setMessage("Creating vote...");

    try {
      await fetchVotingOptions();
      const paddedOptions = [...options, "", ""].slice(0, 3);
      const payload = createTransactionPayload("initialize_with_options", paddedOptions);
      const tx = await signAndSubmitTransaction(payload);
      await aptosClient().waitForTransaction(tx.hash);

      // You can add additional logic here after successful transaction
    } catch (error: any) {
      console.error(error);
      setMessage(`❌ An error occurred: ${error.message}`);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create vote",
      });
    } finally {
      setSending(false);
    }
  }, [account, options, params.slug, signAndSubmitTransaction, fetchVotingOptions]);

  useEffect(() => {
    const initializeComponent = async () => {
      await fetchVotingOptions();
      await checkInitialization();
    };

    initializeComponent();
  }, [fetchVotingOptions, checkInitialization, handleCreateVote]);

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden max-w-md mx-auto w-[350px]">
      <img
        src="https://waveedfund.org/wp-content/uploads/2023/03/standard-vote.jpg"
        alt="Voting Concept"
        className="w-full h-auto object-cover"
      />

      <div className="p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {currentScores ? "Current Polls" : "Create New Vote"}
          </h2>

          {!sending && (
            <>
              {!currentScores && (
                <div className="mb-6">
                  <Label className="text-lg font-semibold text-gray-700">Topic:</Label>
                  <p className="mt-1 text-gray-800 text-base">{topic}</p>
                </div>
              )}

              <div className="mb-2">
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                  {winner ? `Declared Winner: ${winner}` : "Voting Options:"}
                </Label>
                <VotingOptions options={options} currentScores={currentScores} />
              </div>
            </>
          )}

          {sending && (
            <div className="text-center text-gray-800 my-8">
              <h2 className="text-xl">{message}</h2>
            </div>
          )}
        </div>

        {!isInitialized && (
          <Button
            onClick={handleCreateVote}
            disabled={options.length < 2 || sending}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-md w-full transition duration-200 ease-in-out transform hover:scale-105"
          >
            {sending ? "Creating Vote..." : "Create Vote"}
          </Button>
        )}
      </div>
    </div>
  );
};

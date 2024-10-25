import React, { useState, useCallback, useEffect, useContext } from "react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NearContext } from '@/wallets/near';

// Types
interface VotingOption {
  option: string;
  votes: number;
}

type Scores = [string[], number[]];

// Helper function to view contract data
const viewContractState = async (wallet: any, contractId: string, method: string, args: any = {}) => {
  try {
    return await wallet.viewMethod({
      contractId,
      method,
      args,
    });
  } catch (error) {
    console.error(`Failed to view ${method}:`, error);
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
          <div key={index} className="bg-indigo-100 p-3 text-gray-800 flex justify-between">
            <span>{option}</span>
            <span className="font-bold">{currentScores[1][index]} votes</span>
          </div>
        ))
      : options.map((option, index) => (
          <div key={index} className="bg-indigo-100 p-3 text-gray-800">
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
  const { wallet, signedAccountId } = useContext(NearContext);
  const [sending, setSending] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [options, setOptions] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [winner, setWinner] = useState<string[] | null>(null);
  const [currentScores, setCurrentScores] = useState<Scores | null>(null);

  const CONTRACT_ID = process.env.NEXT_PUBLIC_NEAR_VOTING_CONTRACT_ID || '';

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
    if (!wallet || !signedAccountId) return;

    try {
      const scores = await viewContractState(wallet, CONTRACT_ID, 'view_current_scores', { account_id: signedAccountId });
      if (scores && scores[0].length > 0) {
        setIsInitialized(true);
        setCurrentScores(scores);
        const winnerResult = await viewContractState(wallet, CONTRACT_ID, 'view_winner', { account_id: signedAccountId });
        if (winnerResult) setWinner(winnerResult);
      }
    } catch (error) {
      console.error("Failed to check initialization:", error);
    }
  }, [wallet, signedAccountId]);

  const handleCreateVote = useCallback(async () => {
    if (!wallet || !signedAccountId) {
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
      
      // Call the NEAR contract method
      const result = await wallet.callMethod({
        contractId: CONTRACT_ID,
        method: 'initialize_with_options',
        args: { options: paddedOptions }
      });

      toast({
        variant: "default",
        title: "Create Success!",
        description: "You've successfully started a voting session",
      });

      // Refresh the state after successful creation
      await checkInitialization();
    } catch (error: any) {
      console.error(error);
      setMessage(`❌ An error occurred: ${error.message}`);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setSending(false);
    }
  }, [wallet, signedAccountId, options, params.slug, fetchVotingOptions, checkInitialization]);

  useEffect(() => {
    const initializeComponent = async () => {
      await fetchVotingOptions();
      await checkInitialization();
    };

    initializeComponent();
  }, [fetchVotingOptions, checkInitialization]);

  return (
    <div className="overflow-y-auto max-w-lg mx-auto w-[400px]">
      <img
        src={currentScores ? "/go.gif" : "https://waveedfund.org/wp-content/uploads/2023/03/standard-vote.jpg"}
        alt="Voting Concept"
        className="w-full h-[150px] object-cover"
      />

      <div className="p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {currentScores ? "Current Polls" : "Begin New Vote"}
          </h2>

          {!sending && (
            <>
              {!currentScores && (
                <div className="mb-3 flex items-center justify-center space-x-1">
                  <Label className="text-lg font-semibold text-gray-700">Topic:</Label>
                  <p className="text-gray-800 text-base">{topic}</p>
                </div>
              )}

              <div className="mb-3">
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

          {currentScores && (
            <div className="text-center text-gray-800 my-8">
              <h2 className="text-base">✅ You may now close this window</h2>
            </div>
          )}
        </div>

        {!isInitialized && (
          <Button
            onClick={handleCreateVote}
            disabled={options.length < 2 || sending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-sm w-full transition duration-200 ease-in-out transform hover:scale-105"
          >
            {sending ? "Creating Vote..." : "Create Vote"}
          </Button>
        )}
      </div>
    </div>
  );
};
import { useState, useContext } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "../ui/use-toast";
import { NearContext } from '@/wallets/near';
import { utils } from 'near-api-js';

export default function SendBtn({ params }: { params: { slug: string } }) {
  const { wallet, signedAccountId } = useContext(NearContext);
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [hash, setHash] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function submit() {
    if (!wallet || !signedAccountId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please connect your wallet first",
      });
      return;
    }

    try {
      setMessage("Loading...");
      const response = await fetch(`/api/send?sendautolink=${params.slug}`, {
        method: "GET",
      });
      const json = await response.json();
      const { to_address: receiverId, amount: value } = JSON.parse(json);
      
      setIsPending(true);

      // Convert amount to yoctoNEAR (1 NEAR = 10^24 yoctoNEAR)
      const amountInYocto = utils.format.parseNearAmount(value.toString());
      
      if (!amountInYocto) {
        throw new Error("Failed to parse NEAR amount");
      }

      // Send NEAR tokens
      const result = await wallet.callMethod({
        contractId: receiverId,
        method: 'ft_transfer',
        args: {
          receiver_id: receiverId,
          amount: amountInYocto
        },
        gas: '30000000000000', // 30 TGas
        deposit: '1', // 1 yoctoNEAR required for transfers
      });

      // Get transaction result
      const txResult = await wallet.getTransactionResult(result);
      setHash(result); // Save transaction hash

      queryClient.invalidateQueries();
      
      toast({
        title: "Success",
        description: `Transaction succeeded, hash: ${result}`,
      });

      // Update API about successful transaction
      const body = {
        sendautolink: `${params.slug}`,
        transactionHash: result,
        network: process.env.NEXT_PUBLIC_NEAR_NETWORK || "testnet",
      };

      const postResponse = await fetch(`/api/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (postResponse.ok) {
        setMessage("✅ You may now close the window");
      } else {
        const json = await postResponse.json();
        setMessage(`❌ An error occurred: ${json.error}`);
      }
    } catch (error: any) {
      console.error("Transaction error:", error);
      setMessage(`❌ An error occurred: ${error.message || "Unknown error"}`);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send NEAR tokens",
      });
    } finally {
      setIsPending(false);
    }
  }

  const handleConnect = () => {
    if (wallet) {
      wallet.signIn();
    }
  };

  return (
    <>
      {!signedAccountId && (
        <button
          onClick={handleConnect}
          className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-10 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105"
        >
          Connect NEAR Wallet
        </button>
      )}

      {signedAccountId && !hash && (
        <button
          className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-10 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105"
          disabled={isPending}
          onClick={submit}
        >
          {isPending ? "Confirming..." : "Send"}
        </button>
      )}
      
      {hash && (
        <>
          <h2 className="text-black text-xl">Transaction successful</h2>
          <h2 className="text-black">{message}</h2>
        </>
      )}
    </>
  );
}
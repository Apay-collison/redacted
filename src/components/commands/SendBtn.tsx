"use client";
import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { WalletSelector } from "../WalletSelector";
import { transferAPT } from "@/entry-functions/transferAPT";
import { aptosClient } from "@/utils/aptosClient";
import { toast } from "../ui/use-toast";

export default function SendBtn({ params }: { params: { slug: string } }) {
  const { connected, signAndSubmitTransaction } = useWallet();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [hash, setHash] = useState<string | null>(null); 
  const [isPending, setIsPending] = useState(false); 

  async function submit() {
    try {
      setMessage("Loading...");
      const response = await fetch(`/api/send?sendautolink=${params.slug}`, {
        method: "GET",
      });
      const json = await response.json();
      const { to_address: to, amount: value } = JSON.parse(json);
      
      setIsPending(true); 

      const committedTransaction = await signAndSubmitTransaction(
        transferAPT({
          to: to,
          amount: Math.floor(value * Math.pow(10, 8)),
        }),
      );

      const executedTransaction = await aptosClient().waitForTransaction({
        transactionHash: committedTransaction.hash,
      });

      setHash(executedTransaction.hash); // Save transaction hash
      queryClient.invalidateQueries();
      
      toast({
        title: "Success",
        description: `Transaction succeeded, hash: ${executedTransaction.hash}`,
      });

      const body = {
        sendautolink: `${params.slug}`,
        transactionHash: executedTransaction.hash,
        network: "Testnet",
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
    } catch (error) {
      setMessage(`❌ An error occurred: ${error}`);
    } finally {
      setIsPending(false); 
    }
  }

  return (
    <>
      {!connected && <WalletSelector />}

      {connected && !hash && (
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

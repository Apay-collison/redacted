"use client";
import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "../WalletSelector";

export default function ConnectBtn({ params }: { params: { slug: string } }) {
  const { account, connected, signMessageAndVerify } = useWallet();
  const [signature, setSignature] = useState(false);
  const [message, setMessage] = useState("");

  async function sign() {
    setMessage("Loading...");
    const message = `session ID: ${params.slug}`;
    const data = await signMessageAndVerify({ message: message, nonce: "" });
    setSignature(data);

    console.log(data);

    const body = {
      message: message,
      signature: data,
      autolink: `${params.slug}`,
      address: account?.address,
    };
    try {
      const response = await fetch("/api/connect", {
        method: "POST", // Specify the request method
        headers: {
          "Content-Type": "application/json", // Set the Content-Type header
        },
        body: JSON.stringify(body), // Convert the data to a JSON string
      });
      if (response.ok) {
        setMessage("✅\nYou may now close the window");
      } else {
        const json = await response.json();
        setMessage(`❌\nAn error occurred ${json.error}`);
      }
    } catch (error) {
      setMessage(`❌\nAn error occurred ${error}`);
    }
  }

  return (
    <>
      {!signature && <WalletSelector />}
      {connected && !signature && (
        <button
          className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105"
          onClick={sign}
        >
          Sign message
        </button>
      )}
      {signature && (
        <>
          <h2 className="text-white">{message}</h2>
        </>
      )}
    </>
  );
}

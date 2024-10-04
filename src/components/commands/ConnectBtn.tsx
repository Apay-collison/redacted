"use client";
import { useEffect, useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "../WalletSelector";

export default function ConnectBtn({
  params,
  onConnectWallet,
  onWalletConnected,
  onCompleteSignIn,
}: {
  params: { slug: string };
  onConnectWallet: () => void;
  onWalletConnected: () => void;
  onCompleteSignIn: (isSuccess: boolean, errorMsg?: string) => void;
}) {
  const { account, connected, signMessageAndVerify } = useWallet();
  const [signature, setSignature] = useState(false);

  async function sign() {
    onConnectWallet();
    const message = `session ID: ${params.slug}`;

    try {
      const data = await signMessageAndVerify({ message, nonce: "" });

      const body = {
        message: message,
        signature: data,
        autolink: `${params.slug}`,
        address: account?.address,
      };
      const response = await fetch("/api/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        onCompleteSignIn(true);
        setSignature(data);
      } else {
        const json = await response.json();
        onCompleteSignIn(false, json.error);
      }
    } catch (error) {
      onCompleteSignIn(false, "failed to sign in");
    }
  }

  useEffect(() => {
    connected && onWalletConnected();
  }, [account?.address]);

  return (
    <>
      <div className="flex space-x-3">
        {!signature && !connected && <WalletSelector />}
        {connected && !signature && (
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105"
            onClick={sign}
          >
            Complete Sign In
          </button>
        )}
      </div>

      {signature && (
        <h2 className="text-black">{signature ? "✅ You may now close the window" : "Waiting for signature..."}</h2>
      )}
    </>
  );
}

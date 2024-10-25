import { useEffect, useState, useContext } from 'react';
import { NearContext } from '@/wallets/near';

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
  const { wallet, signedAccountId } = useContext(NearContext);
  const [signature, setSignature] = useState(false);
  const isConnected = !!signedAccountId;

  const handleSignIn = () => {
    if (wallet) {
      wallet.signIn();
    }
  };

  async function sign() {
    if (!wallet || !signedAccountId) return;
    
    onConnectWallet();
    const message = `session ID: ${params.slug}`;

    try {
      // For NEAR, we'll use the account ID as verification instead of a signature
      // since NEAR doesn't have a direct message signing equivalent
      const body = {
        message: message,
        signature: signedAccountId, // Using account ID as verification
        autolink: `${params.slug}`,
        address: signedAccountId,
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
        setSignature(true);
      } else {
        const json = await response.json();
        onCompleteSignIn(false, json.error);
      }
    } catch (error) {
      onCompleteSignIn(false, "Failed to sign in");
    }
  }

  useEffect(() => {
    if (isConnected) {
      onWalletConnected();
    }
  }, [signedAccountId]);

  return (
    <>
      <div className="flex space-x-3">
        {!signature && !isConnected && (
          <button
            onClick={handleSignIn}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105"
          >
            Connect NEAR Wallet
          </button>
        )}
        {isConnected && !signature && (
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105"
            onClick={sign}
          >
            Complete Sign In
          </button>
        )}
      </div>

      {signature && (
        <h2 className="text-black">
          {signature ? "✅ You may now close the window" : "Waiting for signature..."}
        </h2>
      )}
    </>
  );
}
import type { Network } from "@aptos-labs/wallet-adapter-react";

export const NETWORK: Network = (process.env.NEXT_PUBLIC_APP_NETWORK as Network) ?? "testnet";
export const MODULE_ADDRESS = process.env.NEXT_PUBLIC_MODULE_ADDRESS;

export const VOTING_MODULE_ADDRESS = "0xdd71645e95789f143af6fd1b3ed37164378faea32691a56eb51b7d605fe16962";
import type { Network } from "@aptos-labs/wallet-adapter-react";

export const NETWORK: Network = (process.env.NEXT_PUBLIC_APP_NETWORK as Network) ?? "testnet";
export const MODULE_ADDRESS = process.env.NEXT_PUBLIC_MODULE_ADDRESS;

export const VOTING_MODULE_ADDRESS = "0x050f57325ca7db645579a690faddd09558abce46ad70faceb0b9c69f6a2066f7";
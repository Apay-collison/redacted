import "dotenv/config";

export const NETWORKS = {
  mainnet: {
    name: "Mainnet",
    url: `https://api.mainnet.aptoslabs.com/v1`,
    explorer: "https://explorer.aptoslabs.com",
  },
  testnet: {
    name: "Testnet",
    url: `https://api.testnet.aptoslabs.com/v1`,
    explorer: "https://explorer.aptoslabs.com",
  },
};

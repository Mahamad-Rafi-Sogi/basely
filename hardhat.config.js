require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const BASE_SEPOLIA_RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
const BASE_MAINNET_RPC_URL = process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org";

if (!PRIVATE_KEY) {
  console.warn("[hardhat.config] Warning: PRIVATE_KEY is not set. Deployments to live networks will fail.");
}

module.exports = {
  solidity: "0.8.20",
  networks: {
    // Base Sepolia testnet (chainId 84532)
    baseSepolia: {
      url: BASE_SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    },
    // Base Mainnet (chainId 8453)
    baseMainnet: {
      url: BASE_MAINNET_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    },
    // Local Hardhat
    hardhat: {}
  }
};

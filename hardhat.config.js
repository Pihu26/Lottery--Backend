require("@nomicfoundation/hardhat-chai-matchers")
require("@nomiclabs/hardhat-ethers")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("dotenv").config()

const sepolia_PRIVATE_KEY = process.env.PRIVATE_KEY || "0xsepolia"
const sepolia_RPC_URL = process.env.RPC_URL || "https/sepolia"
const API_KEY = process.env.ETHERSCAN_API_KEYS || "key"
const COINMARKET_API_KEY = process.env.COINMARKET_API_KEY || "key"

module.exports = {
    solidity: { compilers: [{ version: "0.8.7" }, { version: "0.8.19" }] },

    networks: {
        hardhat: {
            chainId: 31337,
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 31337,
            blockConfirmations: 1,
        },
        sepolia: {
            url: sepolia_RPC_URL,
            accounts: [sepolia_PRIVATE_KEY],
            chainId: 11155111,
            blockConfirmations: 6,
        },
    },
    etherscan: {
        // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
        apiKey: {
            sepolia: API_KEY,
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
    gasReporter: {
        enabled: true,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
    },
    mocha: {
        timeout: 500000, // 500 seconds max for running tests
    },
}

const { ethers, network } = require("hardhat")
const fs = require("fs")

const FRONT_END_ADDRESS_FILE =
    "../nextjs-smartcontract-lottery/constants/contractAddress.json"
const FRONTEND_ABI_FILE = "../nextjs-smartcontract-lottery/constants/abi.json"

module.exports = async function () {
    if (process.env.UPDATE_FRONTEND) {
        console.log("updating frontend....")
        updateContractAddresses()
        updateAbi()
    }
}

async function updateAbi() {
    const raffle = await ethers.getContract("Raffle")
    fs.writeFileSync(FRONTEND_ABI_FILE, raffle.interface.formatJson())
}

async function updateContractAddresses() {
    const raffle = await ethers.getContract("Raffle")
    const currentAddress = JSON.parse(
        fs.readFileSync(FRONT_END_ADDRESS_FILE, "utf-8"),
    )
    const chain = network.config.chainId.toString()
    if (chain in currentAddress) {
        if (!currentAddress[chain].includes(raffle.target)) {
            currentAddress[chain].push(raffle.target)
        }
    }
    {
        currentAddress[chain] = [raffle.target]
    }

    fs.writeFileSync(FRONT_END_ADDRESS_FILE, JSON.stringify(currentAddress))
}

module.exports.tags = ["all", "frontend"]

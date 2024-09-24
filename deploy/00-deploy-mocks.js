const { deployments, getNamedAccounts } = require("hardhat")
const { ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-config")
const { network } = require("hardhat")

const BASE_FEE = ethers.parseEther("0.25") //0.25 cost uss 0.25 link for the randome words gas fees for premimum
const GAS_PRICE_LINK = 1e9

module.exports = async ({ deployments, getNamedAccounts }) => {
    const { log, deploy } = deployments
    const { deployer } = await getNamedAccounts()
    const args = [BASE_FEE, GAS_PRICE_LINK]

    if (developmentChains.includes(network.name)) {
        log("local network deployingg")

        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            args: args,
            log: true,
        })

        log("deployed...")
        log("------------------")
    }
}
module.exports.tags = ["all", "mocks"]

// Successfully submitted source code for contract
// contracts/Raffle.sol:Raffle at 0xe713103782C4A2729576fdC1C419Bfdc4bfAF5B6
//0xe713103782C4A2729576fdC1C419Bfdc4bfAF5B6
// for verification on the block explorer. Waiting for verification result...

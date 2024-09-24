const { ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-config")

const { verify } = require("../utils/verify")

module.exports = async ({ deployments, getNamedAccounts }) => {
    const { log, deploy } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    const VRF_SUB_FUND_AMOUNT = ethers.parseEther("3")
    let vrfCoordinatorAdddress, subscriptionId
    log("depploying raffle........")

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mocks = await ethers.getContract(
            "VRFCoordinatorV2Mock",
        )
        vrfCoordinatorAdddress = vrfCoordinatorV2Mocks.target
        log(`we got the addresss for mocks${vrfCoordinatorAdddress}`)
        const transcationResponse =
            await vrfCoordinatorV2Mocks.createSubscription()
        log("created subscriptionId")
        const transactionReceipt = await transcationResponse.wait(1)
        subscriptionId = transactionReceipt.logs[0].args.subId
        // subscriptionId = BigInt(transactionReceipt.logs[0].topics[1])
        await vrfCoordinatorV2Mocks.fundSubscription(
            subscriptionId,
            VRF_SUB_FUND_AMOUNT,
        )
    } else {
        vrfCoordinatorAdddress = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    const entranceFee = networkConfig[chainId]["entranceFees"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callBackGasLimit = networkConfig[chainId]["callBackGasLimit"]
    const interval = networkConfig[chainId]["interval"]

    const args = [
        vrfCoordinatorAdddress,
        entranceFee,
        gasLane,
        subscriptionId,
        callBackGasLimit,
        interval,
    ]

    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmation: network.config.blockConfirmations || 1,
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEYS
    ) {
        await verify(raffle.address, args)
    }
    log("---------------------")
}

module.exports.tags = ["all", "raffle"]

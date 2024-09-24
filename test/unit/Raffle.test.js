const { network, getNamedAccounts, deployments } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-config.js")
const { assert, expect } = require("chai")
const { Console } = require("console")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Test", async function () {
          let raffle, vrfCoordinatorV2, deployer, raffleEntraFee, interval
          const chainId = network.config.chainId
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              raffle = await ethers.getContract("Raffle", deployer)
              vrfCoordinatorV2 = await ethers.getContract(
                  "VRFCoordinatorV2Mock",
                  deployer,
              )
              raffleEntraFee = await raffle.getEntranceFee()
              interval = await raffle.getInterval()
          })

          describe("constructor", async function () {
              it("innitalize raffle correctly", async function () {
                  const states = await raffle.getRaffleState()
                  assert.equal(states.toString(), "0")
                  assert.equal(
                      interval.toString(),
                      networkConfig[chainId]["interval"],
                  )
              })
              it("entrance fee is correct ", async () => {
                  assert.equal(
                      raffleEntraFee.toString(),
                      networkConfig[chainId]["entranceFees"],
                  )
              })
          })
          describe("enterRaffle", () => {
              it("to revert if not enough balance", async () => {
                  await expect(raffle.enterRaffle()).to.be.reverted
              })
              it("to be in players", async () => {
                  await raffle.enterRaffle({ value: raffleEntraFee })
                  const playerFromContract = await raffle.getPlayers(0)
                  console.log("Interval Type:", typeof interval)
                  console.log("Interval:", interval)
                  assert.equal(playerFromContract, deployer)
              })
              it("emit an event", async () => {
                  await expect(
                      raffle.enterRaffle({ value: raffleEntraFee }),
                  ).to.emit(raffle, "raffleEnter")
              })
              it("to see if is calcutating and reverting", async () => {
                  await raffle.enterRaffle({ value: raffleEntraFee })
                  let bigIntInterval = BigInt(interval)
                  let incrementedInterval = Number(bigIntInterval)
                  console.log(incrementedInterval)
                  await network.provider.send("evm_increaseTime", [
                      incrementedInterval + 1,
                  ])
                  await network.provider.send("evm_mine", [])
                  await raffle.performUpkeep("0x")
                  await expect(raffle.enterRaffle({ value: raffleEntraFee })).to
                      .be.reverted
              })
          })
          describe("checkUpkeep", async () => {
              it("returns false if people havent send enough Eth", async () => {
                  let bigIntInterval = BigInt(interval)
                  let incrementedInterval = Number(bigIntInterval)
                  await network.provider.send("evm_increaseTime", [
                      incrementedInterval + 1,
                  ])
                  await network.provider.send("evm_mine", [])
                  const { upKeepNeeded } =
                      await raffle.checkUpkeep.staticCall("0x")
                  assert(!upKeepNeeded)
              })
              it("return false if raffle is noot open", async () => {
                  let bigIntInterval = BigInt(interval)
                  let incrementedInterval = Number(bigIntInterval)
                  await raffle.enterRaffle({ value: raffleEntraFee })
                  await network.provider.send("evm_increaseTime", [
                      incrementedInterval + 1,
                  ])
                  await network.provider.send("evm_mine", [])
                  await raffle.performUpkeep("0x")
                  const raffleState = await raffle.getRaffleState()
                  const { upKeepNeeded } =
                      await raffle.checkUpkeep.callStatic("0x")
                  console.log(upKeepNeeded)
                  assert(raffleState.toString(), "1")
                  assert(upKeepNeeded, true)
              })
              it("to return false if time has not pass", async () => {
                  await raffle.enterRaffle({ value: raffleEntraFee })
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() - 1,
                  ])
                  await network.provider.send("evm_mine", [])
                  await raffle.performUpkeep([])
                  const { upKeedNeeded } = await raffle.callStatic.checkUpkeep(
                      [],
                  )
                  assert(!upKeedNeeded)
              })
              it("return true if time has passed,state is open,has players", async () => {
                  let bigIntInterval = BigInt(interval)
                  let incrementedInterval = Number(bigIntInterval)
                  await raffle.enterRaffle({ value: raffleEntraFee })
                  await network.provider.send("evm_increaseTime", [
                      incrementedInterval + 1,
                  ])
                  await network.provider.send("evm_mine", [])
                  await raffle.performUpkeep("0x")
                  const { upKeepNeeded } = await raffle.callStatic.checkUpkeep(
                      [],
                  )
                  assert(upKeepNeeded)
              })
          })
          describe("performUpKeep", () => {
              it("revert when checkupkeep is false", async () => {
                  await expect(raffle.performUpkeep("0x")).to.be.reverted
              })
              it("events,in calculating state,call vrfCoordinator", async () => {
                  await raffle.enterRaffle({ value: raffleEntraFee })
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.send("evm_mine", [])
                  const tx = await raffle.performUpkeep([])
                  const txRecipt = await tx.wait(1)
                  const requestId = txRecipt.logs[1].args.requestId
                  const raffleStaes = await raffle.getRaffleState()
                  assert(raffleStaes.toString(), "1")
                  assert(requestId.toNumber > 0)
              })
          })
          describe("randomWords", async function () {
              beforeEach(async function () {
                  await raffle.enterRaffle({ value: raffleEntraFee })
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.send("evm_mine", [])
              })
              it("to be called after perform upkeep", async () => {
                  await expect(
                      vrfCoordinatorV2.fulfillRandomWords(0, raffle, address),
                  ).to.be.reverted
              })
              it("pick winner,sends all money ,reset the lottery", async () => {
                  const additionalentrance = 3
                  const startingindex = 1
                  const accounts = await ethers.getSigners()
                  for (
                      i = startingindex;
                      i < additionalentrance + startingindex;
                      i++
                  ) {
                      const raffleconnteced = await raffle.connect(accounts[i])
                      await raffleconnteced.enterRaffle({
                          value: raffleEntraFee,
                      })
                      const startingtime = await raffle.getLatestTimeStamp()
                  }

                  await new Promise(async (resolve, reject) => {
                      raffle.once("winner picked", async () => {
                          console.log("event found")
                          try {
                              const players = await raffle.getNumOfPlayers()
                              const rafflestate = await raffle.getRaffleState()
                              const endingtime =
                                  await raffle.getLatestTimeStamp()
                              const winner = await raffle.getRecentWinner()
                              const endingBalance =
                                  await accounts[2].getBalance()
                              assert(rafflestate.toString(), "0")
                              assert(players.toString(), "0")
                              assert(endingtime > startingtime)
                              assert.equal(
                                  endingBalance.toString(),
                                  stratingBalance
                                      .toString()
                                      .add(
                                          raffleEntraFee
                                              .mul(additionalentrance)
                                              .add(raffleEntraFee)
                                              .toString(),
                                      ),
                              )
                          } catch (e) {
                              reject(e)
                          }

                          resolve()
                      })

                      const tx = await raffle.performUpkeep([])
                      const txRecipt = await tx.wait(1)
                      const stratingBalance = await accounts[2].getBalance()
                      await vrfCoordinatorV2.fulfillRandomWords(
                          txRecipt.logs[1].args.requestId,
                          raffle.address,
                      )
                  })
              })
          })
      })

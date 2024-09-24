const { network, ethers, getNamedAccounts, deployments } = require("hardhat")
const { developmentChains, networkConfig } = require("../../../helper-config")
const { assert, expect } = require("chai")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Test", async function () {
          let raffle, deployer, raffleEntraFee

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer)
              raffleEntraFee = await raffle.getEntranceFee()
          })
          it("work with live chainlink keeeper", async () => {
              console.log("Setting up test...")

              const startingtime = await raffle.getLastestTimeStamp()
              const accounts = await ethers.getSigners()
              console.log("Setting up Listener...")

              await new Promise(async (resolve, reject) => {
                  raffle.once("winner picked", async () => {
                      console.log("event found")
                      try {
                          const players = await raffle.getNumOfPlayers()
                          const rafflestate = await raffle.getRaffleState()
                          const endingtime = await raffle.getLastestTimeStamp()
                          const winner = await raffle.getRecentWinner()
                          const endingBalance = await accounts[0].getBalance()
                          assert.equal(rafflestate.toString(), "0")
                          assert.equal(players.toString(), "0")
                          assert.equal(winner.toString(), accounts[0].address)
                          assert.equal(endingtime > startingtime)
                          assert.equal(
                              endingBalance.toString(),
                              startingBalance.add(raffleEntraFee).toString(),
                          )
                          resolve()
                      } catch (e) {
                          reject(e)
                      }
                  })
                  console.log("Entering Raffle...")
                  const tx = await raffle.enterRaffle({
                      value: raffleEntraFee,
                  })
                  await tx.wait(1)
                  console.log("Ok, time to wait...")
                  const startingBalance = await accounts[0].getBalance()
                  console.log("done getting balance")
              })
          })
      })

import hre, { ethers } from 'hardhat'
import { RallyV1CreatorCoinBridge } from '../typechain/RallyV1CreatorCoinBridge'
import { RallyV1CreatorCoinFactory } from '../typechain/RallyV1CreatorCoinFactory'

async function main() {
  const factoryFactory = await ethers.getContractFactory(
    'RallyV1CreatorCoinFactory'
  )

  const bridgeFactory = await ethers.getContractFactory(
    'RallyV1CreatorCoinBridge'
  )

  // If we had constructor arguments, they would be passed into deploy()
  let factoryContract = (await factoryFactory.deploy()) as RallyV1CreatorCoinFactory

  // The address the Contract WILL have once mined
  console.log('Factory address:', factoryContract.address)

  // The transaction that was sent to the network to deploy the Contract
  console.log(
    'Factory deploy transaction hash:',
    factoryContract.deployTransaction.hash
  )

  // The contract is NOT deployed yet; we must wait until it is mined
  await factoryContract.deployed()

  const bridge = (await bridgeFactory.deploy(
    factoryContract.address
  )) as RallyV1CreatorCoinBridge

  // The address the Contract WILL have once mined
  console.log('Bridge address:', bridge.address)

  // The transaction that was sent to the network to deploy the Contract
  console.log('Bridge deploy transaction hash:', bridge.deployTransaction.hash)

  await bridge.deployed()

  await factoryContract.setBridge(bridge.address)

  await hre.run('verify:verify', {
    address: factoryContract.address,
    constructorArguments: []
  })

  await hre.run('verify:verify', {
    address: bridge.address,
    constructorArguments: [factoryContract.address]
  })
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

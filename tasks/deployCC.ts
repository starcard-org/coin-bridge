import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { RallyV1CreatorCoinBridge } from '../typechain/RallyV1CreatorCoinBridge'
import { RallyV1CreatorCoinFactory } from '../typechain/RallyV1CreatorCoinFactory'
import { RallyV1CreatorCoin } from '../typechain/RallyV1CreatorCoin'
import { BigNumber } from '@ethersproject/bignumber'

/* e.g.
npx hardhat --network localhost deployCC \
--factory 0x5fbdb2315678afecb367f032d93f642f64180aa3 \
--bridge 0xe7f1725e7734ce288f8367e1bb143e90bb3f0512 \
--symbol JONO \
--receiver 0x21c795b0d13b5c7434654062d98fce634795d70a \
--amount 100
*/
task(
  'deployCC',
  'Deploys a fake CC for testing and mints `amount` coins to `receiver`'
)
  .addParam<string>('factory', 'factoryAddress')
  .addParam<string>('bridge', 'bridgeAddress')
  .addOptionalParam<string>('pricingcurveid', 'pricingCurveId')
  .addOptionalParam<string>('name', 'name')
  .addParam<string>('symbol', 'symbol')
  .addParam<string>('receiver', 'receiverAddress')
  .addOptionalParam<string>('amount', 'amount', '100')
  .setAction(async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
    if (hre.network.name === 'hardhat') {
      console.warn(
        'You are running the deployCC task with Hardhat network, which' +
          'gets automatically created and destroyed every time. Use the Hardhat' +
          " option '--network localhost'"
      )
    }

    let {
      factory: factoryAddress,
      bridge: bridgeAddress,
      pricingcurveid: pricingCurveId,
      name,
      symbol,
      receiver: receiverAddress,
      amount,
    } = taskArgs

    name = name || `${symbol} Coin`
    pricingCurveId = pricingCurveId || `${symbol}fakePricingCurveId`

    const factoryContract = (await hre.ethers.getContractAt(
      'RallyV1CreatorCoinFactory',
      factoryAddress
    )) as RallyV1CreatorCoinFactory
    const bridgeContract = (await hre.ethers.getContractAt(
      'RallyV1CreatorCoinBridge',
      bridgeAddress
    )) as RallyV1CreatorCoinBridge

    await factoryContract.deployCreatorCoin(pricingCurveId, name, symbol)

    const coinAddress = await factoryContract.getCreatorCoinFromSidechainPricingCurveId(
      pricingCurveId
    )

    const coinFactory = await hre.ethers.getContractFactory(
      'RallyV1CreatorCoin'
    )

    const creatorCoin = coinFactory.attach(coinAddress) as RallyV1CreatorCoin

    console.log('CC deployed')
    console.log(
      `Creator coin: ${name} (${symbol}) ${pricingCurveId} deployed to ${creatorCoin.address}`
    )

    const [signer] = await hre.ethers.getSigners()

    await factoryContract.setBridge(signer.address)

    // TODO: getSigner(bridge) doesn't work here? get "unknown account" error
    await creatorCoin
      .connect(signer)
      .mint(
        receiverAddress,
        BigNumber.from(amount).mul(BigNumber.from(10).pow(6))
      )

    await factoryContract.setBridge(bridgeContract.address)
  })

// SPDX-License-Identifier: MIT
import { ContractTransaction, utils } from 'ethers'
import { getCreate2Address } from '@ethersproject/address'
import { ethers, waffle } from 'hardhat'
import { RallyV1CreatorCoinFactory } from '../typechain/RallyV1CreatorCoinFactory'
import expect from './shared/expect'

const createFixtureLoader = waffle.createFixtureLoader

describe('RallyV1CreatorCoinFactory', () => {
  const [wallet, other] = waffle.provider.getWallets()

  let factory: RallyV1CreatorCoinFactory
  let coinBytecode: string
  const fixture = async () => {
    const factoryFactory = await ethers.getContractFactory(
      'RallyV1CreatorCoinFactory'
    )
    return (await factoryFactory.deploy()) as RallyV1CreatorCoinFactory
  }

  let loadFixture: ReturnType<typeof createFixtureLoader>
  before('create fixture loader', async () => {
    loadFixture = createFixtureLoader([wallet, other])
  })

  before('load coin bytecode', async () => {
    coinBytecode = (await ethers.getContractFactory('RallyV1CreatorCoin'))
      .bytecode
  })

  beforeEach('deploy factory', async () => {
    factory = await loadFixture(fixture)
  })

  it('owner is deployer', async () => {
    expect(factory.owner()).to.eventually.eq(wallet.address)
  })

  xit('factory bytecode', async () => {
    expect(await waffle.provider.getCode(factory.address)).toMatchSnapshot()
  })

  describe('#transferOwnership', () => {
    it('fails if caller is not owner', async () => {
      await expect(factory.connect(other).transferOwnership(wallet.address)).to
        .be.reverted
    })

    it('updates owner', async () => {
      await factory.transferOwnership(other.address)
      expect(factory.owner()).to.eventually.eq(other.address)
    })

    it('emits event', async () => {
      await expect(factory.transferOwnership(other.address))
        .to.emit(factory, 'OwnershipTransferred')
        .withArgs(wallet.address, other.address)
    })

    it('cannot be called by original owner', async () => {
      await factory.transferOwnership(other.address)
      await expect(factory.transferOwnership(wallet.address)).to.be.reverted
    })
  })

  describe('#deployCreatorCoin', () => {
    let name: string
    let symbol: string
    let coinGuid: string
    let coinGuidHash: string
    let create2Address: string
    let create: Promise<ContractTransaction>

    beforeEach('deploy factory', async () => {
      name = 'token'
      symbol = 'tkn'
      coinGuid = 'some-guid'

      coinGuidHash = utils.keccak256(
        utils.defaultAbiCoder.encode(['string'], [coinGuid])
      )

      create2Address = getCreate2Address(
        factory.address,
        coinGuidHash,
        utils.keccak256(coinBytecode)
      )
      create = factory.deployCreatorCoin(coinGuid, name, symbol)
    })

    it('emits the event with the correct args', async () => {
      await expect(create)
        .to.emit(factory, 'CreatorCoinDeployed')
        .withArgs(coinGuidHash, create2Address, coinGuid, name, symbol)
    })

    it('fails if already deployed with the same guid', async () => {
      await expect(
        factory.deployCreatorCoin(coinGuid, name, symbol)
      ).to.be.revertedWith('already deployed')
    })

    it('factory address matches calculated address', async () => {
      expect(factory.getCreatorCoinFromGuid(coinGuid)).to.eventually.eq(
        create2Address
      )
    })

    // const coinContractFactory = await ethers.getContractFactory(
    //   'RallyV1CreatorCoin'
    // )
    // const coin = coinContractFactory.attach(create2Address)
    // expect(coin.factory()).to.eventually.eq(factory.address)
    // expect(coin.coinGuid()).to.eventually.eq(bytes32CoinGuid)
    // })
  })
})

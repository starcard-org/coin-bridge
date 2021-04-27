// SPDX-License-Identifier: MIT
import { utils } from 'ethers'
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
    it('succeeds for a new coin guid', async () => {
      const bytes32CoinGuid = utils.formatBytes32String('some-guid')

      const constructorArgumentsEncoded = utils.defaultAbiCoder.encode(
        ['bytes32'],
        [bytes32CoinGuid]
      )

      const create2Address = getCreate2Address(
        factory.address,
        utils.keccak256(constructorArgumentsEncoded),
        utils.keccak256(coinBytecode)
      )

      const create = factory.deployCreatorCoin(bytes32CoinGuid)

      await expect(create)
        .to.emit(factory, 'CreatorCoinDeployed')
        .withArgs(bytes32CoinGuid, create2Address)

      await expect(
        factory.deployCreatorCoin(bytes32CoinGuid)
      ).to.be.revertedWith('already deployed')

      expect(factory.getCreatorCoin(bytes32CoinGuid)).to.eventually.eq(
        create2Address
      )

      const coinContractFactory = await ethers.getContractFactory(
        'RallyV1CreatorCoin'
      )
      const coin = coinContractFactory.attach(create2Address)
      expect(coin.factory()).to.eventually.eq(factory.address)
      expect(coin.coinGuid()).to.eventually.eq(bytes32CoinGuid)
    })
  })
})

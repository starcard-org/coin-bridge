// SPDX-License-Identifier: MIT
import { Contract, ContractTransaction, utils } from 'ethers'
import { getCreate2Address } from '@ethersproject/address'
import { ethers, waffle } from 'hardhat'
import { RallyV1CreatorCoinFactory, RallyV1CreatorCoin } from '../typechain'
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
  before('create fixture loader', () => {
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
    await expect(factory.owner()).to.eventually.eq(wallet.address)
  })

  xit('factory bytecode', async () => {
    expect(await waffle.provider.getCode(factory.address)).toMatchSnapshot()
  })

  describe('#setBridge', () => {
    it('sets the bridge address', async () => {
      expect(await factory.bridge()).to.eq(
        '0x0000000000000000000000000000000000000000'
      )
      const fakeAddress = '0x1000000000000000000000000000000000000000'
      await factory.setBridge(fakeAddress)
      expect(factory.bridge()).to.eventually.eq(fakeAddress)
    })

    it('can set the bridge address more than once', async () => {
      const fakeAddress1 = '0x1000000000000000000000000000000000000000'
      const fakeAddress2 = '0x2000000000000000000000000000000000000000'
      await factory.setBridge(fakeAddress1)
      expect(await factory.bridge()).to.eq(fakeAddress1)

      await factory.setBridge(fakeAddress2)

      expect(await factory.bridge()).to.eq(fakeAddress2)
    })

    it('cannot set the bridge address to 0x0', async () => {
      const fakeAddress1 = '0x1000000000000000000000000000000000000000'
      const zeroAddress = '0x0000000000000000000000000000000000000000'
      await factory.setBridge(fakeAddress1)

      await expect(factory.setBridge(zeroAddress)).to.be.revertedWith(
        'invalid bridge address'
      )

      expect(await factory.bridge()).to.eq(fakeAddress1)
    })
  })

  describe('#transferOwnership', () => {
    it('fails if caller is not owner', async () => {
      await expect(factory.connect(other).transferOwnership(wallet.address)).to
        .be.reverted
    })

    it('updates owner', async () => {
      await factory.transferOwnership(other.address)
      await expect(factory.owner()).to.eventually.eq(other.address)
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
    let coinPricingCurveId: string
    let pricingCurveIdHash: string
    let create2Address: string
    let create: Promise<ContractTransaction>

    beforeEach('deploy factory', () => {
      name = 'token'
      symbol = 'tkn'
      coinPricingCurveId = 'some-curve-id'

      pricingCurveIdHash = utils.keccak256(
        utils.defaultAbiCoder.encode(['string'], [coinPricingCurveId])
      )

      create2Address = getCreate2Address(
        factory.address,
        pricingCurveIdHash,
        utils.keccak256(coinBytecode)
      )
      create = factory.deployCreatorCoin(coinPricingCurveId, name, symbol)
    })

    it('emits the event with the correct args', async () => {
      await expect(create)
        .to.emit(factory, 'CreatorCoinDeployed')
        .withArgs(
          pricingCurveIdHash,
          create2Address,
          coinPricingCurveId,
          name,
          symbol,
          6
        )
    })

    it('fails if already deployed with the same pricing curve id', async () => {
      await expect(
        factory.deployCreatorCoin(coinPricingCurveId, name, symbol)
      ).to.be.revertedWith('already deployed')
    })

    it('factory address matches calculated address', async () => {
      await expect(
        factory.getCreatorCoinFromSidechainPricingCurveId(coinPricingCurveId)
      ).to.eventually.eq(create2Address)
    })

    it('fails if not owner', async () => {
      await expect(
        factory
          .connect(other)
          .deployCreatorCoin(coinPricingCurveId, name, symbol)
      ).to.be.revertedWith('caller is not the owner')
    })
  })

  describe('#deployCreatorCoinWithDecimals', () => {
    let decimals: number
    let name: string
    let symbol: string
    let coinPricingCurveId: string
    let pricingCurveIdHash: string
    let create2Address: string
    let create: Promise<ContractTransaction>

    beforeEach('deploy factory', () => {
      decimals = 18
      name = 'token'
      symbol = 'tkn'
      coinPricingCurveId = 'some-curve-id'

      pricingCurveIdHash = utils.keccak256(
        utils.defaultAbiCoder.encode(['string'], [coinPricingCurveId])
      )

      create2Address = getCreate2Address(
        factory.address,
        pricingCurveIdHash,
        utils.keccak256(coinBytecode)
      )
      create = factory.deployCreatorCoinWithDecimals(
        coinPricingCurveId,
        name,
        symbol,
        decimals
      )
    })

    it('emits the event with the correct args', async () => {
      await expect(create)
        .to.emit(factory, 'CreatorCoinDeployed')
        .withArgs(
          pricingCurveIdHash,
          create2Address,
          coinPricingCurveId,
          name,
          symbol,
          decimals
        )
    })

    it('fails if already deployed with the same pricing curve id', async () => {
      await expect(
        factory.deployCreatorCoinWithDecimals(
          coinPricingCurveId,
          name,
          symbol,
          decimals
        )
      ).to.be.revertedWith('already deployed')
    })

    it('factory address matches calculated address', async () => {
      await expect(
        factory.getCreatorCoinFromSidechainPricingCurveId(coinPricingCurveId)
      ).to.eventually.eq(create2Address)
    })

    it('deployed coin has matching decimals ', async () => {
      await create
      const coinFactory = await ethers.getContractFactory('RallyV1CreatorCoin')

      const cc = new Contract(
        create2Address,
        coinFactory.interface,
        waffle.provider
      ) as RallyV1CreatorCoin

      const foundDecimal = await cc.decimals()

      expect(foundDecimal).to.eq(decimals)
    })

    it('fails if not owner', async () => {
      await expect(
        factory
          .connect(other)
          .deployCreatorCoinWithDecimals(
            coinPricingCurveId,
            name,
            symbol,
            decimals
          )
      ).to.be.revertedWith('caller is not the owner')
    })
  })
})

// SPDX-License-Identifier: MIT
import { utils } from 'ethers'
import { ethers, waffle } from 'hardhat'
import { RallyV1CreatorCoinFactory } from '../typechain/RallyV1CreatorCoinFactory'
import { RallyV1CreatorCoin } from '../typechain/RallyV1CreatorCoin'
import expect from './shared/expect'

const createFixtureLoader = waffle.createFixtureLoader

describe('RallyV1CreatorCoin', () => {
  const defaultName = 'token'
  const defaultSymbol = 'tkn'
  const defaultGuid = '28ba2e93-b83a-4c1b-936f-99bc91c264ee'
  const [wallet, other] = waffle.provider.getWallets()

  let factory: RallyV1CreatorCoinFactory
  let creatorCoin: RallyV1CreatorCoin
  let coinBytecode: string
  const fixture = async () => {
    const factoryFactory = await ethers.getContractFactory(
      'RallyV1CreatorCoinFactory'
    )
    const factory = (await factoryFactory.deploy()) as RallyV1CreatorCoinFactory

    await factory.deployCreatorCoin(defaultGuid, defaultName, defaultSymbol)

    const coinAddress = await factory.getCreatorCoinFromGuid(defaultGuid)

    const coinFactory = await ethers.getContractFactory('RallyV1CreatorCoin')

    const creatorCoin = coinFactory.attach(coinAddress) as RallyV1CreatorCoin

    return { factory, creatorCoin }
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
    ;({ factory, creatorCoin } = await loadFixture(fixture))
  })

  describe('#mint', () => {
    it('fails to mint with non bridge address', async () => {
      const fakeAddress = '0x1000000000000000000000000000000000000000'
      await factory.setBridge(fakeAddress)

      expect(creatorCoin.mint(wallet.address, 100)).to.be.revertedWith(
        'only bridge'
      )
    })

    it('mints when called from bridge address', async () => {
      await factory.setBridge(wallet.address)

      expect(await creatorCoin.balanceOf(other.address)).to.eq(0)

      await creatorCoin.connect(wallet).mint(other.address, 100)

      expect(await creatorCoin.balanceOf(other.address)).to.eq(100)
    })
  })

  describe('#getters', () => {
    it('name and symbol are not the default from contract inheritance', async () => {
      expect(creatorCoin.name()).to.eventually.not.eq('rally-cc')
      expect(creatorCoin.symbol()).to.eventually.not.eq('rcc')
    })

    it('gets name and symbol from passed constructor params', async () => {
      expect(creatorCoin.name()).to.eventually.eq(defaultName)
      expect(creatorCoin.symbol()).to.eventually.eq(defaultSymbol)
    })

    it('#coinGuid matches ', async () => {
      expect(creatorCoin.coinGuid()).to.eventually.eq(defaultGuid)
    })

    it('#coinGuidHash matches ', async () => {
      const coinGuidHash = utils.keccak256(
        utils.defaultAbiCoder.encode(['string'], [defaultGuid])
      )
      expect(creatorCoin.coinGuidHash()).to.eventually.eq(coinGuidHash)
    })

    it('#factory matches ', async () => {
      expect(creatorCoin.factory()).to.eventually.eq(factory.address)
    })
  })

  describe('#setters', () => {
    describe('#setTotalSidechainSupply', () => {
      it('sets total when called from bridge address', async () => {
        await factory.setBridge(wallet.address)

        expect(await creatorCoin.totalSidechainSupply()).to.eq(0)

        await creatorCoin.connect(wallet).setTotalSidechainSupply(1000)

        expect(await creatorCoin.totalSidechainSupply()).to.eq(1000)
      })

      it('reverts when called from non bridge address', async () => {
        expect(await creatorCoin.totalSidechainSupply()).to.eq(0)
        expect(
          creatorCoin.connect(wallet).setTotalSidechainSupply(1000)
        ).to.be.revertedWith('only bridge')
        expect(await creatorCoin.totalSidechainSupply()).to.eq(0)
      })
    })
  })
})

// SPDX-License-Identifier: MIT
import { ethers, waffle } from 'hardhat'
import { RallyV1CreatorCoinFactory } from '../typechain/RallyV1CreatorCoinFactory'
import { RallyV1CreatorCoinBridge } from '../typechain/RallyV1CreatorCoinBridge'
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
  let bridge: RallyV1CreatorCoinBridge

  const fixture = async () => {
    const factoryFactory = await ethers.getContractFactory(
      'RallyV1CreatorCoinFactory'
    )
    const factory = (await factoryFactory.deploy()) as RallyV1CreatorCoinFactory

    await factory.deployCreatorCoin(defaultGuid, defaultName, defaultSymbol)

    const coinAddress = await factory.getCreatorCoinFromGuid(defaultGuid)

    const coinFactory = await ethers.getContractFactory('RallyV1CreatorCoin')

    const creatorCoin = coinFactory.attach(coinAddress) as RallyV1CreatorCoin

    const brigdeFactory = await ethers.getContractFactory(
      'RallyV1CreatorCoinBridge'
    )

    const bridge = (await brigdeFactory.deploy(
      factory.address
    )) as RallyV1CreatorCoinBridge

    await factory.setBridge(bridge.address)

    return { factory, creatorCoin, bridge }
  }

  let loadFixture: ReturnType<typeof createFixtureLoader>
  before('create fixture loader', async () => {
    loadFixture = createFixtureLoader([wallet, other])
  })

  beforeEach('deploy contracts', async () => {
    ;({ factory, creatorCoin, bridge } = await loadFixture(fixture))
  })

  describe('#getCreatorCoinFromGuid', () => {
    it('gets the creatorcoin associated with a guid', async () => {
      expect(bridge.getCreatorCoinFromGuid(defaultGuid)).to.eventually.eq(
        creatorCoin.address
      )
    })

    it('reverts on undeployed guid', async () => {
      await expect(
        bridge.getCreatorCoinFromGuid('garbage-guid')
      ).to.be.revertedWith('coin not deployed')
    })
  })

  describe('#bridgeToSidechain', () => {
    beforeEach('load other wallet with a balance', async () => {
      await bridge.bridgeToMainnet(defaultGuid, other.address, 100)
    })

    it('decreases balance and total supply', async () => {
      const amount = 100
      const domain = {
        name: 'rally-cc',
        version: '1',
        chainId: 31337,
        verifyingContract: creatorCoin.address
      }

      const types = {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      }

      const value = {
        owner: other.address,
        spender: bridge.address,
        value: amount,
        nonce: await creatorCoin.nonces(other.address),
        deadline: ethers.constants.MaxUint256
      }

      const signature = await other._signTypedData(domain, types, value)
      const { v, r, s } = ethers.utils.splitSignature(signature)

      expect(await creatorCoin.totalSupply()).to.eq(amount)
      expect(await creatorCoin.balanceOf(other.address)).to.eq(amount)
      await expect(
        bridge
          .connect(other)
          .bridgeToSidechain(
            defaultGuid,
            amount,
            ethers.constants.MaxUint256,
            v,
            r,
            s
          )
      )
        .to.emit(bridge, 'CreatorCoinBridgedToSideChain')
        .withArgs(creatorCoin.address, defaultGuid, other.address, amount)
      expect(await creatorCoin.totalSupply()).to.eq(0)
      expect(await creatorCoin.balanceOf(other.address)).to.eq(0)
    })
  })

  describe('#bridgeToMainnet', () => {
    it('fails if caller is not owner', async () => {
      await expect(
        bridge.connect(other).bridgeToMainnet(defaultGuid, other.address, 100)
      ).to.be.reverted
    })

    it('mints into address if called from owner', async () => {
      expect(await creatorCoin.balanceOf(other.address)).to.eq(0)
      await bridge.bridgeToMainnet(defaultGuid, other.address, 100)
      expect(await creatorCoin.balanceOf(other.address)).to.eq(100)
    })

    it('increases total supply', async () => {
      expect(await creatorCoin.totalSupply()).to.eq(0)
      await bridge.bridgeToMainnet(defaultGuid, other.address, 100)
      expect(await creatorCoin.totalSupply()).to.eq(100)
    })

    it('emits a bridged event', async () => {
      const amount = 100

      await expect(bridge.bridgeToMainnet(defaultGuid, other.address, amount))
        .to.emit(bridge, 'CreatorCoinBridgedToMainnet')
        .withArgs(creatorCoin.address, defaultGuid, other.address, amount)
    })
  })
})
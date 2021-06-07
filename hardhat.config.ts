import { config as dotEnvConfig } from 'dotenv'
dotEnvConfig()

import { HardhatUserConfig, NetworksUserConfig } from 'hardhat/types'

import 'hardhat-typechain'
import 'solidity-coverage'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-etherscan'
import 'hardhat-abi-exporter'

import fs from 'fs'

// don't import these if there's no typechain artifacts yet (e.g. the very first compile),
// since it creates a circular dependency
if (fs.existsSync('./typechain')) {
  require('./tasks/deployCC')
}

const networks: NetworksUserConfig = {
  hardhat: {
    allowUnlimitedContractSize: false
  },
  mainnet: {
    url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`
  },
  ropsten: {
    url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`
  },
  rinkeby: {
    url: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`
  },
  goerli: {
    url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`
  },
  kovan: {
    url: `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`
  }
}

if (!!process.env.RINKEBY_PRIVATE_KEY && !!networks.rinkeby) {
  networks.rinkeby.accounts = [`0x${process.env.RINKEBY_PRIVATE_KEY}`]
}

const config: HardhatUserConfig = {
  networks,
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  solidity: {
    version: '0.7.6',
    settings: {
      optimizer: {
        enabled: true,
        runs: 800
      },
      metadata: {
        // do not include the metadata hash, since this is machine dependent
        // and we want all generated code to be deterministic
        // https://docs.soliditylang.org/en/v0.7.6/metadata.html
        bytecodeHash: 'none'
      }
    }
  },
  abiExporter: {
    clear: true,
    flat: true
  }
}

export default config

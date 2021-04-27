// SPDX-License-Identifier: MIT
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
import { solidity } from 'ethereum-waffle'

chai.use(chaiAsPromised)
chai.use(solidity)
chai.use(jestSnapshotPlugin())

const { expect } = chai

export default expect

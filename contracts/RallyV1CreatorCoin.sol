// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "./RallyV1CreatorCoinDeployer.sol";

contract RallyV1CreatorCoin {
  address public immutable factory;
  bytes32 public immutable coinGuid;

  constructor() {
    (factory, coinGuid) = RallyV1CreatorCoinDeployer(msg.sender).parameters();
  }
}

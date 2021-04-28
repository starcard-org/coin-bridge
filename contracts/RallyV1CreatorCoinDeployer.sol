// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "./RallyV1CreatorCoin.sol";

contract RallyV1CreatorCoinDeployer {
  struct Parameters {
    address factory;
    bytes32 coinGuidHash;
    string coinGuid;
    string name;
    string symbol;
  }

  /// @notice Get the parameters to be used in constructing the pool, set transiently during pool creation.
  /// @dev Called by the pool constructor to fetch the parameters of the pool
  /// Returns factory The factory address
  /// Returns coinGuid The pricingCurveId from rally sidechain
  Parameters public parameters;

  /// @dev Deploys a pool with the given parameters by transiently setting the parameters storage slot and then
  /// clearing it after deploying the pool.
  /// @param factory The contract address of the Rally V1 Creator Coin factory
  /// @param coinGuidHash The hashed pricingCurveId from rally sidechain
  function deploy(
    address factory,
    bytes32 coinGuidHash,
    string memory coinGuid,
    string memory name,
    string memory symbol
  ) internal returns (address creatorCoin) {
    parameters = Parameters({
      factory: factory,
      coinGuidHash: coinGuidHash,
      coinGuid: coinGuid,
      name: name,
      symbol: symbol
    });

    creatorCoin = address(new RallyV1CreatorCoin{ salt: coinGuidHash }());
    delete parameters;
  }
}

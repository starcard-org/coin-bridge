// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "./RallyV1CreatorCoin.sol";

contract RallyV1CreatorCoinDeployer {
  struct Parameters {
    address factory;
    bytes32 coinGuid;
  }

  /// @notice Get the parameters to be used in constructing the pool, set transiently during pool creation.
  /// @dev Called by the pool constructor to fetch the parameters of the pool
  /// Returns factory The factory address
  /// Returns coinGuid The pricingCurveId from rally sidechain
  Parameters public parameters;

  /// @dev Deploys a pool with the given parameters by transiently setting the parameters storage slot and then
  /// clearing it after deploying the pool.
  /// @param factory The contract address of the Rally V1 Creator Coin factory
  /// @param coinGuid The pricingCurveId from rally sidechain (WITHOUT DASHES, 32 bytes please)
  function deploy(address factory, bytes32 coinGuid)
    internal
    returns (address creatorCoin)
  {
    parameters = Parameters({ factory: factory, coinGuid: coinGuid });
    creatorCoin = address(
      new RallyV1CreatorCoin{ salt: keccak256(abi.encode(coinGuid)) }()
    );
    delete parameters;
  }
}

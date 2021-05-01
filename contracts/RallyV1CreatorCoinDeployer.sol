// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "./RallyV1CreatorCoin.sol";

/// @title A contract capable of deploying Creator Coins
/// @dev This is used to avoid having constructor arguments in the creator coin contract, which results in the init code hash
/// of the coin being constant allowing the CREATE2 address of the coin to be cheaply computed on-chain
contract RallyV1CreatorCoinDeployer {
  struct Parameters {
    address factory;
    bytes32 coinGuidHash;
    string coinGuid;
    string name;
    string symbol;
  }

  /// @notice Get the parameters to be used in constructing the coin, set transiently during coin creation.
  /// @dev Called by the coin constructor to fetch the parameters of the coin
  /// Returns coinGuidHash The bytes32 hash of the coinGuid string
  /// Returns coinGuid The pricingCurveId as a string from rally sidechain
  /// Returns name creator coin name
  /// Returns smybol creator coin symbol
  Parameters public parameters;

  /// @dev Deploys a coin with the given parameters by transiently setting the parameters storage slot and then
  /// clearing it after deploying the coin.
  /// @param coinGuidHash The bytes32 hash of the coinGuid string
  /// @param coinGuid The pricingCurveId as a string from rally sidechain
  /// @param name creator coin name
  /// @param symbol creator coin symbol
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

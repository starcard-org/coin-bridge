// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./RallyV1CreatorCoinDeployer.sol";

/// @title Creator Coin V1 Factory
/// @notice Deploys and tracks the Creator Coin ERC20 contracts for bridging individual coins from rally sidechain to eth mainnet
contract RallyV1CreatorCoinFactory is Ownable, RallyV1CreatorCoinDeployer {
  mapping(bytes32 => address) public getCreatorCoin;

  event CreatorCoinDeployed(
    bytes32 coinGuidHash,
    address indexed creatorCoin,
    string coinGuid,
    string name,
    string symbol
  );

  function deployCreatorCoin(
    string memory coinGuid,
    string memory name,
    string memory symbol
  ) external onlyOwner returns (address creatorCoin) {
    bytes32 coinGuidHash = keccak256(abi.encode(coinGuid));

    require(getCreatorCoin[coinGuidHash] == address(0), "already deployed");

    creatorCoin = deploy(address(this), coinGuidHash, coinGuid, name, symbol);

    getCreatorCoin[coinGuidHash] = creatorCoin;
    emit CreatorCoinDeployed(coinGuidHash, creatorCoin, coinGuid, name, symbol);
  }

  function getCreatorCoinFromGuid(string memory coinGuid)
    external
    view
    returns (address creatorCoin)
  {
    bytes32 coinGuidHash = keccak256(abi.encode(coinGuid));
    creatorCoin = getCreatorCoin[coinGuidHash];
  }
}

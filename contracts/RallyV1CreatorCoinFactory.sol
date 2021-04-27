// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./RallyV1CreatorCoinDeployer.sol";

/// @title Creator Coin V1 Factory
/// @notice Deploys and tracks the Creator Coin ERC20 contracts for bridging individual coins from rally sidechain to eth mainnet
contract RallyV1CreatorCoinFactory is Ownable, RallyV1CreatorCoinDeployer {
  mapping(bytes32 => address) public getCreatorCoin;

  event CreatorCoinDeployed(bytes32 coinGuid, address indexed creatorCoin);

  function deployCreatorCoin(bytes32 coinGuid)
    external
    onlyOwner
    returns (address creatorCoin)
  {
    require(getCreatorCoin[coinGuid] == address(0), "already deployed");

    creatorCoin = deploy(address(this), coinGuid);

    getCreatorCoin[coinGuid] = creatorCoin;
    emit CreatorCoinDeployed(coinGuid, creatorCoin);
  }
}

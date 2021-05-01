// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./RallyV1CreatorCoin.sol";
import "./RallyV1CreatorCoinFactory.sol";

/// @title Creator Coin V1 Bridge
/// @notice The main user interaction contract for moving Creator Coins
/// between rally sidechain and etherum mainnet
contract RallyV1CreatorCoinBridge is Ownable {
  /// @dev The contract address of the Rally V1 Creator Coin factory for
  /// looking up contract addresses of CreatorCoins
  address public immutable factory;

  event CreatorCoinBridgedToSideChain(
    address indexed creatorCoin,
    string coinGuid,
    address sender,
    uint256 amount
  );

  event CreatorCoinBridgedToMainnet(
    address indexed creatorCoin,
    string coinGuid,
    address recipient,
    uint256 amount
  );

  constructor(address _factory) {
    factory = _factory;
  }

  function getCreatorCoinFromGuid(string memory coinGuid)
    public
    view
    returns (RallyV1CreatorCoin creatorCoin)
  {
    address coinAddress =
      RallyV1CreatorCoinFactory(factory).getCreatorCoinFromGuid(coinGuid);

    require(coinAddress != address(0), "coin not deployed");

    creatorCoin = RallyV1CreatorCoin(coinAddress);
  }

  function bridgeToSidechain(
    string memory coinGuid,
    uint256 amount,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external {
    RallyV1CreatorCoin creatorCoin = getCreatorCoinFromGuid(coinGuid);
    creatorCoin.permit(msg.sender, address(this), amount, deadline, v, r, s);
    creatorCoin.burnFrom(msg.sender, amount);

    emit CreatorCoinBridgedToSideChain(
      address(creatorCoin),
      coinGuid,
      msg.sender,
      amount
    );
  }

  function bridgeToMainnet(
    string memory coinGuid,
    address recipient,
    uint256 amount
  ) external onlyOwner {
    RallyV1CreatorCoin creatorCoin = getCreatorCoinFromGuid(coinGuid);
    creatorCoin.mint(recipient, amount);

    emit CreatorCoinBridgedToMainnet(
      address(creatorCoin),
      coinGuid,
      recipient,
      amount
    );
  }
}

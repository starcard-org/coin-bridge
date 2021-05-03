// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./RallyV1CreatorCoin.sol";
import "./RallyV1CreatorCoinFactory.sol";

/// @title Creator Coin V1 Bridge
/// @notice The main user interaction contract for moving Creator Coins
/// between rally sidechain and etherum mainnet
contract RallyV1CreatorCoinBridge is AccessControl {
  /// @dev The contract address of the Rally V1 Creator Coin factory for
  /// looking up contract addresses of CreatorCoins
  address public immutable factory;

  /// @dev The identifier of the role which maintains other roles.
  bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");

  /// @dev The identifier of the role which allows accounts to mint tokens.
  bytes32 public constant MINTER_ROLE = keccak256("MINTER");

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

  /// @dev A modifier which checks that the caller has the minter role.
  modifier onlyMinter() {
    require(hasRole(MINTER_ROLE, msg.sender), "only minter");
    _;
  }

  constructor(address _factory) {
    factory = _factory;

    _setupRole(ADMIN_ROLE, msg.sender);
    _setupRole(MINTER_ROLE, msg.sender);
    _setRoleAdmin(MINTER_ROLE, ADMIN_ROLE);
    _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
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
    uint256 amount,
    uint256 newTotalSidechainSupply
  ) external onlyMinter {
    RallyV1CreatorCoin creatorCoin = getCreatorCoinFromGuid(coinGuid);
    creatorCoin.mint(recipient, amount);

    creatorCoin.setTotalSidechainSupply(newTotalSidechainSupply);

    emit CreatorCoinBridgedToMainnet(
      address(creatorCoin),
      coinGuid,
      recipient,
      amount
    );
  }
}

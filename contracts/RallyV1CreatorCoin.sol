// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./RallyV1CreatorCoinDeployer.sol";

contract RallyV1CreatorCoin is AccessControl, ERC20("rally-cc", "rcc") {
  string private _coinGuid;
  string private _name;
  string private _symbol;

  address public immutable factory;
  bytes32 public immutable coinGuidHash;

  /// @dev The identifier of the role which maintains other roles.
  bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");

  /// @dev The identifier of the role which allows accounts to mint tokens.
  bytes32 public constant MINTER_ROLE = keccak256("MINTER");

  constructor() {
    (
      factory,
      coinGuidHash,
      _coinGuid,
      _name,
      _symbol
    ) = RallyV1CreatorCoinDeployer(msg.sender).parameters();

    // TODO: these are wrong since msg.sender is the factory address
    // _setupRole(ADMIN_ROLE, msg.sender);
    // _setupRole(MINTER_ROLE, msg.sender);
    // _setRoleAdmin(MINTER_ROLE, ADMIN_ROLE);
    // _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
  }

  /**
   * @dev Returns the sidechain coin guid.
   */
  function coinGuid() public view virtual returns (string memory) {
    return _coinGuid;
  }

  /**
   * @dev Returns the name of the token.
   */
  function name() public view virtual override returns (string memory) {
    return _name;
  }

  /**
   * @dev Returns the symbol of the token, usually a shorter version of the
   * name.
   */
  function symbol() public view virtual override returns (string memory) {
    return _symbol;
  }

  /// @dev A modifier which checks that the caller has the minter role.
  modifier onlyMinter() {
    require(hasRole(MINTER_ROLE, msg.sender), "only minter");
    _;
  }

  /// @dev Mints tokens to a recipient.
  ///
  /// This function reverts if the caller does not have the minter role.
  ///
  /// @param _recipient the account to mint tokens to.
  /// @param _amount    the amount of tokens to mint.
  function mint(address _recipient, uint256 _amount) external onlyMinter {
    _mint(_recipient, _amount);
  }
}

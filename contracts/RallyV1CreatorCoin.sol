// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/drafts/ERC20Permit.sol";
import "./RallyV1CreatorCoinDeployer.sol";
import "./RallyV1CreatorCoinFactory.sol";

/// @title Creator Coin V1 ERC20
/// @notice Single deployed ERC20 valid contract for each creator coin
contract RallyV1CreatorCoin is
  ERC20("rally-cc", "rcc"),
  ERC20Permit("rally-cc"),
  ERC20Burnable
{
  string private _sidechainPricingCurveId;
  string private _name;
  string private _symbol;

  address public immutable factory;
  bytes32 public immutable curveIdHash;

  /// @dev Convenience amount that is set when minter bridges a coin
  /// to the mainnet, is eventually consistent with sidechain supply
  uint256 private _currentSideChainSupply;

  /// @dev A modifier which checks that the caller is the bridge contract.
  /// we trust the factory to keep track of the bridge contract address
  /// in order for this contract to remain ignorant.
  modifier onlyBridge() {
    address bridge = RallyV1CreatorCoinFactory(factory).bridge();
    require(bridge == msg.sender, "only bridge");
    _;
  }

  constructor() {
    (
      factory,
      curveIdHash,
      _sidechainPricingCurveId,
      _name,
      _symbol
    ) = RallyV1CreatorCoinDeployer(msg.sender).parameters();

    _setupDecimals(6);
  }

  /// @dev Returns the sidechain coin pricingCurveId.
  function sidechainPricingCurveId()
    public
    view
    virtual
    returns (string memory)
  {
    return _sidechainPricingCurveId;
  }

  /// @dev Returns the name of the token.
  function name() public view virtual override returns (string memory) {
    return _name;
  }

  /// @dev Returns the symbol of the token, usually a shorter version of the
  /// name.
  function symbol() public view virtual override returns (string memory) {
    return _symbol;
  }

  /// @dev we periodically update the total supply in the sidechain
  function currentSidechainSupply() public view returns (uint256) {
    return _currentSideChainSupply;
  }

  function updateCurrentSidechainSupply(uint256 amount) public onlyBridge {
    _currentSideChainSupply = amount;
  }

  /// This function reverts if the caller is not the bridge contract
  ///
  /// @param _recipient the account to mint tokens to.
  /// @param _amount    the amount of tokens to mint.
  function mint(address _recipient, uint256 _amount) external onlyBridge {
    _mint(_recipient, _amount);
  }
}

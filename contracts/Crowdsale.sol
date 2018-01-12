pragma solidity ^0.4.18;
import "./Whitelist.sol";
import "./PendingContributions.sol";
import "./WhitelistedGateway.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Crowdsale
 * @dev Crowdsale enables to take contributions that go to a vault
 * if the contributor is whitelisted, otherwise go to a PendingContributions contract
 * waiting for the contributor to be whitelisted
 */
contract Crowdsale is Ownable {
  using SafeMath for uint256;

  // start and end timestamps where investments are allowed (both inclusive)
  uint256 public startTime;
  uint256 public endTime;

  // address where funds are collected
  WhitelistedGateway public gateway;
  PendingContributions public pending;

	bool closedManually = false;
	bool acceptWithoutWhitelist = true;
  uint256 minContrib;

	function setPending(bool newValue) public onlyOwner {
		acceptWithoutWhitelist = newValue;
	}

	function setClosedManually(bool newValue) public onlyOwner {
		closedManually = newValue;
	}


  function Crowdsale(uint256 _startTime, uint256 _endTime, address _vault, Whitelist _whitelist, uint256 _minContrib) public {
    // require(_startTime >= now);
    require(_endTime >= _startTime);
    require(_vault != address(0));

    startTime = _startTime;
    endTime = _endTime;
    minContrib = _minContrib;
    gateway = new WhitelistedGateway(_whitelist, _vault);
	pending = new PendingContributions(gateway);
	// allow the pending container to fund the gateway
	gateway.addOwner(pending);
  }

  // fallback function can be used to buy tokens
  function () external payable {
    require(validPurchase());
    forwardFunds();  
  }

  // send ether either to the Gateway or to the PendingContributions
  function forwardFunds() internal {
	if(gateway.isWhitelisted(msg.sender)) {
		gateway.fund.value(msg.value)(msg.sender);
		return;
	} 
	pending.fund.value(msg.value)(msg.sender);
  }

  // @return true if the transaction can buy tokens
  function validPurchase() internal view returns (bool) {
    bool withinPeriod = now >= startTime && now <= endTime;
    bool sufficientPurchase = msg.value >= minContrib;
    bool whitelisted = gateway.isWhitelisted(msg.sender);
    return !closedManually && withinPeriod && sufficientPurchase && (acceptWithoutWhitelist || whitelisted);
  }

  // @return true if crowdsale event has ended
  function hasEnded() public view returns (bool) {
    return now > endTime;
  }

}
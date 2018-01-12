pragma solidity ^0.4.18;
import "./Whitelist.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract WhitelistedGateway {
	using SafeMath for uint256;

	mapping(address=>bool) public owners;
	mapping(address=>uint) public contributions;
	address public vault;
	Whitelist public whitelist;

	event NewContribution(address contributor, uint256 amount, uint256 timestamp);

	modifier onlyOwners() {
		require(owners[msg.sender]);
		_;
	}

	function addOwner(address newOwner) public onlyOwners {
		owners[newOwner] = true;
	}

	function WhitelistedGateway(Whitelist _whitelist, address _vault) public {
		whitelist = _whitelist;
		vault = _vault;
		owners[msg.sender] = true;
	}

	function isWhitelisted(address candidate) public view returns(bool) {
		return whitelist.isWhitelisted(candidate);
	}

	function fund(address contributor) public payable onlyOwners {
		contributions[contributor] += msg.value;
		vault.transfer(msg.value);
		NewContribution(contributor, msg.value, now);
	}
}
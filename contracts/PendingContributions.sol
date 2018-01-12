pragma solidity ^0.4.18;
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "./WhitelistedGateway.sol";

contract PendingContributions is Ownable {
	using SafeMath for uint256;

	mapping(address=>uint256) public contributions;
	WhitelistedGateway public gateway;

	event PendingContributionReceived(address contributor, uint256 value, uint256 timestamp);
	event PendingContributionAccepted(address contributor, uint256 value, uint256 timestamp);
	event PendingContributionWithdrawn(address contributor, uint256 value, uint256 timestamp);

	function PendingContributions(WhitelistedGateway _gateway) public {
		gateway = _gateway;
	}

	modifier onlyWhitelisted(address contributor) {
		require(gateway.isWhitelisted(contributor));
		_;
	}

	function fund(address contributor) payable public onlyOwner {
		contributions[contributor] += msg.value;
		PendingContributionReceived(contributor, msg.value, now);
	}

	function withdraw() public {
		uint256 toTransfer = contributions[msg.sender];
		require(toTransfer > 0);
		contributions[msg.sender] = 0;
		msg.sender.transfer(toTransfer);
		PendingContributionWithdrawn(msg.sender, toTransfer, now);
	}

	function retry(address contributor) public onlyWhitelisted(contributor) {
		uint256 toTransfer = contributions[contributor];
		require(toTransfer > 0);
		gateway.fund.value(toTransfer)(contributor);
		contributions[contributor] = 0;
		PendingContributionAccepted(contributor, toTransfer, now);
	}
}
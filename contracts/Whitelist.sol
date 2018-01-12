pragma solidity ^0.4.18;
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract Whitelist is Ownable {
	using SafeMath for uint256;

	mapping(address=>bool) public whitelist;
	
	event Authorized(address candidate, uint timestamp);
	event Revoked(address candidate, uint timestamp);

	function authorize(address candidate) public onlyOwner {
	    whitelist[candidate] = true;
	    Authorized(candidate, now);
	}
	
	// also if not in the list..
	function revoke(address candidate) public onlyOwner {
	    whitelist[candidate] = false;
	    Revoked(candidate, now);
	}
	
	function authorizeMany(address[50] candidates) public onlyOwner {
	    for(uint i = 0; i < candidates.length; i++) {
	        authorize(candidates[i]);
	    }
	}

	function isWhitelisted(address candidate) public view returns(bool) {
		return whitelist[candidate];
	}
}
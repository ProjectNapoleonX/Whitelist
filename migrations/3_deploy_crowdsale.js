var Whitelist = artifacts.require("Whitelist");
var Crowdsale = artifacts.require("Crowdsale");

const config = require("../config.json")

console.log(config)

module.exports = function(deployer) {
  deployer.deploy(Crowdsale, config.START_DATE, config.END_DATE, config.VAULT, Whitelist.address, config.MIN_CONTRIB)
};

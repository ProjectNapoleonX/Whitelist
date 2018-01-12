var Crowdsale = artifacts.require("Crowdsale");
var Whitelist = artifacts.require("Whitelist");
var WhitelistedGateway = artifacts.require("WhitelistedGateway");
var PendingContributions = artifacts.require("PendingContributions");

const timeout = ms => new Promise(res => setTimeout(res, ms))

contract('Crowdsale', accounts => {

	let admin = accounts[0];
	let alice = accounts[1];
	let bob = accounts[2];
	let carol = accounts[3];

	let vaultAddress;

	let crowdsale;
	let whitelist;
	let pending;
	let gateway;

	beforeEach(async () => {
		whitelist = await Whitelist.new();
		vaultAddress = whitelist.address.replace('1','2').replace('a','b')
		crowdsale = await Crowdsale.new(0, 10000000000000, vaultAddress, whitelist.address, 42);
		let pendingAddress = await crowdsale.pending();
		pending = PendingContributions.at(pendingAddress);
		let gatewayAddress = await crowdsale.gateway();
		gateway = WhitelistedGateway.at(gatewayAddress);
	})

	it("should register the whitelist correctly", async () => {
		let registeredWhitelist = await gateway.whitelist();
		assert.equal(whitelist.address, registeredWhitelist);
	})

	it("should register the gateway's owners correctly", async () => {
		let crowdsaleIsOwner = await gateway.owners(crowdsale.address);
		let pendingIsOwner = await gateway.owners(pending.address);

		assert.ok(crowdsaleIsOwner);
		assert.ok(pendingIsOwner);
	})

	it("should accept a contribution from a whitelisted contributor", async () => {
		await whitelist.authorize(alice);
		await crowdsale.sendTransaction({from: alice, value: 123})

		let vaultBalance = await web3.eth.getBalance(vaultAddress)
		let pendingContribution = await pending.contributions(alice)
		let pendingBalance = await web3.eth.getBalance(pending.address)
		assert.equal(vaultBalance.toNumber(), 123)
		assert.equal(pendingContribution.toNumber(), 0)
		assert.equal(pendingBalance.toNumber(), 0)
	})

	it("should create a pending contribution for a non whitelisted contributor", async () => {
		await crowdsale.sendTransaction({from: alice, value: 123})

		let vaultBalance = await web3.eth.getBalance(vaultAddress)
		let pendingContribution = await pending.contributions(alice)
		let pendingBalance = await web3.eth.getBalance(pending.address)
		assert.equal(vaultBalance.toNumber(), 0)
		assert.equal(pendingContribution.toNumber(), 123)
		assert.equal(pendingBalance.toNumber(), 123)
	})

	it("should complete a pending transaction after the contributor is whitelisted", async () => {
		await crowdsale.sendTransaction({from: alice, value: 123})
		await whitelist.authorize(alice);
		await pending.retry(alice, {from: bob})

		let vaultBalance = await web3.eth.getBalance(vaultAddress)
		let pendingContribution = await pending.contributions(alice)
		let pendingBalance = await web3.eth.getBalance(pending.address)
		assert.equal(vaultBalance.toNumber(), 123)
		assert.equal(pendingContribution.toNumber(), 0)
		assert.equal(pendingBalance.toNumber(), 0)
	})

	it("should not complete a pending transaction if the contributor is still not whitelisted", async () => {
		await crowdsale.sendTransaction({from: alice, value: 123})
		try {
			await pending.retry(alice, {from: bob})
		} catch (error) {
			
		}

		let vaultBalance = await web3.eth.getBalance(vaultAddress)
		let pendingContribution = await pending.contributions(alice)
		let pendingBalance = await web3.eth.getBalance(pending.address)
		assert.equal(vaultBalance.toNumber(), 0)
		assert.equal(pendingContribution.toNumber(), 123)
		assert.equal(pendingBalance.toNumber(), 123)
	})

	it("should let alice withdraw her funds if her contribution is pending", async () => {
		await crowdsale.sendTransaction({from: alice, value: 123})
		await pending.withdraw({from: alice})

		let vaultBalance = await web3.eth.getBalance(vaultAddress)
		let pendingBalance = await web3.eth.getBalance(pending.address)
		let pendingContribution = await pending.contributions(alice)
		assert.equal(vaultBalance.toNumber(), 0)
		assert.equal(pendingBalance.toNumber(), 0)
		assert.equal(pendingContribution.toNumber(), 0)
	})

	it("should refuse alice's contribution if pending is disabled", async () => {
		await crowdsale.setPending(false, {from: admin})
		try {
			await crowdsale.sendTransaction({from: alice, value: 123})
		} catch (error) {
			assert.ok(error)
		}

		let vaultBalance = await web3.eth.getBalance(vaultAddress)
		let pendingBalance = await web3.eth.getBalance(pending.address)
		let pendingContribution = await pending.contributions(alice)
		assert.equal(vaultBalance.toNumber(), 0)
		assert.equal(pendingBalance.toNumber(), 0)
		assert.equal(pendingContribution.toNumber(), 0)
	})

	it("should record NewContribution events", async () => {
		var events = [];

		let filter = gateway.NewContribution({},  { fromBlock: 0, toBlock: 'latest' })
		filter.watch(function(err, res) {
			events.push(res)
		})

		await whitelist.authorize(alice);
		await whitelist.authorize(bob);
		await crowdsale.sendTransaction({from: alice, value: 123})
		await crowdsale.sendTransaction({from: bob, value: 123})
		await crowdsale.sendTransaction({from: bob, value: 345})

		await timeout(1500)

		filter.stopWatching()

		assert.equal(events.length, 3)
		assert.equal(events[0].args.contributor, alice)
		assert.equal(events[0].args.amount.toNumber(), 123)
		assert.equal(events[2].args.contributor, bob)
		assert.equal(events[2].args.amount.toNumber(), 345)

	})

	it("should record PendingContribution events", async () => {
		var events;

		let filter = pending.allEvents({fromBlock: 0, toBlock: 'latest'})

		await crowdsale.sendTransaction({from: alice, value: 123})
		await crowdsale.sendTransaction({from: bob, value: 123})
		await whitelist.authorize(alice);
		await crowdsale.sendTransaction({from: bob, value: 345})
		await whitelist.authorize(bob);
		await pending.retry(alice, {from: admin})
		await pending.withdraw({from: bob})

		filter.get(function(err, res) {
			events = res
		})

		await timeout(2000)

		filter.stopWatching()

		assert.equal(events.length, 5)
		assert.equal(events[0].args.contributor, alice)
		assert.equal(events[0].args.value.toNumber(), 123)
		assert.equal(events[0].event, "PendingContributionReceived")
		assert.equal(events[2].args.contributor, bob)
		assert.equal(events[2].args.value.toNumber(), 345)
		assert.equal(events[2].event, "PendingContributionReceived")
		assert.equal(events[3].args.contributor, alice)
		assert.equal(events[3].args.value.toNumber(), 123)
		assert.equal(events[3].event, "PendingContributionAccepted")
		assert.equal(events[4].args.contributor, bob)
		assert.equal(events[4].args.value.toNumber(), 468)
		assert.equal(events[4].event, "PendingContributionWithdrawn")
	})

	it("should arrive at the right state", async () => {
		await crowdsale.sendTransaction({from: alice, value: 1000})
		await crowdsale.sendTransaction({from: bob, value: 2000})
		await whitelist.authorize(alice);
		await crowdsale.sendTransaction({from: bob, value: 3000})
		await whitelist.authorize(bob);
		await pending.retry(alice, {from: admin})
		await crowdsale.sendTransaction({from: carol, value: 5000})
		await whitelist.authorize(carol);
		await pending.retry(bob, {from: admin});
		await whitelist.revoke(bob)
		await crowdsale.sendTransaction({from: bob, value: 2000})

		let vaultBalance = await web3.eth.getBalance(vaultAddress)
		let pendingBalance = await web3.eth.getBalance(pending.address)
		let carolPendingContribution = await pending.contributions(carol)
		let aliceContribution = await gateway.contributions(alice)
		let bobContribution = await gateway.contributions(bob)
		let alicePendingContribution = await pending.contributions(alice)
		let bobPendingContribution = await pending.contributions(bob)
		assert.equal(vaultBalance.toNumber(), 1000 + 2000 + 3000)
		assert.equal(pendingBalance.toNumber(), 5000 + 2000)
		assert.equal(carolPendingContribution.toNumber(), 5000)
		assert.equal(aliceContribution.toNumber(), 1000)
		assert.equal(bobContribution.toNumber(), 5000)
		assert.equal(alicePendingContribution.toNumber(), 0)
		assert.equal(bobPendingContribution.toNumber(), 2000)
	})

	it("should refuse funds after closed", async () => {
		await whitelist.authorize(alice)
		await crowdsale.sendTransaction({from: alice, value: 1000})
		await crowdsale.setClosedManually(true)
		try {
			await crowdsale.sendTransaction({from: alice, value: 123})
		} catch (error) {

		}

		let vaultBalance = await web3.eth.getBalance(vaultAddress)
		assert.equal(vaultBalance.toNumber(), 1000)

	})
})

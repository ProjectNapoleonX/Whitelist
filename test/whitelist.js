var Whitelist = artifacts.require("Whitelist");

contract('Whitelist', accounts => {

	let admin = accounts[0];
	let alice = accounts[1];

	it("should have admin as owner", async () => {
		let whitelist = await Whitelist.deployed();
		let owner = await whitelist.owner();
		assert.equal(owner, admin);
	})

	it("should whitelist alice", async () => {
		let whitelist = await Whitelist.deployed();
		let res = await whitelist.authorize(alice);
		assert.equal(res.logs[0].event, "Authorized")
		assert.equal(res.logs[0].args.candidate, alice)
		let isWhitelisted = await whitelist.isWhitelisted(alice)
		assert.equal(isWhitelisted, true);
	})

	it("should revoke alice", async () => {
		let whitelist = await Whitelist.deployed();
		let res = await whitelist.revoke(alice);
		assert.equal(res.logs[0].event, "Revoked")
		assert.equal(res.logs[0].args.candidate, alice)
		let isWhitelisted = await whitelist.isWhitelisted(alice)
		assert.equal(isWhitelisted, false);
	})

	it("should whitelist then revoke alice", async () => {
		let whitelist = await Whitelist.deployed();
		await whitelist.authorize(alice);
		await whitelist.revoke(alice);
		let isWhitelisted = await whitelist.isWhitelisted(alice)
		assert.equal(isWhitelisted, false);
	})

	it("should revoke then whitelist alice", async () => {
		let whitelist = await Whitelist.deployed();
		await whitelist.revoke(alice);
		await whitelist.authorize(alice);
		let isWhitelisted = await whitelist.isWhitelisted(alice)
		assert.equal(isWhitelisted, true);
	})
})

const FansUniteToken = artifacts.require('FansUniteToken.sol');
const Utils = require('./helpers/Utils.js');

let name;
let symbol;
let maxSupply;

let owner;
let token;

contract('FansUniteToken', (accounts) => {
    beforeEach(async () => {
        owner = accounts[0];
        name = 'FansUnite Token';
        symbol = 'FAN';
        maxSupply = 300;

        token = await FansUniteToken.new(name, symbol, maxSupply, { from: owner });
    });

    it("function(): should throw on a default call", async () => {
        try {
            token.call();
        }catch(e) {
            return assert.equal(true, true);
        }
        assert.fail('did not throw and error on a default call');
    });

    it('should return the correct maxSupply after construction', async () => {
        assert.equal(await token.maxSupply.call(), 300);
    });

    it('should return the correct `name`, `symbol`, and `decimals` after construction', async function() {
        let tokenName = await token.name();
        let tokenSymbol = await token.symbol();
        let tokenDecimals = await token.decimals();

        assert.strictEqual(tokenName, name);
        assert.strictEqual(tokenSymbol, symbol);
        assert.equal(tokenDecimals, 18);
    });


    it('should fire an event when mint is called', async () => {
        let toMint = 300;
        let account = accounts[0];
        let result = await token.mint(account, toMint);

        assert.equal(result.logs[0].event, 'Mint', 'mint event not fired');
    });


    it('verifies that token mint updates totalSupply', async () => {
        let toMint = 300;
        let account = accounts[0];
        await token.mint(account, toMint);

        assert.equal(await token.totalSupply.call(), toMint, 'totalSupply does not match expected value');
    });

    it('verifies that balanceOf returns correct value after mint', async () => {
        let toMint = 300;
        let account = accounts[0];
        let result = await token.mint(account, toMint);

        assert.equal(await token.balanceOf(account), toMint, 'balanceOf does not return expected value');
    });

    it('verifies that balanceOf returns correct value when no tokens minted', async () => {
        assert.equal(await token.balanceOf(accounts[0]), 0, 'balanceOf does not return expected value');
    });

    it('verifies calling transfer will change account balances', async () => {
        let toMint = 300;
        token.mint(accounts[0], toMint);
        token.transfer(accounts[1], toMint, { from: accounts[0] });

        assert.equal(await token.balanceOf(accounts[0]), 0, 'balance was not updated correctly');
        assert.equal(await token.balanceOf(accounts[1]), toMint, 'balance was not updated correctly');

    });

    it('should fire event when transfer is called', async () => {
        let toMint = 300;
        token.mint(accounts[0], toMint);
        let result = await token.transfer(accounts[1], toMint, { from: accounts[0] });

        assert.equal(result.logs[0].event, 'Transfer', 'transfer event not fired');
    });

    it('should fail to transfer when account does not have enough tokens', async () => {
        let toMint = 300;
        token.mint(accounts[0], toMint);

        try {
            let transfer = await token.transfer(accounts[1], toMint + 1, { from: accounts[0] });
        } catch(error) {
            return Utils.ensureException(error);
        }

        assert.fail("transfer did not fail");
    });

    it('should fail to transfer when using negative token value', async () => {
        let toMint = 300;
        token.mint(accounts[0], toMint);

        try {
            let transfer = await token.transfer(accounts[1], -1, { from: accounts[0] });
        } catch(error) {
            return Utils.ensureException(error);
        }

        assert.fail("transfer did not fail");
    });


    it('should not allow minting above maxSupply', async () => {
        let toMint = 300;
        await token.mint(accounts[0], toMint);

        try {
            let result = await token.mint(accounts[0], toMint);
        } catch(error) {
            return Utils.ensureException(error);
        }

        assert.fail('mint did not fail');
    });


});
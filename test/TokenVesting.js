const FansUniteToken = artifacts.require('FansUniteToken.sol');
const TokenVesting = artifacts.require('TokenVesting.sol');
const Utils = require('./helpers/Utils.js');
const BigNumber = web3.BigNumber;

let owner;
let beneficiary;

let maxSupply;

let token;
let vesting;
let start;
let amount;


contract('TokenVesting', (accounts) => {

    beforeEach(async()=> {
        amount = new BigNumber(1000);

        owner = accounts[0];
        maxSupply = 700 * 10**24;
        beneficiary = accounts[1];

        token = await FansUniteToken.new('FansUnite Token', 'FAN', maxSupply, { from: owner });

        start = Utils.latestTime() + Utils.duration.minutes(1); // +1 minute so it starts after contract instantiation
        duration = Utils.duration.years(2);

        vesting = await TokenVesting.new(beneficiary, start, duration, { from: owner });

        await token.mint(vesting.address, amount, { from: owner });

    });


    it('should linearly release tokens during vesting period', async function () {
        const vestingPeriod = duration;
        const checkpoints = 4;

        for (let i = 1; i <= checkpoints; i++) {
            const now = start + i * (vestingPeriod / checkpoints);
            await Utils.increaseTimeTo(now);

            await vesting.release(token.address);
            const balance = await token.balanceOf(beneficiary);
            const expectedVesting = amount.mul(now - start).div(duration).floor();

            assert.equal(expectedVesting.toNumber(), balance.toNumber());
        }
    });

    it('should have released all after end', async function () {
        await Utils.increaseTimeTo(start + duration);
        await vesting.release(token.address);
        const balance = await token.balanceOf(beneficiary);
        assert.equal(balance.toNumber(), amount.toNumber());
    });

});
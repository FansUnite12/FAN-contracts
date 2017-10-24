const FansUniteToken = artifacts.require('FansUniteToken.sol');
const TokenVesting = artifacts.require('TokenVesting.sol');
const Utils = require('./helpers/Utils.js');
const BigNumber = web3.BigNumber;

let owner;
let beneficiary;

let token;
let vesting;
let start;
let amount;

let intervals;
let duration;


contract('TokenVesting', (accounts) => {

    beforeEach(async()=> {
        amount = new BigNumber(1000);

        owner = accounts[0];
        beneficiary = accounts[1];

        token = await FansUniteToken.new('FansUnite Token', 'FAN', 1000, { from: owner });

        start = Utils.latestTime() + Utils.duration.minutes(1); // +1 minute so it starts after contract instantiation
        duration = Utils.duration.years(2);
        intervals = 6;

        vesting = await TokenVesting.new(beneficiary, start, duration, intervals, { from: owner });

        await token.mint(vesting.address, amount, { from: owner });

    });

    it('cannot be released before first interval', async function () {
        try {
            await vesting.release(token.address);
        } catch(error) {
            return Utils.ensureException(error);
        }
        assert.fail("released before first interval");

    });


    it('should linearly release tokens during vesting period', async function () {
        let expectedVesting = new BigNumber(0);

        for (let i = 1; i <= intervals; i++) {
            const now = start + i * (duration / intervals);

            await Utils.increaseTimeTo(now);

            await vesting.release(token.address);
            const balance = await token.balanceOf(beneficiary);


            if(i == intervals){
                assert.equal(amount.toNumber(), balance.toNumber());
            } else {
                expectedVesting = expectedVesting.add(amount.div(intervals).floor());
                assert.equal(expectedVesting.toNumber(), balance.toNumber());
            }
        }
    });

    it('should not be able to release tokens before each vesting period', async function () {
        for (let i = 1; i <= (intervals*2); i++) {
            const now = start + i * (duration / (intervals*2));

            await Utils.increaseTimeTo(now);

            if(i % 2){
                try {
                    await vesting.release(token.address);
                    assert.fail("allowed release before intervals");
                } catch(error) {
                    Utils.ensureException(error);
                }
            } else {
                await vesting.release(token.address);
            }
        }
    });


    it('should have released all after end', async function () {
        await Utils.increaseTimeTo(start + duration);
        await vesting.release(token.address);
        const balance = await token.balanceOf(beneficiary);
        assert.equal(balance.toNumber(), amount.toNumber());
    });

});
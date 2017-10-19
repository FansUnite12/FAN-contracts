const FansUniteToken = artifacts.require('FansUniteToken.sol');
const FansUniteCrowdfund = artifacts.require('FansUniteCrowdfund.sol');
const TokenVesting = artifacts.require('TokenVesting.sol');
const Utils = require('./helpers/Utils.js');

let owner;
let beneficiary;

let vestingAddress;
let incentivisationAddress;
let platformSupplyAddress;
let unsoldSupplyAddress;

let buyerAddress;

let crowdfund;

let maxSupply;

let token;
let vesting;
let duration;
let start;

const oneWeekInSeconds = 604800;

contract('TokenVesting', (accounts) => {

    before(async()=> {
        owner = accounts[0];
        beneficiary = accounts[1];

        vestingAddress = accounts[2];
        platformSupplyAddress = accounts[3];
        incentivisationAddress = accounts[4];
        unsoldSupplyAddress = accounts[5];

        buyerAddress = accounts[6];
        maxSupply = 700 * 10**24;
        duration = 72 * oneWeekInSeconds;
        start = 1512550800;

        token = await FansUniteToken.new('FansUnite Token', 'FAN', maxSupply, {from: owner});

        vesting = await TokenVesting.new(beneficiary, 1512550800, duration, { from: owner });

        crowdfund = await FansUniteCrowdfund.new(
            beneficiary,
            token.address,
            vesting.address,
            incentivisationAddress,
            platformSupplyAddress,
            unsoldSupplyAddress,
            {from: owner}
        );
        token.transferOwnership(crowdfund.address);

        await Utils.addSeconds((await crowdfund.endsAt() - web3.eth.getBlock('latest').timestamp));
        await crowdfund.finalize({from: owner});

    });


    it('should linearly release tokens during vesting period', async function () {
        const checkpoints = 6;

        for (let i = 1; i <= checkpoints; i++) {
            const now = start + i * (duration / checkpoints);
            await Utils.increaseTimeTo(now);

            await vesting.release(token.address);
            const balance = await token.balanceOf(beneficiary);
            const expectedVesting = (amount * (now - start) / duration);
            assert.equal(Utils.convertFromDecimals(balance), expectedVesting);
        }
    });
});
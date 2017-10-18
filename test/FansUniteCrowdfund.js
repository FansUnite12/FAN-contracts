const FansUniteToken = artifacts.require('FansUniteToken.sol');
const FansUniteCrowdfund = artifacts.require('FansUniteCrowdfund.sol');
const Utils = require('./helpers/Utils.js');


let owner;
let beneficiary;

let vestingAddress;
let incentivisationAddress;
let platformSupplyAddress;
let unsoldSupplyAddress;

let buyerAddress;
let presaleAddresses;
let whitelistAddress;

let crowdfund;

let maxSupply;

let token;
let id;

contract('FansUniteCrowdsale', (accounts) => {

    beforeEach(async()=> {
        owner = accounts[0];
        beneficiary = accounts[1];

        vestingAddress = accounts[2];
        platformSupplyAddress = accounts[3];
        incentivisationAddress = accounts[4];
        unsoldSupplyAddress = accounts[5];

        buyerAddress = accounts[6];
        presaleAddresses = [
            accounts[7],
            accounts[8],
            accounts[9],
            accounts[10]
        ];
        whitelistAddress = accounts[11];
        maxSupply = 700 * 10**24;

        token = await FansUniteToken.new('FansUnite Token', 'FAN', maxSupply, {from: owner});

        crowdfund = await FansUniteCrowdfund.new(
            beneficiary,
            token.address,
            vestingAddress,
            incentivisationAddress,
            platformSupplyAddress,
            unsoldSupplyAddress,
            {from: owner}
        );
        token.transferOwnership(crowdfund.address);

    });

    describe('Constructor', function(){

        it("Crowdfund should have the correct supply values", async() => {
            assert.equal(await crowdfund.vestingSupply.call(), 70 * 10**24);
            //assert.equal(await crowdfund.incentivisationSupply.call(), 80 * 10**24);
            assert.equal(await crowdfund.platformSupply.call(), 200 * 10**24);
            assert.equal(await crowdfund.icoSupply.call(), 350 * 10**24);
        });

        it("Crowdfund should have the correct addresses", async() => {
            assert.equal(await crowdfund.vestingAddress.call(), vestingAddress);
            assert.equal(await crowdfund.incentivisationAddress.call(), incentivisationAddress);
            assert.equal(await crowdfund.platformSupplyAddress.call(), platformSupplyAddress);
            assert.equal(await crowdfund.unsoldSupplyAddress.call(), unsoldSupplyAddress);
        });

    });

    describe('Whitelist', function(){
        it("addToWhitelist(): should add an address to the whitelist", async() => {
            await crowdfund.addToWhitelist(whitelistAddress, { from: owner });
            assert.equal(await crowdfund.whitelisted(whitelistAddress), true);
        });

        it("function(): should permit contributing before whitelist starts", async () => {
            try {
                await await web3.eth.sendTransaction({from: whitelistAddress, to: crowdfund.address, value: web3.toWei("1", "Ether")});
            } catch(e) {
                return Utils.ensureException(e);
            }
            assert.fail( "It allowed contribution before whitelist started");
        });

        it("function(): it accepts 1 ether and buys correct tokens for whitelisted address", async () => {

            await crowdfund.addToWhitelist(whitelistAddress, { from: owner });

            await Utils.addSeconds(await crowdfund.whitelistStartsAt() - Utils.getTimestampOfCurrentBlock());

            let result = await crowdfund.sendTransaction({
                from: whitelistAddress,
                value: web3.toWei("1", "Ether")
            });

            let balance = await token.balanceOf(whitelistAddress);
            assert.equal(
                Utils.convertFromDecimals(balance),
                3000,
                "The balance of the whitelisted buy was not incremented by 3000 Tokens"
            );

        });

        it("function(): should permit non-whitelisted addresses to contribute", async () => {
            await Utils.addSeconds(await crowdfund.whitelistStartsAt() - Utils.getTimestampOfCurrentBlock());

            try {
                await crowdfund.sendTransaction({
                    from: buyerAddress,
                    value: web3.toWei("1", "Ether")
                });
            } catch(e) {
                return Utils.ensureException(e);
            }
            assert.fail( "It allowed a non-whitelisted address to contribute during whitelist period");
        });
    });

    describe('Presale', function(){

        it("addPrecommitmentBalances(): should allocate presale addresses their tokens", async () => {

            let presaleAmounts = [
                100000000000000000000,
                20000000000000000000000,
                3000000000000000000000,
                400000000000000000000,
            ];

            await crowdfund.addPrecommitmentBalances(presaleAddresses, presaleAmounts, {from: owner});

            for(let i=0; i< presaleAddresses.length; i++) {
                let balance = await token.balanceOf.call(presaleAddresses[i]);
                assert.equal(balance.toNumber(), presaleAmounts[i]);
            }
        });

        it("addPrecommitment(): should permit presale additions once crowdfund starts", async () => {

            await Utils.addSeconds(await crowdfund.startsAt() - Utils.getTimestampOfCurrentBlock());

            try {
                await crowdfund.addPrecommitment(accounts[6], 1000000000000000000, { from: owner });
            } catch(e) {
                return Utils.ensureException(e);
            }

            assert.fail( "It allowed presale additions after crowdfund started");
        });
    });

    describe('Public Sale', function(){

        it("function(): it accepts 1 ether and buys correct tokens at relevant times of ICO", async () => {

            await Utils.addSeconds(await crowdfund.startsAt() - Utils.getTimestampOfCurrentBlock());

            await crowdfund.sendTransaction({
                from: buyerAddress,
                value: web3.toWei("1", "Ether")
            });
            let firstBalance = await token.balanceOf.call(buyerAddress, {from: buyerAddress});
            assert.equal(Utils.convertFromDecimals(firstBalance), 3000, "The balance of the buyer was not incremented by 3000 Tokens");

            // advance time
            const oneWeekInSeconds = 604800;
            await Utils.addSeconds(oneWeekInSeconds);
            await crowdfund.sendTransaction({
                from: buyerAddress,
                value: web3.toWei("1", "Ether")
            });
            let secondBalance = await token.balanceOf.call(buyerAddress, {from: buyerAddress});
            assert.equal(Utils.convertFromDecimals(secondBalance) - Utils.convertFromDecimals(firstBalance), 2500, "The balance of the buyer was not incremented by 2500 tokens");

            // advance time
            await Utils.addSeconds(oneWeekInSeconds);
            await crowdfund.sendTransaction({
                from: buyerAddress,
                value: web3.toWei("1", "Ether")
            });
            let thirdBalance = await token.balanceOf.call(buyerAddress, {from: buyerAddress});
            assert.equal(Utils.convertFromDecimals(thirdBalance) - Utils.convertFromDecimals(secondBalance) , 2000, "The balance of the buyer was not incremented by 2000 tokens");

            // advance time
            await Utils.addSeconds(oneWeekInSeconds);
            await crowdfund.sendTransaction({
                from: buyerAddress,
                value: web3.toWei("1", "Ether")
            });
            let fourthBalance = await token.balanceOf.call(buyerAddress, {from: buyerAddress});
            assert.equal(Utils.convertFromDecimals(fourthBalance) - Utils.convertFromDecimals(thirdBalance), 1500, "The balance of the buyer was not incremented by 1500 tokens");

            let weiRaised = await crowdfund.weiRaised.call({from: buyerAddress});
            assert.equal(Utils.convertFromDecimals(weiRaised), 4, "The contract ether balance was not 4 ETH");

        });
    });

    describe('Finalize', function(){

        it("finalize(): should permit closing of crowdfund before crowdfund ends", async () =>{
            try {
                await crowdfund.finalize({from: owner});
            } catch(e) {
                return Utils.ensureException(e)
            }
            assert.fail("It let a non-owner close the crowdfund");
        });

        it("finalize(): should close crowdfund", async () => {
            let beneficiaryStartBalance = web3.eth.getBalance(beneficiary);
            await Utils.addSeconds(await crowdfund.startsAt() - Utils.getTimestampOfCurrentBlock());

            await crowdfund.sendTransaction({
                from: buyerAddress,
                value: web3.toWei("5", "Ether")
            });

            await Utils.addSeconds((await crowdfund.endsAt() - Utils.getTimestampOfCurrentBlock()) + 86400 );

            await crowdfund.finalize({from: owner});

            let tokensSold = await crowdfund.tokensSold();
            let icoSupply = await crowdfund.icoSupply();
            let unsoldBalance = await token.balanceOf.call(unsoldSupplyAddress);

            assert.equal(
                unsoldBalance,
                icoSupply - tokensSold,
                "The right amount wasn't minted for the unsold balance"
            );
            /*
            assert.equal(
                await token.balanceOf.call(incentivisationAddress),
                80 * 10**24,
                "The right amount wasn't minted for the incentivisation balance");
             */

            assert.equal(
                await token.balanceOf.call(platformSupplyAddress),
                200 * 10**24,
                "The right amount wasn't minted for the incentivisation balance");

            assert.equal(
                await token.balanceOf.call(vestingAddress),
                70 * 10**24,
                "The right amount wasn't minted for the vesting balance");

            let beneficiaryEndBalance = web3.eth.getBalance(beneficiary);

            assert.equal(
                beneficiaryEndBalance - beneficiaryStartBalance,
                web3.toWei("5", "Ether"),
                "beneficiary increased by the correct amount");
        });
    });


});
/* global assert */
const BigNumber = require('bignumber.js');

function isException(error) {
    let strError = error.toString();
    return strError.includes('invalid opcode') || strError.includes('invalid JUMP');
}

function ensureException(error) {
    assert(isException(error), error.toString());
}

async function timeDifference(timestamp1,timestamp2) {
    return timestamp1 - timestamp2;
}

function convertFromDecimals(x) {
    return x.dividedBy(new BigNumber(10).pow(18)).toNumber();
}

function convertToDecimals(x) {
    return new BigNumber(x).times(new BigNumber(10).pow(18));
}

function addSeconds(seconds) {
    return web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [seconds], id: 0});
}

function latestTime(){
    return web3.eth.getBlock('latest').timestamp;
}

function getTimestampOfCurrentBlock() {
    return web3.eth.getBlock(web3.eth.blockNumber).timestamp;
}

function increaseTime(duration) {
    const id = Date.now();

    return new Promise((resolve, reject) => {
        web3.currentProvider.sendAsync({
            jsonrpc: '2.0',
            method: 'evm_increaseTime',
            params: [duration],
            id: id,
        }, err1 => {
            if (err1) return reject(err1);

            web3.currentProvider.sendAsync({
                jsonrpc: '2.0',
                method: 'evm_mine',
                id: id+1,
            }, (err2, res) => {
                return err2 ? reject(err2) : resolve(res)
            })
        })
    })
}

function increaseTimeTo(target) {
    let now = latestTime();
    if (target < now) throw Error(`Cannot increase current time(${now}) to a moment in the past(${target})`);
    let diff = target - now;
    return increaseTime(diff);
}

const duration = {
    seconds: function(val) { return val},
    minutes: function(val) { return val * this.seconds(60) },
    hours:   function(val) { return val * this.minutes(60) },
    days:    function(val) { return val * this.hours(24) },
    weeks:   function(val) { return val * this.days(7) },
    years:   function(val) { return val * this.days(365)}
};

function latestTime() {
    return web3.eth.getBlock('latest').timestamp;
}

module.exports = {
    zeroAddress: '0x0000000000000000000000000000000000000000',
    isException: isException,
    ensureException: ensureException,
    timeDifference: timeDifference,
    convertFromDecimals: convertFromDecimals,
    convertToDecimals: convertToDecimals,
    getTimestampOfCurrentBlock: getTimestampOfCurrentBlock,
    addSeconds: addSeconds,
    increaseTimeTo: increaseTimeTo,
    duration: duration,
    latestTime: latestTime
};

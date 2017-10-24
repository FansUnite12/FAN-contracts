pragma solidity ^0.4.11;

import 'zeppelin-solidity/contracts/token/ERC20Basic.sol';
import 'zeppelin-solidity/contracts/token/SafeERC20.sol';
import "zeppelin-solidity/contracts/math/Math.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

/**
 * From https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/token/TokenVesting.sol
 * Removed cliff and revocable functionality
 */
contract TokenVesting is Ownable {
    using SafeMath for uint;
    using SafeERC20 for ERC20Basic;

    event Released(uint amount);

    address public beneficiary;
    uint public start;
    uint public duration;

    uint public intervals;
    uint public currentInterval = 1;

    mapping (address => uint) public released;

    function TokenVesting(address _beneficiary, uint _start, uint _duration, uint _intervals) {
        require(_beneficiary != 0x0);

        beneficiary = _beneficiary;
        duration = _duration;           // 72 weeks
        start = _start;                 // December 6, 2017, 9:00 AM UTC
        intervals = _intervals;
    }

    function release(ERC20Basic token) public {
        require(currentInterval <= intervals);
        require(now >= duration.div(intervals).mul(currentInterval).add(start));

        uint unreleased = releasableAmount(token);

        require(unreleased > 0);

        currentInterval = currentInterval.add(1);

        released[token] = released[token].add(unreleased);
        token.safeTransfer(beneficiary, unreleased);
        Released(unreleased);
    }


    function releasableAmount(ERC20Basic token) public constant returns (uint) {
        return vestedAmount(token).sub(released[token]);
    }

    function vestedAmount(ERC20Basic token) public constant returns (uint) {

        uint currentBalance = token.balanceOf(this);
        uint totalBalance = currentBalance.add(released[token]);

        if (now >= start + duration) {
            return totalBalance;
        }
        return totalBalance.div(intervals).mul(currentInterval);
    }

}
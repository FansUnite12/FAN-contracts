pragma solidity ^0.4.11;

import 'zeppelin-solidity/contracts/token/ERC20Basic.sol';
import 'zeppelin-solidity/contracts/token/SafeERC20.sol';
import "zeppelin-solidity/contracts/math/Math.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

/**
 * @title TokenVesting
 * @dev A token holder contract that can release its token balance gradually like a
 * typical vesting scheme, with a cliff and vesting period. Optionally revocable by the
 * owner.

 * From https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/token/TokenVesting.sol
 * Removed cliff and revocable functionality
 */
contract TokenVesting is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for ERC20Basic;

    event Released(uint256 amount);

    address public beneficiary;
    uint256 public start;
    uint256 public duration;

    bool public revocable;

    mapping (address => uint256) public released;

    function TokenVesting(address _beneficiary, uint256 _start, uint256 _duration) {
        require(_beneficiary != 0x0);

        beneficiary = _beneficiary;
        duration = _duration;           // 72 weeks
        start = _start;                 // December 6, 2017, 9:00 AM UTC
    }

    function release(ERC20Basic token) public {
        uint256 unreleased = releasableAmount(token);

        require(unreleased > 0);

        released[token] = released[token].add(unreleased);
        token.safeTransfer(beneficiary, unreleased);
        Released(unreleased);
    }


    function releasableAmount(ERC20Basic token) public constant returns (uint256) {
        return vestedAmount(token).sub(released[token]);
    }

    function vestedAmount(ERC20Basic token) public constant returns (uint256) {
        uint256 currentBalance = token.balanceOf(this);
        uint256 totalBalance = currentBalance.add(released[token]);

        if (now >= start + duration) {
            return totalBalance;
        } else {
            return totalBalance.mul(now - start).div(duration);
        }
    }
}
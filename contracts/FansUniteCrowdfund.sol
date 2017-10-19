pragma solidity ^0.4.11;

import "./FansUniteToken.sol";
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract FansUniteCrowdfund is Ownable {

    using SafeMath for uint;

    FansUniteToken public token;

    address public beneficiary;

    uint public weiRaised = 0;
    uint public tokensSold = 0;

    uint public whitelistStartsAt;
    uint public startsAt;
    uint public endsAt;

    uint public vestingSupply;
    uint public incentivisationSupply;
    uint public platformSupply;
    uint public unsoldSupply;
    uint public icoSupply;

    address public vestingAddress;
    address public incentivisationAddress;
    address public platformSupplyAddress;
    address public unsoldSupplyAddress;

    mapping (address => bool) public whitelisted;


    bool public isFinalized = false;
    bool public minCapReached = false;

    event NewContribution(address indexed holder, uint256 tokens, uint256 contributed);
    event MinGoalReached(uint amountRaised);

    modifier onlyDuringSale {
        require(now >= startTime(msg.sender));
        require(now <= endsAt);
        _;
    }

    modifier tokenCapNotReached {
        require(tokensSold < icoSupply);
        _;
    }

    modifier onlyWhenFinalized {
        require(isFinalized);
        _;
    }

    modifier onlyWhenEnded {
        require(now > endsAt || tokensSold == icoSupply);
        _;
    }


    function FansUniteCrowdfund(
    address _beneficiary,
    address _tokenAddress,
    address _vestingAddress,
    address _incentivisationAddress,
    address _platformSupplyAddress,
    address _unsoldSupplyAddress
    ) {
        token = FansUniteToken(_tokenAddress);

        beneficiary = _beneficiary;                             // FansUnite Multisig Wallet Address

        whitelistStartsAt = 1509699600;                         // November 3 2017, 9:00 AM UTC
        startsAt = 1510131600;                                  // November 8 2017, 9:00 AM UTC
        endsAt = 1512550800;                                    // ~4 weeks / 28 days later: December 6, 2017, 9:00 AM UTC

        vestingSupply = 70 * 10**24;                            // 10% - 70 million for withheld for FansUnite Team
        incentivisationSupply = 80 * 10**24;                    // 11% - 80 million incentivisation (bounty, advisors, presale bonus)
        platformSupply = 200 * 10**24;                          // 29% - 200 million for platform supply pool
        icoSupply = 350 * 10**24;                               // 50% - 350 million for public sale

        vestingAddress = _vestingAddress;
        incentivisationAddress = _incentivisationAddress;
        platformSupplyAddress = _platformSupplyAddress;
        unsoldSupplyAddress = _unsoldSupplyAddress;

    }

    function () payable {
        doPurchase(msg.sender);
    }

    function doPurchase(address _owner) internal onlyDuringSale tokenCapNotReached {
        require (msg.value > 0);

        uint weiAmount = msg.value;
        uint tokens = weiAmount.mul(getRate());

        weiRaised = weiRaised.add(weiAmount);
        tokensSold = tokensSold.add(tokens);
        token.mint(msg.sender, tokens);
        beneficiary.transfer(msg.value);
        NewContribution(_owner, tokens, weiAmount);
    }


    function finalize() public onlyWhenEnded onlyOwner {
        require(!isFinalized);
        isFinalized = true;

        token.mint(unsoldSupplyAddress, icoSupply.sub(tokensSold));
        token.mint(incentivisationAddress, incentivisationSupply);
        token.mint(platformSupplyAddress, platformSupply);
        token.mint(vestingAddress, vestingSupply);
    }

    function addToWhitelist(address _address) public onlyOwner {
        whitelisted[_address] = true;
    }

    function startTime(address contributor) constant returns (uint) {
        if (whitelisted[contributor]) {
            return whitelistStartsAt;
        }
        return startsAt;
    }

    function addPrecommitment(address participant, uint balance) onlyOwner tokenCapNotReached {
        require(now < startsAt);
        require(balance > 0);
        tokensSold = tokensSold.add(balance);
        token.mint(participant, balance);
    }

    function addPrecommitmentBalances(address[] _batchOfAddresses, uint[] _balance) external onlyOwner  {
        for (uint i = 0; i < _batchOfAddresses.length; i++) {
            addPrecommitment(_batchOfAddresses[i], _balance[i]);
        }
    }

    function getRate() public constant returns (uint price) {
        if (now > (startsAt + 3 weeks)) {
            return 1500; // week 4
        } else if (now > (startsAt + 2 weeks)) {
            return 2000; // week 3
        } else if (now > (startsAt + 1 weeks)) {
            return 2500; // week 2
        }
        return 3000; // week 1
    }

    function tokenTransferOwnership(address _newOwner) public onlyWhenFinalized {
        token.transferOwnership(_newOwner);
    }

}
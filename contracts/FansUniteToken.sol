pragma solidity ^0.4.11;

import 'zeppelin-solidity/contracts/token/ERC20.sol';
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract FansUniteToken is ERC20, Ownable {

    using SafeMath for uint;

    string public name;
    string public symbol;

    uint8 public constant decimals = 18;
    uint public maxSupply;
    uint public totalSupply;

    mapping (address => uint) balances;
    mapping (address => mapping (address => uint)) allowed;


    event Mint(address indexed to, uint amount);


    modifier canMint {
        require(totalSupply < maxSupply);
        _;
    }


    function FansUniteToken(string _name, string _symbol, uint _maxSupply) {
        name = _name;               // FansUnite
        symbol = _symbol;           // FAN
        maxSupply = _maxSupply;     // 700 million
        totalSupply = 0;
    }

    function transfer(address _to, uint256 _value) returns (bool) {
        require(_value <= balances[msg.sender]);

        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) returns (bool) {
        require(_value <= balances[_from]);
        require(_value <= allowed[_from][msg.sender]);

        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) constant returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }

    function balanceOf(address _owner) constant returns (uint256 balance) {
        return balances[_owner];
    }


    function mint(address _to, uint256 _amount) public onlyOwner canMint {
        require(totalSupply.add(_amount) <= maxSupply);

        totalSupply = totalSupply.add(_amount);
        balances[_to] = balances[_to].add(_amount);
        Mint(_to, _amount);
        Mint(msg.sender, _amount);
        Transfer(0x0, _to, _amount);
    }
}
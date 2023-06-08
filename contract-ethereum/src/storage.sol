// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

contract DepositContract {
    
    address payable public storedAddress;
    mapping(bytes32 => uint256) public deposits;
    
    event Deposit(address indexed depositor, address indexed recipient, uint256 amount);
    event Confirmation(address indexed sender, address indexed recipient, uint256 amount);
    event Reversion(address indexed depositor);
    event TransferOwnership(address indexed admin);
    // Define roles
    address public admin;

    mapping(address => bool) public executors;
    constructor() {
        admin = msg.sender;
    }


    modifier onlyAdmin() {
        require(msg.sender == admin, "Access denied. Only the admin can call this function.");
        _;
    }
    

    modifier onlyExecutor() {
        require(executors[msg.sender] == true, "Access denied. Only executors can call this function.");
        _;
    }
    
    
    function addExecutor(address _executor) external onlyAdmin {
        executors[_executor] = true;
    }

    function removeExecutor(address _executor) external onlyAdmin {
        executors[_executor] = false;
    }


    function transferOwnership(address _admin) external {
        admin = _admin;
        emit TransferOwnership(_admin);
    }
    
    function deposit(address _recipient) external payable {

        //Un seul depot avec la meme adresse de destination, si on refait un dépot vers cette adresse, le montant s'additionne
        require(msg.value > 0, "Amount must be greater than 0.");
        bytes32 depositId = keccak256(abi.encodePacked(msg.sender, _recipient));

        deposits[depositId] += msg.value;
        emit Deposit(msg.sender, _recipient, msg.value);
    }
    
    function confirm(address _depositor, address _recipient) external onlyExecutor {
        bytes32 depositId = keccak256(abi.encodePacked(_depositor, _recipient));
        if (deposits[depositId] >= 0 ) {
            storedAddress = payable(_recipient);
            storedAddress.transfer(deposits[depositId]);
            deposits[depositId] = 0;
            emit Confirmation(_depositor, _recipient, deposits[depositId]);
        }
        else {
            revert("Insufient balance deposited by the specified depositor");
        }
    }
    
    function revertDepot(address _depositor, address _recipient) external {
        bytes32 depositId = keccak256(abi.encodePacked(_depositor, _recipient));
        if (msg.sender == _depositor){
            storedAddress = payable(_depositor);
            storedAddress.transfer(deposits[depositId]);
            deposits[depositId] = 0;
            emit Reversion(_depositor);
        }
        else {
            revert("Insufient balance");
        }        
    }
}
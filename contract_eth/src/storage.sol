// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract DepositContract {
    
    address payable public storedAddress;
    mapping(address => uint256) public deposits;
    
    event Deposit(address indexed depositor, uint256 amount);
    event Confirmation(address indexed sender, address indexed recipient, uint256 amount);
    
    // Define roles
    address public admin;
    mapping(address => bool) public executors;
    
    // Modifier to restrict access to admin only
    modifier onlyAdmin() {
        require(msg.sender == admin, "Access denied. Only the admin can call this function.");
        _;
    }
    
    // Modifier to restrict access to executors only
    modifier onlyExecutor() {
        require(executors[msg.sender] == true, "Access denied. Only executors can call this function.");
        _;
    }
    
    constructor(address _admin) {
        admin = _admin;
    }
    
    function deposit() external payable {
        require(msg.value > 0, "Amount must be greater than 0.");
        
        deposits[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
    
    function confirm(address _recipient, uint256 _amount) external onlyExecutor {
        require(address(this).balance >= _amount, "Insufficient balance in the contract.");
        
        storedAddress = payable(_recipient);
        storedAddress.transfer(_amount);
        
        emit Confirmation(msg.sender, _recipient, _amount);
    }
    
    // Function to add an executor
    function addExecutor(address _executor) external onlyAdmin {
        executors[_executor] = true;
    }
    
    // Function to remove an executor
    function removeExecutor(address _executor) external onlyAdmin {
        executors[_executor] = false;
    }
}
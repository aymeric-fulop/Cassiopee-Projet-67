// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

contract DepositContract {
    
    address payable public storedAddress;
    mapping(address => uint256) public deposits;
    
    event Deposit(address indexed depositor, uint256 amount);
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
    
    
    
    function deposit() external payable {
        require(msg.value > 0, "Amount must be greater than 0.");
        
        deposits[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
    
    function confirm(address _depositor, address _recipient) external onlyExecutor { 
        if (deposits[_depositor] >= 0 ) {
            storedAddress = payable(_recipient);
            storedAddress.transfer(deposits[_depositor]);
            deposits[_depositor] = 0;
            emit Confirmation(msg.sender, _recipient, deposits[_depositor]);
        }
        else {
            revert("Insufient balance deposited by the specified depositor");
        }
    }
    
    function revertDepot(address _depositor) external {
        if (msg.sender == _depositor){
            storedAddress = payable(_depositor);
            storedAddress.transfer(deposits[_depositor]);
            deposits[_depositor] = 0;
            emit Reversion(_depositor);
        }
        else {
            revert("Insufient balance");
        }        
    }

    function addExecutor(address _executor) external onlyAdmin {
        executors[_executor] = true;
    }

    function removeExecutor(address _executor) external onlyAdmin {
        executors[_executor] = false;
    }

    function isExecutor(address _executor) external view returns (bool) {
        return executors[_executor];
    }

    function getAdmin() public view returns (address){
        return admin;
    }

    function transferOwnership(address _admin) external {
        admin = _admin;
        emit TransferOwnership(_admin);
    }
}
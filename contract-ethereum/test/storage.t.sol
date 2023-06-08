// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;
import "../lib/forge-std/src/Test.sol";
import "../src/storage.sol";
import "../lib/forge-std/src/console.sol";

contract StorageTest is Test{
    uint256 testNumber;
    DepositContract internal vault;
    address internal owner;
    address internal dev;
    function setUp() public {
        owner = vm.addr(1);
        
        vm.prank(owner);
        vm.deal(owner, 1 ether);
        vault = new DepositContract();
    }

    // function test_isAdmin() public {
    //     // console.log();
    //     assertEq(vault.getAdmin(), owner);
    // }

    // function testFail_isAdmin() public {
    //     address user1 = vm.addr(2);
    //     assertEq(vault.getAdmin(), user1);
    // }

    // function test_isExecutor() public {
    //     address executor = vm.addr(2);
    //     vm.startPrank(owner);
    //     assertEq(vault.isExecutor(executor), false);
    //     vault.addExecutor(executor);
    //     assertEq(vault.isExecutor(executor), true);
    //     vault.removeExecutor(executor);
    //     assertEq(vault.isExecutor(executor), false);
    //     vm.stopPrank();
    // }


    // function test_routine() public {
    //     address user1 = vm.addr(2);
    //     vm.deal(user1, 1 ether);
    //     address executor = vm.addr(3);
    //     address user2 = vm.addr(4);
    //     vm.startPrank(owner);
    //     assertEq(vault.isExecutor(executor), false);
    //     vault.addExecutor(executor);
    //     vm.stopPrank();
    //     vm.startPrank(user1);
    //     vault.deposit{value: 0.1 ether}();
    //     vm.stopPrank();
    //     vm.startPrank(executor);
    //     vault.confirm(user1, user2);
    //     vm.stopPrank();
    //     console.log(user1.balance);
    //     console.logUint(user2.balance);
    //     assertEq(user1.balance, uint256(9* 10**17));
    //     assertEq(user2.balance, uint256(1* 10**17));
    // }
}
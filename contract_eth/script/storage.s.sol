// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.13;
import "../lib/forge-std/src/Script.sol";
import {DepositContract} from "../src/storage.sol";

contract StorageScript is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();
        new DepositContract('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
        vm.stopBroadcast();
    }
}
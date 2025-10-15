// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract EntryPoint is ReentrancyGuard {
    event UserOperationExecuted(address wallet, address target, uint256 value, bytes data);
    

    function handleUserOperation(address wallet, address target,uint256 value, bytes calldata data) external nonReentrant {
    require(msg.sender == wallet, "Unauthorized"); 
    require(target != address(this), "Invalid target"); 
    require(wallet.code.length > 0, "Wallet must be a contract");
    (bool success, ) = target.call{value: value}(data);
    require(success, "Execution failed");
    emit UserOperationExecuted(wallet, target, value, data);
}
}

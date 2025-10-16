// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract EntryPoint is ReentrancyGuard {
    
    struct UserOperation {
        address sender;
        uint256 nonce;
        bytes initCode;
        bytes callData;
        uint256 callGasLimit;
        uint256 verificationGasLimit;
        uint256 preVerificationGas;
        uint256 maxFeePerGas;
        uint256 maxPriorityFeePerGas;
        bytes paymasterAndData;
        bytes signature;
    }

    mapping(address => uint256) private nonces;

    event UserOperationExecuted(address wallet, address target, uint256 value, bytes data);
    event UserOperationSimulated(address sender, bool success, uint256 gasUsed);

    function handleUserOperation(address wallet, address target, uint256 value, bytes calldata data) external nonReentrant {
        require(msg.sender == wallet, "Unauthorized"); 
        require(target != address(this), "Invalid target"); 
        require(wallet.code.length > 0, "Wallet must be a contract");
        
        (bool success, ) = target.call{value: value}(data);
        require(success, "Execution failed");
        
        emit UserOperationExecuted(wallet, target, value, data);
    }

    
    function getNonce(address sender) external view returns (uint256) {
        return nonces[sender];
    }

    function incrementNonce(address sender) internal {
        nonces[sender]++;
    }

    function simulateValidation(UserOperation calldata userOp) external returns (bool success, uint256 gasUsed) {
        uint256 gasBefore = gasleft();
        
     
        require(userOp.nonce == nonces[userOp.sender], "Invalid nonce");
        require(userOp.sender != address(0), "Invalid sender");
        require(userOp.signature.length > 0, "Invalid signature");
        require(userOp.callGasLimit > 0, "Invalid call gas limit");
        require(userOp.verificationGasLimit > 0, "Invalid verification gas limit");
        
       
        uint256 gasAfter = gasleft();
        gasUsed = gasBefore - gasAfter;
        
        success = true;
        
        emit UserOperationSimulated(userOp.sender, success, gasUsed);
        
        return (success, gasUsed);
    }

    
    function executeUserOperation(UserOperation calldata userOp) external nonReentrant {
       
        require(userOp.nonce == nonces[userOp.sender], "Invalid nonce");
        require(userOp.sender.code.length > 0, "Sender must be a contract");
        
        // Decode callData to extract target, value, and data
        (address target, uint256 value, bytes memory data) = abi.decode(
            userOp.callData,
            (address, uint256, bytes)
        );
        
        require(target != address(this), "Invalid target");
        
        // Execute the operation
        (bool success, ) = target.call{value: value}(data);
        require(success, "Execution failed");
        
        incrementNonce(userOp.sender);
        
        emit UserOperationExecuted(userOp.sender, target, value, data);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IPaymaster {
    function sponsorGas(address user, uint256 gasCost) external payable;
}

contract EntryPoint is ReentrancyGuard {
    address public paymaster;

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
    event PaymasterSet(address paymaster);
    event GasSponsored(address indexed user, uint256 gasCost);

    constructor(address _paymaster) {
        require(_paymaster != address(0), "Invalid paymaster");
        paymaster = _paymaster;
        emit PaymasterSet(_paymaster);
    }

    function setPaymaster(address _paymaster) external {
        require(_paymaster != address(0), "Invalid paymaster");
        paymaster = _paymaster;
        emit PaymasterSet(_paymaster);
    }

    function getNonce(address sender) external view returns (uint256) {
        return nonces[sender];
    }

    function incrementNonce(address sender) internal {
        nonces[sender]++;
    }

    function handleUserOperation(address wallet, address target, uint256 value, bytes calldata data)
        external
        nonReentrant
    {
        require(msg.sender == wallet, "Unauthorized");
        require(target != address(this), "Invalid target");
        require(wallet.code.length > 0, "Wallet must be a contract");

        (bool success, ) = target.call{value: value}(data);
        require(success, "Execution failed");

        emit UserOperationExecuted(wallet, target, value, data);
    }

    function simulateValidation(UserOperation calldata userOp)
        external
        returns (bool success, uint256 gasUsed)
    {
        uint256 gasBefore = gasleft();

        require(userOp.nonce == nonces[userOp.sender], "Invalid nonce");
        require(userOp.sender != address(0), "Invalid sender");
        require(userOp.signature.length > 0, "Invalid signature");

        uint256 gasAfter = gasleft();
        gasUsed = gasBefore - gasAfter;
        success = true;

        emit UserOperationSimulated(userOp.sender, success, gasUsed);
        return (success, gasUsed);
    }

    function executeUserOperation(UserOperation calldata userOp)
        external
        nonReentrant
        payable
    {
        require(userOp.nonce == nonces[userOp.sender], "Invalid nonce");
        require(userOp.sender.code.length > 0, "Sender must be a contract");

        (address target, uint256 value, bytes memory data) = abi.decode(
            userOp.callData,
            (address, uint256, bytes)
        );

        require(target != address(this), "Invalid target");

        uint256 gasBefore = gasleft();

        (bool success, ) = target.call{value: value}(data);
        require(success, "Execution failed");

        uint256 gasUsed = gasBefore - gasleft();
        uint256 gasCost = gasUsed * tx.gasprice;

        // Paymaster covers the gas
        IPaymaster(paymaster).sponsorGas{value: gasCost}(userOp.sender, gasCost);
        emit GasSponsored(userOp.sender, gasCost);

        incrementNonce(userOp.sender);

        emit UserOperationExecuted(userOp.sender, target, value, data);
    }
}

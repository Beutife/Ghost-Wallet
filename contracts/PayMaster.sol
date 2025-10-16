// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Paymaster is ReentrancyGuard {
    
    address public owner;
    address public immutable entryPoint;
    
    event GasSponsored(address indexed user, uint256 gasCost);
    event OwnerDeposited(uint256 amount);
    event OwnerWithdrew(uint256 amount);
    
    constructor(address _entryPoint) payable {
        require(_entryPoint != address(0), "Invalid EntryPoint");
        owner = msg.sender;
        entryPoint = _entryPoint;
    }
    
    receive() external payable {
        emit OwnerDeposited(msg.value);
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyEntryPoint() {
        require(msg.sender == entryPoint, "Not EntryPoint");
        _;
    }
    
    
    function deposit() external payable onlyOwner {
        require(msg.value > 0, "Must deposit something");
        emit OwnerDeposited(msg.value);
    }
    
   
    function sponsorGas(address user, uint256 gasCost) external payable onlyEntryPoint nonReentrant {
        require(address(this).balance >= gasCost, "Insufficient paymaster balance");
        require(msg.value == gasCost, "Must send exact gas cost");
        
        emit GasSponsored(user, gasCost);
    }
    
    
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    
    function ownerWithdraw(uint256 amount) external onlyOwner nonReentrant {
        require(address(this).balance >= amount, "Insufficient balance");
        
        (bool success, ) = owner.call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit OwnerWithdrew(amount);
    }
}
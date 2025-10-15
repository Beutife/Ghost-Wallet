// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract GhostWallet is ReentrancyGuard {
    using Address for address;

    address public owner;
    address public immutable entryPoint;
    bool private _swept;
    bool private _destroyed;
    bool public destroyed = false;


    event Executed(address indexed target, uint256 value, bytes data);
    event Swept(address indexed to, uint256 amount);
    event Destroyed(address indexed to, uint256 amount);

    constructor(address _owner, address _entryPoint) payable {
        require(_owner != address(0), "Owner cannot be zero");
        require(_entryPoint != address(0), "EntryPoint cannot be zero");
        owner = _owner;
        entryPoint = _entryPoint;
    }

    receive() external payable {}

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier notDestroyed() {
    require(!destroyed, "Wallet is destroyed");
    _;
}

    
    function execute(address target,uint256 value, bytes memory data) external nonReentrant onlyOwner notDestroyed {
        require(target != address(0), "Target cannot be zero");
        require(address(this).balance >= value, "Insufficient balance");

        (bool success, bytes memory result) = target.call{value: value}(data);
    if (!success) {
        assembly {
            revert(add(result, 32), mload(result))
        }

    }

        emit Executed(target, value, data);
    }

  
    function sweep(address payable _to) external nonReentrant onlyOwner {
        require(_to != address(0), "Recipient cannot be zero");

        uint256 amount = address(this).balance;
        Address.sendValue(_to, amount);
        _swept = true;

        emit Swept(_to, amount);
    }

   
    function destroy(address payable _to) external onlyOwner notDestroyed {
        require(_to != address(0), "Recipient cannot be zero");
        require(_swept, "Must sweep before destroy");

        uint256 amount = address(this).balance;
        Address.sendValue(_to, amount);

         _destroyed = true;
         owner = address(0);

        emit Destroyed(_to, amount);
       
    }
}
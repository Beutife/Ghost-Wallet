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
    EphemeralKey public ephemeralKey;


    struct EphemeralKey {
        address key;
        uint256 expiresAt;
    }

    
    event WalletCreated(address indexed target, uint256 value, bytes data);
    event Swept(address indexed to, uint256 amount);
    event Destroyed(address indexed to, uint256 amount);
    event WalletBatchExecuted(uint256 count);
    event EphemeralKeyAdded(address key, uint256 expiresAt);
    event EphemeralKeyRevoked(address key);

    

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

    modifier onlyOwnerOrEphemeral() {
        require(msg.sender == owner || (msg.sender == ephemeralKey.key && block.timestamp < ephemeralKey.expiresAt),"Not authorized");
        _;
    }

    
    function CreateWallet(address target,uint256 value, bytes memory data) external nonReentrant onlyOwner notDestroyed {
        require(target != address(0), "Target cannot be zero");
        require(address(this).balance >= value, "Insufficient balance");

        (bool success, bytes memory result) = target.call{value: value}(data);
    if (!success) {
        assembly {
            revert(add(result, 32), mload(result))
        }

    }

        emit WalletCreated(target, value, data);
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

    function executeBatch(address[] calldata targets, uint256[] calldata values,bytes[] calldata datas) external onlyOwner {
        require(targets.length == datas.length && targets.length == values.length,"Invalid array lengths");
        for (uint256 i = 0; i < targets.length; i++) {
        (bool success, bytes memory result) = targets[i].call{value: values[i]}(datas[i]);
        require(success, string(result));
        }

        emit WalletBatchExecuted(targets.length);

    }


    function addEphemeralKey(address _key, uint256 duration) external onlyOwner {
         require(duration <= 90 days, "Max duration exceeded");
        ephemeralKey = EphemeralKey(_key, block.timestamp + duration);

        emit EphemeralKeyAdded(_key, ephemeralKey.expiresAt);   
    }

    function revokeEphemeralKey() external onlyOwner {
        
        emit EphemeralKeyRevoked(ephemeralKey.key);
        delete ephemeralKey;
    }


}
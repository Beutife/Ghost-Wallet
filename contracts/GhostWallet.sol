// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract GhostWallet is ReentrancyGuard {
    using Address for address;
    

    address public owner;
    address public immutable entryPoint;
    bool public destroyed;

    mapping(address => EphemeralKey) private ephemeralKeyData;

    struct EphemeralKey {
        uint256 expiresAt;
        bool isActive;
    }

    
    event WalletExecuted(address indexed target, uint256 value);
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

    modifier onlyAuthorized() {
        bool isValidKey = ephemeralKeyData[msg.sender].isActive && 
                         block.timestamp < ephemeralKeyData[msg.sender].expiresAt;
        
        require(
            msg.sender == owner || 
            msg.sender == entryPoint ||
            isValidKey,
            "Not authorized"
        );
        _;
    }

    
    function execute(address target,uint256 value, bytes memory data) external nonReentrant onlyAuthorized notDestroyed {
        require(target != address(0), "Target cannot be zero");
        require(address(this).balance >= value, "Insufficient balance");

        (bool success, bytes memory result) = target.call{value: value}(data);
    if (!success) {
        assembly {
            revert(add(result, 32), mload(result))
        }

    }

        emit WalletExecuted(target, value);
    }

  
    function sweep(address payable _to) external nonReentrant onlyOwner notDestroyed {
        require(_to != address(0), "Recipient cannot be zero");

        uint256 amount = address(this).balance;
        require(amount > 0, "No funds to sweep");

        Address.sendValue(_to, amount);

        emit Swept(_to, amount);
    }

   
    function destroy(address payable _to) external nonReentrant onlyOwner notDestroyed {
        require(_to != address(0), "Recipient cannot be zero");
        

        uint256 amount = address(this).balance;
         if (amount > 0) {
            Address.sendValue(_to, amount);
        }
        
        destroyed = true;
        emit Destroyed(_to, amount);
       
    }

    function executeBatch(address[] calldata targets, uint256[] calldata values,bytes[] calldata datas) external nonReentrant onlyAuthorized notDestroyed {
            require(targets.length == values.length && targets.length == datas.length,"Array length mismatch");        
        for (uint256 i = 0; i < targets.length; i++) {
             require(targets[i] != address(0), "Invalid target");
            (bool success, bytes memory result) = targets[i].call{value: values[i]}(datas[i]);

            if (!success) {
                assembly {
                    revert(add(result, 32), mload(result))
                }
            }
        }

        emit WalletBatchExecuted(targets.length);

    }


    function addEphemeralKey(address _key) external onlyOwner notDestroyed {
        require(_key != address(0), "Invalid key");
        require(!ephemeralKeyData[_key].isActive, "Key already active");

        uint256 expiresAt = block.timestamp + 1 hours;

        ephemeralKeyData[_key] = EphemeralKey({
            expiresAt: expiresAt,
            isActive: true
        });

        emit EphemeralKeyAdded(_key, expiresAt);
    }

     function revokeEphemeralKey(address _key) external onlyOwner notDestroyed {
        require(ephemeralKeyData[_key].isActive, "Key not active");
        
        ephemeralKeyData[_key].isActive = false;
        emit EphemeralKeyRevoked(_key);
    }

     function isEphemeralKeyValid(address _key) external view returns (bool) {
        return ephemeralKeyData[_key].isActive && block.timestamp < ephemeralKeyData[_key].expiresAt;
    }


}
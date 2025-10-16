// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract GhostWallet is ReentrancyGuard {
    using Address for address;
    

    address public owner;
    address public immutable entryPoint;
    bool public destroyed;
    EphemeralKey public ephemeralKey;


    struct EphemeralKey {
        address key;
        uint256 expiresAt;
    }

    
    event Executed(address indexed target, uint256 value);
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
        require(
            msg.sender == owner || 
            msg.sender == entryPoint ||
            (msg.sender == ephemeralKey.key && block.timestamp < ephemeralKey.expiresAt),
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

        emit Executed(target, value);
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


    function addEphemeralKey(address _key, uint256 duration) external onlyOwner notDestroyed {
        require(_key != address(0), "Invalid key");
        require(duration > 0 && duration <= 90 days, "Invalid duration");        

        ephemeralKey = EphemeralKey(_key, block.timestamp + duration);

        emit EphemeralKeyAdded(_key, ephemeralKey.expiresAt);   
    }

    function revokeEphemeralKey() external onlyOwner notDestroyed {
        address key = ephemeralKey.key;
        delete ephemeralKey;
        emit EphemeralKeyRevoked(key);
    }

     function isEphemeralKeyValid() external view returns (bool) {
        return ephemeralKey.key != address(0) && block.timestamp < ephemeralKey.expiresAt;
    }


}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GhostWallet.sol";
import "./EntryPoint.sol";


contract GhostFactory {

     address public immutable entryPoint;
     mapping(address => address[]) private userWallets;

    event GhostCreated(address wallet, address owner);

     constructor(address _entryPoint) {
        require(_entryPoint != address(0), "Invalid EntryPoint");
        entryPoint = _entryPoint;
    }

    function createGhost(address owner) external payable returns (address) {
        GhostWallet wallet = new GhostWallet{value: msg.value}(owner, entryPoint);
        userWallets[owner].push(address(wallet));

        emit GhostCreated(address(wallet), owner);
        return address(wallet);
    }

    function getUserWallets(address owner) external view returns (address[] memory) {
        return userWallets[owner];
    }
}

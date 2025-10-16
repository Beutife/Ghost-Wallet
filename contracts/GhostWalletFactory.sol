// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GhostWallet.sol";
import "./EntryPoint.sol";


contract GhostFactory {

     mapping(address => address[]) private userWallets;

    event GhostCreated(address wallet, address owner);

    function createGhost(address owner, address entryPoint) external returns (address) {
        GhostWallet wallet = new GhostWallet(owner, entryPoint);

        userWallets[owner].push(address(wallet));

        emit GhostCreated(address(wallet), owner);
        return address(wallet);
    }

    function getUserWallets(address owner) external view returns (address[] memory) {
        return userWallets[owner];
    }
}

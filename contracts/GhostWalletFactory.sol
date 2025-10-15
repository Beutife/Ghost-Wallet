// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GhostWallet.sol";
import "./EntryPoint.sol";


contract GhostFactory {
    event GhostCreated(address wallet, address owner);

    function createGhost(address owner, address entryPoint) external returns (address) {
        GhostWallet wallet = new GhostWallet(owner, entryPoint);
        emit GhostCreated(address(wallet), owner);
        return address(wallet);
    }
}

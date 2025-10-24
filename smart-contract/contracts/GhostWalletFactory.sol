// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GhostWallet.sol";
import "./EntryPoint.sol";
import "./MockUSDC.sol";


contract GhostFactory {

     address public immutable entryPoint;
     mapping(address => address[]) private userWallets;
     MockUSDC public mockUSDC;

     event GhostCreated(address indexed wallet, address indexed owner, uint256 amountMinted);

      constructor(address _entryPoint, address _mockUSDC) {
        entryPoint = _entryPoint;
        mockUSDC = MockUSDC(_mockUSDC);
        }
  



    function createGhost(address owner, uint256 mintAmount) external payable returns (address) {
        require(owner != address(0), "Invalid owner address");
        require(mintAmount > 0, "Mint amount must be > 0");

        // Deploy Ghost Wallet
        GhostWallet wallet = new GhostWallet{value: msg.value}(owner, entryPoint);
        userWallets[owner].push(address(wallet));

        // Mint mock USDC directly into the new Ghost Wallet
        mockUSDC.mint(address(wallet), mintAmount);

        emit GhostCreated(address(wallet), owner, mintAmount);
        return address(wallet);
    }

    function getUserWallets(address owner) external view returns (address[] memory) {
        return userWallets[owner];
    }
}

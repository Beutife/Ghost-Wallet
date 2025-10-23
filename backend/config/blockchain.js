// ==========================================
// src/config/blockchain.js
// ==========================================
const { ethers } = require('ethers');
const config = require('./index');
const logger = require('../utils/logger');

// Contract ABIs
const GhostWalletFactoryABI = require('../contracts/abis/GhostWalletFactory.json');
const GhostWalletABI = require('../contracts/abis/GhostWallet.json');
const PaymasterABI = require('../contracts/abis/Paymaster.json');
const EntryPointABI = require('../contracts/abis/EntryPoint.json');

class BlockchainProvider {
  constructor() {
    this.provider = null;
    this.wsProvider = null;
    this.signer = null;
    this.contracts = {};
    this.isConnected = false;
  }

  async initialize() {
    try {
      // Initialize HTTP provider
      this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
      
      // Test connection
      const network = await this.provider.getNetwork();
      logger.info(`Connected to blockchain network: ${network.name} (chainId: ${network.chainId})`);

      // Initialize WebSocket provider if configured
      if (config.blockchain.wsRpcUrl) {
        try {
          this.wsProvider = new ethers.WebSocketProvider(config.blockchain.wsRpcUrl);
          logger.info('WebSocket provider initialized');
        } catch (error) {
          logger.warn('WebSocket provider failed to initialize:', error.message);
        }
      }

      // Initialize signer for paymaster operations
      if (config.paymaster.privateKey) {
        this.signer = new ethers.Wallet(config.paymaster.privateKey, this.provider);
        logger.info(`Paymaster signer initialized: ${this.signer.address}`);
      }

      // Initialize contract instances
      await this.initializeContracts();

      this.isConnected = true;
      logger.info('Blockchain provider initialized successfully');

      return true;
    } catch (error) {
      logger.error('Failed to initialize blockchain provider:', error);
      throw error;
    }
  }

  async initializeContracts() {
    try {
      // Factory Contract
      this.contracts.factory = new ethers.Contract(
        config.contracts.factory,
        GhostWalletFactoryABI,
        this.provider
      );

      // EntryPoint Contract
      this.contracts.entryPoint = new ethers.Contract(
        config.contracts.entryPoint,
        EntryPointABI,
        this.provider
      );

      // Paymaster Contract
      this.contracts.paymaster = new ethers.Contract(
        config.contracts.paymaster,
        PaymasterABI,
        this.signer || this.provider
      );

      logger.info('Smart contracts initialized');
    } catch (error) {
      logger.error('Failed to initialize contracts:', error);
      throw error;
    }
  }

  getGhostWalletContract(address) {
    return new ethers.Contract(
      address,
      GhostWalletABI,
      this.provider
    );
  }

  getGhostWalletContractWithSigner(address) {
    if (!this.signer) {
      throw new Error('Signer not initialized');
    }
    return new ethers.Contract(
      address,
      GhostWalletABI,
      this.signer
    );
  }

  getProvider() {
    if (!this.isConnected) {
      throw new Error('Blockchain provider not connected');
    }
    return this.provider;
  }

  getWsProvider() {
    return this.wsProvider;
  }

  getSigner() {
    if (!this.signer) {
      throw new Error('Signer not initialized');
    }
    return this.signer;
  }

  getContract(contractName) {
    if (!this.contracts[contractName]) {
      throw new Error(`Contract ${contractName} not initialized`);
    }
    return this.contracts[contractName];
  }

  async getGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      return {
        gasPrice: feeData.gasPrice,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      };
    } catch (error) {
      logger.error('Failed to get gas price:', error);
      throw error;
    }
  }

  async getBlockNumber() {
    return await this.provider.getBlockNumber();
  }

  async getBalance(address) {
    return await this.provider.getBalance(address);
  }

  async waitForTransaction(txHash, confirmations = config.blockchain.confirmations) {
    try {
      const receipt = await this.provider.waitForTransaction(txHash, confirmations);
      return receipt;
    } catch (error) {
      logger.error(`Failed to wait for transaction ${txHash}:`, error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', healthy: false };
      }

      const blockNumber = await this.provider.getBlockNumber();
      const network = await this.provider.getNetwork();

      return {
        status: 'connected',
        healthy: true,
        network: network.name,
        chainId: Number(network.chainId),
        blockNumber: blockNumber,
      };
    } catch (error) {
      return {
        status: 'error',
        healthy: false,
        error: error.message,
      };
    }
  }
}

module.exports = new BlockchainProvider();
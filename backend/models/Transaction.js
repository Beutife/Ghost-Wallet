const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Transaction identification
  txHash: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^0x[a-fA-F0-9]{64}$/.test(v);
      },
      message: props => `${props.value} is not a valid transaction hash!`
    }
  },

  // Wallet association
  walletAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },

  ownerAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },

  // Transaction type
  type: {
    type: String,
    required: true,
    enum: [
      'execute',           // Single execute
      'executeBatch',      // Batch execute
      'sweep',             // Sweep funds
      'destroy',           // Destroy wallet
      'addEphemeralKey',   // Add session key
      'revokeEphemeralKey' // Revoke session key
    ],
    index: true
  },

  // Transaction details
  target: {
    type: String,
    lowercase: true,
    default: null
  },

  value: {
    type: String, // Store as string for big numbers
    default: '0'
  },

  callData: {
    type: String,
    default: null
  },

  // Batch execution details
  batchTargets: [{
    type: String,
    lowercase: true
  }],

  batchValues: [{
    type: String
  }],

  batchCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Execution status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'reverted'],
    default: 'pending',
    index: true
  },

  blockNumber: {
    type: Number,
    default: null,
    index: true
  },

  blockTimestamp: {
    type: Date,
    default: null
  },

  // Gas information
  gasUsed: {
    type: String,
    default: null
  },

  gasPrice: {
    type: String,
    default: null
  },

  gasCost: {
    type: String, // Total gas cost in wei
    default: null
  },

  // Paymaster sponsorship
  sponsoredByPaymaster: {
    type: Boolean,
    default: false
  },

  paymasterAddress: {
    type: String,
    lowercase: true,
    default: null
  },

  // Session context
  sessionToken: {
    type: String,
    default: null,
    index: true
  },

  ephemeralKeyUsed: {
    type: String,
    lowercase: true,
    default: null
  },

  // Error details
  errorMessage: {
    type: String,
    default: null
  },

  errorReason: {
    type: String,
    default: null
  },

  // Network
  network: {
    type: String,
    required: true,
    enum: ['mainnet', 'sepolia', 'goerli', 'polygon', 'arbitrum', 'optimism', 'base'],
    default: 'sepolia'
  },

  // Metadata
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  confirmedAt: {
    type: Date,
    default: null
  },

  nonce: {
    type: Number,
    default: null
  }
}, {
  timestamps: true,
  collection: 'transactions'
});

// Indexes
transactionSchema.index({ walletAddress: 1, status: 1 });
transactionSchema.index({ walletAddress: 1, submittedAt: -1 });
transactionSchema.index({ ownerAddress: 1, submittedAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ blockNumber: -1 });
transactionSchema.index({ sessionToken: 1 });

// Methods
transactionSchema.methods.markConfirmed = function(blockNumber, blockTimestamp, gasUsed) {
  this.status = 'confirmed';
  this.blockNumber = blockNumber;
  this.blockTimestamp = blockTimestamp;
  this.confirmedAt = new Date();
  if (gasUsed) {
    this.gasUsed = gasUsed.toString();
  }
  return this.save();
};

transactionSchema.methods.markFailed = function(errorMessage, errorReason) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  this.errorReason = errorReason;
  return this.save();
};

transactionSchema.methods.calculateGasCost = function() {
  if (this.gasUsed && this.gasPrice) {
    const gasUsedBN = BigInt(this.gasUsed);
    const gasPriceBN = BigInt(this.gasPrice);
    this.gasCost = (gasUsedBN * gasPriceBN).toString();
  }
  return this.save();
};

// Statics
transactionSchema.statics.findByWallet = function(walletAddress, limit = 50) {
  return this.find({ walletAddress: walletAddress.toLowerCase() })
    .sort({ submittedAt: -1 })
    .limit(limit);
};

transactionSchema.statics.findPendingTransactions = function() {
  return this.find({ status: 'pending' }).sort({ submittedAt: 1 });
};

transactionSchema.statics.getWalletStats = async function(walletAddress) {
  const stats = await this.aggregate([
    { $match: { walletAddress: walletAddress.toLowerCase() } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: { $toLong: '$value' } }
      }
    }
  ]);
  return stats;
};

module.exports = mongoose.model('Transaction', transactionSchema);
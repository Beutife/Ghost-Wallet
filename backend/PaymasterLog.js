// ==========================================
// src/models/PaymasterLog.js
// ==========================================
const mongoose = require('mongoose');

const paymasterLogSchema = new mongoose.Schema({
  // Transaction identification
  txHash: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^0x[a-fA-F0-9]{64}$/.test(v);
      },
      message: props => `${props.value} is not a valid transaction hash!`
    }
  },

  // Sponsorship details
  userWalletAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },

  paymasterAddress: {
    type: String,
    required: true,
    lowercase: true
  },

  // Gas details
  gasCost: {
    type: String, // Store as string for big numbers
    required: true
  },

  gasUsed: {
    type: String,
    required: true
  },

  gasPrice: {
    type: String,
    required: true
  },

  // Transaction details
  operationType: {
    type: String,
    required: true,
    enum: [
      'wallet_creation',
      'transaction_execution',
      'batch_execution',
      'session_key_addition',
      'session_key_revocation'
    ]
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending',
    index: true
  },

  // Blockchain data
  blockNumber: {
    type: Number,
    default: null,
    index: true
  },

  blockTimestamp: {
    type: Date,
    default: null
  },

  network: {
    type: String,
    required: true,
    enum: ['mainnet', 'sepolia', 'goerli', 'polygon', 'arbitrum', 'optimism', 'base'],
    default: 'sepolia'
  },

  // Paymaster balance tracking
  paymasterBalanceBefore: {
    type: String,
    default: null
  },

  paymasterBalanceAfter: {
    type: String,
    default: null
  },

  // Session context
  sessionToken: {
    type: String,
    default: null,
    index: true
  },

  // Refund tracking
  refunded: {
    type: Boolean,
    default: false
  },

  refundAmount: {
    type: String,
    default: null
  },

  refundTxHash: {
    type: String,
    lowercase: true,
    default: null
  },

  // Error handling
  errorMessage: {
    type: String,
    default: null
  },

  // Metadata
  sponsoredAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  confirmedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'paymaster_logs'
});

// Indexes
paymasterLogSchema.index({ userWalletAddress: 1, sponsoredAt: -1 });
paymasterLogSchema.index({ paymasterAddress: 1, status: 1 });
paymasterLogSchema.index({ blockNumber: -1 });
paymasterLogSchema.index({ status: 1, sponsoredAt: -1 });
paymasterLogSchema.index({ operationType: 1, sponsoredAt: -1 });

// Methods
paymasterLogSchema.methods.markConfirmed = function(blockNumber, blockTimestamp) {
  this.status = 'confirmed';
  this.blockNumber = blockNumber;
  this.blockTimestamp = blockTimestamp;
  this.confirmedAt = new Date();
  return this.save();
};

paymasterLogSchema.methods.markFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  return this.save();
};

paymasterLogSchema.methods.recordRefund = function(amount, refundTxHash) {
  this.refunded = true;
  this.refundAmount = amount.toString();
  this.refundTxHash = refundTxHash;
  return this.save();
};

// Statics
paymasterLogSchema.statics.getTotalSponsored = async function(paymasterAddress) {
  const result = await this.aggregate([
    { 
      $match: { 
        paymasterAddress: paymasterAddress.toLowerCase(),
        status: 'confirmed'
      } 
    },
    {
      $group: {
        _id: null,
        totalGasCost: { $sum: { $toLong: '$gasCost' } },
        totalTransactions: { $sum: 1 }
      }
    }
  ]);
  return result[0] || { totalGasCost: 0, totalTransactions: 0 };
};

paymasterLogSchema.statics.getWalletSponsorshipStats = async function(userWalletAddress) {
  const result = await this.aggregate([
    { $match: { userWalletAddress: userWalletAddress.toLowerCase() } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalGas: { $sum: { $toLong: '$gasCost' } }
      }
    }
  ]);
  return result;
};

paymasterLogSchema.statics.getPendingLogs = function() {
  return this.find({ status: 'pending' }).sort({ sponsoredAt: 1 });
};

paymasterLogSchema.statics.getRecentActivity = function(limit = 100) {
  return this.find({ status: 'confirmed' })
    .sort({ confirmedAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('PaymasterLog', paymasterLogSchema);
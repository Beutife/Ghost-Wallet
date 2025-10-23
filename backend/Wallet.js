const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  // Blockchain identifiers
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: props => `${props.value} is not a valid Ethereum address!`
    }
  },
  
  ownerAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: props => `${props.value} is not a valid Ethereum address!`
    }
  },

  // Deployment information
  deploymentTxHash: {
    type: String,
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /^0x[a-fA-F0-9]{64}$/.test(v);
      },
      message: props => `${props.value} is not a valid transaction hash!`
    }
  },

  deploymentBlockNumber: {
    type: Number,
    min: 0
  },

  network: {
    type: String,
    required: true,
    enum: ['mainnet', 'sepolia', 'goerli', 'polygon', 'arbitrum', 'optimism', 'base'],
    default: 'sepolia'
  },

  // Wallet status
  isDestroyed: {
    type: Boolean,
    default: false,
    index: true
  },

  destroyedAt: {
    type: Date,
    default: null
  },

  destroyedTxHash: {
    type: String,
    lowercase: true,
    default: null
  },

  // Balance tracking (cached for performance)
  lastKnownBalance: {
    type: String, // Store as string to handle big numbers
    default: '0'
  },

  lastBalanceUpdate: {
    type: Date,
    default: Date.now
  },

  // Active ephemeral keys
  activeEphemeralKeys: [{
    keyAddress: {
      type: String,
      lowercase: true,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    revoked: {
      type: Boolean,
      default: false
    },
    revokedAt: {
      type: Date,
      default: null
    }
  }],

  // Metadata
  label: {
    type: String,
    maxlength: 50,
    trim: true,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  lastActivityAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Statistics
  totalTransactions: {
    type: Number,
    default: 0,
    min: 0
  },

  totalValueTransferred: {
    type: String, // Store as string for big numbers
    default: '0'
  }
}, {
  timestamps: true,
  collection: 'wallets'
});

// Indexes for query optimization
walletSchema.index({ ownerAddress: 1, isDestroyed: 1 });
walletSchema.index({ createdAt: -1 });
walletSchema.index({ lastActivityAt: -1 });
walletSchema.index({ 'activeEphemeralKeys.expiresAt': 1 });

// Virtual for checking if wallet has active sessions
walletSchema.virtual('hasActiveSessions').get(function() {
  const now = new Date();
  return this.activeEphemeralKeys.some(key => 
    !key.revoked && key.expiresAt > now
  );
});

// Methods
walletSchema.methods.updateBalance = function(balance) {
  this.lastKnownBalance = balance.toString();
  this.lastBalanceUpdate = new Date();
  return this.save();
};

walletSchema.methods.addEphemeralKey = function(keyAddress, expiresAt) {
  this.activeEphemeralKeys.push({
    keyAddress: keyAddress.toLowerCase(),
    expiresAt: expiresAt,
    addedAt: new Date()
  });
  this.lastActivityAt = new Date();
  return this.save();
};

walletSchema.methods.revokeEphemeralKey = function(keyAddress) {
  const key = this.activeEphemeralKeys.find(
    k => k.keyAddress === keyAddress.toLowerCase() && !k.revoked
  );
  if (key) {
    key.revoked = true;
    key.revokedAt = new Date();
    this.lastActivityAt = new Date();
  }
  return this.save();
};

walletSchema.methods.markAsDestroyed = function(txHash) {
  this.isDestroyed = true;
  this.destroyedAt = new Date();
  this.destroyedTxHash = txHash;
  return this.save();
};

// Statics
walletSchema.statics.findByOwner = function(ownerAddress, includeDestroyed = false) {
  const query = { ownerAddress: ownerAddress.toLowerCase() };
  if (!includeDestroyed) {
    query.isDestroyed = false;
  }
  return this.find(query).sort({ createdAt: -1 });
};

walletSchema.statics.findActiveWallets = function() {
  return this.find({ isDestroyed: false }).sort({ lastActivityAt: -1 });
};

module.exports = mongoose.model('Wallet', walletSchema);
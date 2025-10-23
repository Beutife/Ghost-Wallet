const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  // Session identification
  sessionToken: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Wallet association
  walletAddress: {
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

  ownerAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },

  // Ephemeral key info
  ephemeralKeyAddress: {
    type: String,
    required: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: props => `${props.value} is not a valid Ethereum address!`
    }
  },

  // Session timing
  startedAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  expiresAt: {
    type: Date,
    required: true,
    index: true
  },

  endedAt: {
    type: Date,
    default: null
  },

  // Session status
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked', 'ended'],
    default: 'active',
    index: true
  },

  // Session duration (in seconds)
  duration: {
    type: Number,
    required: true,
    min: 60, // Minimum 1 minute
    max: 86400 // Maximum 24 hours
  },

  // Activity tracking
  lastActivityAt: {
    type: Date,
    default: Date.now
  },

  transactionCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Metadata
  userAgent: {
    type: String,
    default: null
  },

  ipAddress: {
    type: String,
    default: null
  },

  // On-chain confirmation
  onChainAdded: {
    type: Boolean,
    default: false
  },

  addKeyTxHash: {
    type: String,
    lowercase: true,
    default: null
  },

  onChainRevoked: {
    type: Boolean,
    default: false
  },

  revokeKeyTxHash: {
    type: String,
    lowercase: true,
    default: null
  }
}, {
  timestamps: true,
  collection: 'sessions'
});

// Indexes
sessionSchema.index({ walletAddress: 1, status: 1 });
sessionSchema.index({ expiresAt: 1, status: 1 });
sessionSchema.index({ startedAt: -1 });
sessionSchema.index({ ownerAddress: 1, status: 1 });

// Virtual for checking if session is currently valid
sessionSchema.virtual('isValid').get(function() {
  return this.status === 'active' && this.expiresAt > new Date();
});

// Methods
sessionSchema.methods.updateActivity = function() {
  this.lastActivityAt = new Date();
  this.transactionCount += 1;
  return this.save();
};

sessionSchema.methods.endSession = function(reason = 'ended') {
  this.status = reason;
  this.endedAt = new Date();
  return this.save();
};

sessionSchema.methods.markOnChainAdded = function(txHash) {
  this.onChainAdded = true;
  this.addKeyTxHash = txHash;
  return this.save();
};

sessionSchema.methods.markOnChainRevoked = function(txHash) {
  this.onChainRevoked = true;
  this.revokeKeyTxHash = txHash;
  this.status = 'revoked';
  this.endedAt = new Date();
  return this.save();
};

// Statics
sessionSchema.statics.findActiveByWallet = function(walletAddress) {
  return this.find({
    walletAddress: walletAddress.toLowerCase(),
    status: 'active',
    expiresAt: { $gt: new Date() }
  });
};

sessionSchema.statics.findExpiredSessions = function() {
  return this.find({
    status: 'active',
    expiresAt: { $lte: new Date() }
  });
};

sessionSchema.statics.cleanupOldSessions = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  return this.deleteMany({
    status: { $in: ['expired', 'revoked', 'ended'] },
    endedAt: { $lte: cutoffDate }
  });
};

module.exports = mongoose.model('Session', sessionSchema);

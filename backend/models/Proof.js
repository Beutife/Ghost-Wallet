
// ==========================================
// src/models/Proof.js
// ==========================================
const mongoose = require('mongoose');

const proofSchema = new mongoose.Schema({
  // Proof identification
  proofHash: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^0x[a-fA-F0-9]{64}$/.test(v);
      },
      message: props => `${props.value} is not a valid proof hash!`
    }
  },

  // Associated wallet (kept minimal for privacy)
  walletAddress: {
    type: String,
    lowercase: true,
    index: true,
    default: null // Can be null for privacy
  },

  // Proof type and context
  proofType: {
    type: String,
    required: true,
    enum: [
      'wallet_creation',
      'transaction_authorization',
      'session_key_addition',
      'ownership_verification'
    ],
    index: true
  },

  // Verification status
  verified: {
    type: Boolean,
    default: false,
    index: true
  },

  verifiedAt: {
    type: Date,
    default: null
  },

  verificationAttempts: {
    type: Number,
    default: 0,
    min: 0
  },

  // Proof validity
  isValid: {
    type: Boolean,
    default: false
  },

  expiresAt: {
    type: Date,
    default: null,
    index: true
  },

  // Proof data (minimal storage)
  publicSignals: [{
    type: String
  }],

  // Usage tracking
  used: {
    type: Boolean,
    default: false,
    index: true
  },

  usedAt: {
    type: Date,
    default: null
  },

  usedForTxHash: {
    type: String,
    lowercase: true,
    default: null
  },

  // Session association
  sessionToken: {
    type: String,
    default: null,
    index: true
  },

  // Error tracking
  verificationError: {
    type: String,
    default: null
  },

  // Replay protection
  nonce: {
    type: String,
    required: true
  },

  // Network
  network: {
    type: String,
    required: true,
    enum: ['mainnet', 'sepolia', 'goerli', 'polygon', 'arbitrum', 'optimism', 'base'],
    default: 'sepolia'
  },

  // Privacy metadata (no identifying info)
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Auto-cleanup flag
  shouldCleanup: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true,
  collection: 'proofs'
});

// Indexes for query optimization and cleanup
proofSchema.index({ verified: 1, used: 1 });
proofSchema.index({ expiresAt: 1, shouldCleanup: 1 });
proofSchema.index({ submittedAt: -1 });
proofSchema.index({ proofType: 1, verified: 1 });

// Methods
proofSchema.methods.markVerified = function(isValid) {
  this.verified = true;
  this.isValid = isValid;
  this.verifiedAt = new Date();
  this.verificationAttempts += 1;
  return this.save();
};

proofSchema.methods.markUsed = function(txHash) {
  this.used = true;
  this.usedAt = new Date();
  this.usedForTxHash = txHash;
  return this.save();
};

proofSchema.methods.markForCleanup = function() {
  this.shouldCleanup = true;
  return this.save();
};

proofSchema.methods.incrementVerificationAttempt = function(error = null) {
  this.verificationAttempts += 1;
  if (error) {
    this.verificationError = error;
  }
  return this.save();
};

// Statics
proofSchema.statics.findUnusedProofs = function(olderThanHours = 24) {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);
  return this.find({
    used: false,
    submittedAt: { $lte: cutoffDate }
  });
};

proofSchema.statics.findExpiredProofs = function() {
  return this.find({
    expiresAt: { $lte: new Date() },
    used: false
  });
};

proofSchema.statics.cleanupOldProofs = function(daysOld = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  return this.deleteMany({
    $or: [
      { shouldCleanup: true },
      { submittedAt: { $lte: cutoffDate }, used: true }
    ]
  });
};

proofSchema.statics.checkReplayAttack = async function(proofHash) {
  const existing = await this.findOne({ proofHash });
  return existing && existing.used;
};

module.exports = mongoose.model('Proof', proofSchema);
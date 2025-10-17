// ==========================================
// src/config/constants.js
// ==========================================
module.exports = {
  // Transaction Types
  TRANSACTION_TYPES: {
    EXECUTE: 'execute',
    EXECUTE_BATCH: 'executeBatch',
    SWEEP: 'sweep',
    DESTROY: 'destroy',
    ADD_EPHEMERAL_KEY: 'addEphemeralKey',
    REVOKE_EPHEMERAL_KEY: 'revokeEphemeralKey',
  },

  // Transaction Status
  TRANSACTION_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    FAILED: 'failed',
    REVERTED: 'reverted',
  },

  // Session Status
  SESSION_STATUS: {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    REVOKED: 'revoked',
    ENDED: 'ended',
  },

  // Proof Types
  PROOF_TYPES: {
    WALLET_CREATION: 'wallet_creation',
    TRANSACTION_AUTHORIZATION: 'transaction_authorization',
    SESSION_KEY_ADDITION: 'session_key_addition',
    OWNERSHIP_VERIFICATION: 'ownership_verification',
  },

  // Paymaster Operation Types
  PAYMASTER_OPERATIONS: {
    WALLET_CREATION: 'wallet_creation',
    TRANSACTION_EXECUTION: 'transaction_execution',
    BATCH_EXECUTION: 'batch_execution',
    SESSION_KEY_ADDITION: 'session_key_addition',
    SESSION_KEY_REVOCATION: 'session_key_revocation',
  },

  // Networks
  NETWORKS: {
    MAINNET: 'mainnet',
    SEPOLIA: 'sepolia',
    GOERLI: 'goerli',
    POLYGON: 'polygon',
    ARBITRUM: 'arbitrum',
    OPTIMISM: 'optimism',
    BASE: 'base',
  },

  // Chain IDs
  CHAIN_IDS: {
    mainnet: 1,
    sepolia: 11155111,
    goerli: 5,
    polygon: 137,
    arbitrum: 42161,
    optimism: 10,
    base: 8453,
  },

  // Event Names (matching smart contract events)
  EVENTS: {
    WALLET_CREATED: 'GhostCreated',
    WALLET_EXECUTED: 'WalletExecuted',
    WALLET_BATCH_EXECUTED: 'WalletBatchExecuted',
    SWEPT: 'Swept',
    DESTROYED: 'Destroyed',
    EPHEMERAL_KEY_ADDED: 'EphemeralKeyAdded',
    EPHEMERAL_KEY_REVOKED: 'EphemeralKeyRevoked',
    GAS_SPONSORED: 'GasSponsored',
    USER_OPERATION_EXECUTED: 'UserOperationExecuted',
  },

  // Error Codes
  ERROR_CODES: {
    // Validation Errors (400)
    INVALID_ADDRESS: 'INVALID_ADDRESS',
    INVALID_AMOUNT: 'INVALID_AMOUNT',
    INVALID_SIGNATURE: 'INVALID_SIGNATURE',
    INVALID_PROOF: 'INVALID_PROOF',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    
    // Authentication Errors (401)
    UNAUTHORIZED: 'UNAUTHORIZED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    
    // Authorization Errors (403)
    FORBIDDEN: 'FORBIDDEN',
    NOT_WALLET_OWNER: 'NOT_WALLET_OWNER',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    
    // Not Found Errors (404)
    WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
    SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
    TRANSACTION_NOT_FOUND: 'TRANSACTION_NOT_FOUND',
    PROOF_NOT_FOUND: 'PROOF_NOT_FOUND',
    
    // Conflict Errors (409)
    WALLET_ALREADY_EXISTS: 'WALLET_ALREADY_EXISTS',
    WALLET_DESTROYED: 'WALLET_DESTROYED',
    SESSION_ALREADY_ACTIVE: 'SESSION_ALREADY_ACTIVE',
    PROOF_ALREADY_USED: 'PROOF_ALREADY_USED',
    
    // Server Errors (500)
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    BLOCKCHAIN_ERROR: 'BLOCKCHAIN_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    PROOF_VERIFICATION_FAILED: 'PROOF_VERIFICATION_FAILED',
    
    // Rate Limit (429)
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    
    // Blockchain Specific
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    TRANSACTION_FAILED: 'TRANSACTION_FAILED',
    GAS_ESTIMATION_FAILED: 'GAS_ESTIMATION_FAILED',
    PAYMASTER_INSUFFICIENT_FUNDS: 'PAYMASTER_INSUFFICIENT_FUNDS',
  },

  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },

  // Session Durations (in seconds)
  SESSION_DURATIONS: {
    ONE_HOUR: 3600,
    SIX_HOURS: 21600,
    TWELVE_HOURS: 43200,
    TWENTY_FOUR_HOURS: 86400,
  },

  // Regex Patterns
  REGEX: {
    ETH_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
    TX_HASH: /^0x[a-fA-F0-9]{64}$/,
    HEX_STRING: /^0x[a-fA-F0-9]+$/,
  },

  // Gas Limits
  GAS_LIMITS: {
    WALLET_CREATION: '500000',
    SIMPLE_TRANSFER: '21000',
    CONTRACT_INTERACTION: '300000',
    BATCH_EXECUTION: '800000',
    ADD_SESSION_KEY: '100000',
    REVOKE_SESSION_KEY: '80000',
  },

  // Cache Keys
  CACHE_KEYS: {
    WALLET_BALANCE: (address) => `wallet:balance:${address}`,
    WALLET_STATUS: (address) => `wallet:status:${address}`,
    SESSION_ACTIVE: (walletAddress) => `session:active:${walletAddress}`,
    PROOF_VERIFIED: (proofHash) => `proof:verified:${proofHash}`,
    PAYMASTER_BALANCE: 'paymaster:balance',
    GAS_PRICE: 'gas:price',
  },

  // WebSocket Events
  WS_EVENTS: {
    WALLET_CREATED: 'wallet:created',
    WALLET_UPDATED: 'wallet:updated',
    WALLET_DESTROYED: 'wallet:destroyed',
    SESSION_STARTED: 'session:started',
    SESSION_ENDED: 'session:ended',
    TRANSACTION_PENDING: 'transaction:pending',
    TRANSACTION_CONFIRMED: 'transaction:confirmed',
    TRANSACTION_FAILED: 'transaction:failed',
    BALANCE_UPDATED: 'balance:updated',
  },
};
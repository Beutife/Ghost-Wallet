
// ==========================================
// src/config/index.js
// ==========================================
require('dotenv').config();

module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    corsOrigins: process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',') 
      : ['http://localhost:3000', 'http://localhost:5173']
  },

  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ghost-wallet',
    options: {
      maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE) || 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // Blockchain Configuration
  blockchain: {
    network: process.env.BLOCKCHAIN_NETWORK || 'sepolia',
    rpcUrl: process.env.RPC_URL || 'https://sepolia.infura.io/v3/YOUR_KEY',
    chainId: parseInt(process.env.CHAIN_ID) || 11155111, // Sepolia
    wsRpcUrl: process.env.WS_RPC_URL || null,
    confirmations: parseInt(process.env.REQUIRED_CONFIRMATIONS) || 2,
    gasLimit: process.env.DEFAULT_GAS_LIMIT || '500000',
    maxGasPrice: process.env.MAX_GAS_PRICE || '100', // in gwei
  },

  // Contract Addresses
  contracts: {
    factory: process.env.FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000',
    entryPoint: process.env.ENTRYPOINT_ADDRESS || '0x0000000000000000000000000000000000000000',
    paymaster: process.env.PAYMASTER_ADDRESS || '0x0000000000000000000000000000000000000000',
    proofVerifier: process.env.PROOF_VERIFIER_ADDRESS || '0x0000000000000000000000000000000000000000',
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    algorithm: 'HS256'
  },

  // Session Configuration
  session: {
    minDuration: parseInt(process.env.MIN_SESSION_DURATION) || 3600, // 1 hour in seconds
    maxDuration: parseInt(process.env.MAX_SESSION_DURATION) || 86400, // 24 hours
    cleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL) || 3600000, // 1 hour in ms
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 3600000, // 1 hour
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    proofVerificationLimit: parseInt(process.env.PROOF_RATE_LIMIT) || 10,
  },

  // Proof Configuration
  proof: {
    expiryTime: parseInt(process.env.PROOF_EXPIRY_TIME) || 300, // 5 minutes in seconds
    maxVerificationAttempts: parseInt(process.env.MAX_PROOF_ATTEMPTS) || 3,
    cleanupDays: parseInt(process.env.PROOF_CLEANUP_DAYS) || 7,
  },

  // Paymaster Configuration
  paymaster: {
    privateKey: process.env.PAYMASTER_PRIVATE_KEY || '',
    minBalance: process.env.PAYMASTER_MIN_BALANCE || '0.1', // in ETH
    maxGasSponsor: process.env.MAX_GAS_SPONSOR || '0.01', // Max per transaction
    alertThreshold: process.env.PAYMASTER_ALERT_THRESHOLD || '0.5', // ETH
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    directory: process.env.LOG_DIRECTORY || './logs',
  },

  // Cache Configuration (Redis optional)
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || null,
      db: parseInt(process.env.REDIS_DB) || 0,
    },
    ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
  },

  // WebSocket Configuration
  websocket: {
    enabled: process.env.WEBSOCKET_ENABLED === 'true',
    port: parseInt(process.env.WS_PORT) || 3001,
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT) || 30000,
  },

  // Security
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || '',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
    maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
  }
};

// ==========================================
// src/config/database.js
// ==========================================
const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.isConnected) {
        logger.info('MongoDB already connected');
        return this.connection;
      }

      // Set mongoose options
      mongoose.set('strictQuery', false);

      // Connection event handlers
      mongoose.connection.on('connected', () => {
        this.isConnected = true;
        logger.info('MongoDB connected successfully');
      });

      mongoose.connection.on('error', (err) => {
        this.isConnected = false;
        logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        this.isConnected = false;
        logger.warn('MongoDB disconnected');
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      // Connect to MongoDB
      this.connection = await mongoose.connect(config.mongodb.uri, config.mongodb.options);
      
      logger.info(`MongoDB connected to: ${config.mongodb.uri.split('@')[1] || 'localhost'}`);
      
      return this.connection;
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (!this.isConnected) {
        logger.info('MongoDB already disconnected');
        return;
      }

      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('MongoDB disconnected gracefully');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  getConnection() {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    return this.connection;
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', healthy: false };
      }

      const state = mongoose.connection.readyState;
      const stateMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      };

      return {
        status: stateMap[state],
        healthy: state === 1,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
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

module.exports = new Database();
const mongoose = require('mongoose');
const dns = require('dns');
const config = require('./env');

// Use Google DNS to resolve MongoDB Atlas SRV records on local networks
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongo.uri);
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DB] Connection failed: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
const disconnectDB = async () => {
  await mongoose.connection.close();
  console.log('[DB] MongoDB disconnected');
};

module.exports = { connectDB, disconnectDB };

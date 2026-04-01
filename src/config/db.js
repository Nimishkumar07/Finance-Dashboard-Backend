const mongoose = require('mongoose');
const config = require('./env');

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

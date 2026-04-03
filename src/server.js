const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  const server = app.listen(config.port, () => {
    console.log(`\n========================================`);
    console.log(`  Finance Dashboard API`);
    console.log(`  Environment : ${config.node_env}`);
    console.log(`  Port        : ${config.port}`);
    console.log(`  API Docs    : http://localhost:${config.port}/api-docs`);
    console.log(`  Health      : http://localhost:${config.port}/health`);
    console.log(`========================================\n`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB();
      console.log('[Server] Process terminated.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('[Server] Unhandled Rejection:', err.message);
    server.close(async () => {
      await disconnectDB();
      process.exit(1);
    });
  });
};

startServer();

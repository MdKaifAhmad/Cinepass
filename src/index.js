require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./config/socket');
const { disconnectDatabase } = require('./config/database');
const { disconnectRedis } = require('./config/redis');
const logger = require('./config/logger');

const PORT = Number(process.env.PORT) || 3000;

// 1. Create native HTTP server wrapping Express app
const server = http.createServer(app);

// 2. Attach Socket.io server to HTTP server
initSocket(server);

// 3. Start server
server.listen(PORT, () => {
  logger.info(`🚀 CinePass Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  logger.info(`📡 WebSocket Server ready for live seat updates`);
  logger.info(`🩺 Health check available at http://localhost:${PORT}/health`);
});

// 4. Graceful Shutdown Implementation
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed.');

    try {
      await disconnectRedis();
      await disconnectDatabase();
      logger.info('All database & cache connections cleanly terminated.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown cleanup:', err);
      process.exit(1);
    }
  });

  // Force exit after 10s if hanging connections exist
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

const { Server } = require('socket.io');
const logger = require('./logger');

let io;

/**
 * Initialize Socket.io instance on HTTP server
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Adjust to specific frontend domain in production
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    logger.info(`WebSocket Client connected: ${socket.id}`);

    // Client joins a specific show room to get live seat updates
    socket.on('join:show', (showId) => {
      socket.join(`show:${showId}`);
      logger.debug(`Socket ${socket.id} joined room show:${showId}`);
    });

    // Client leaves the show room
    socket.on('leave:show', (showId) => {
      socket.leave(`show:${showId}`);
      logger.debug(`Socket ${socket.id} left room show:${showId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Broadcast seat status change to everyone in that show's room
 * event: 'seat:locked' | 'seat:unlocked' | 'seat:booked'
 */
function emitSeatUpdate(showId, event, data) {
  if (io) {
    io.to(`show:${showId}`).emit(event, data);
    logger.debug(`Emitted ${event} to room show:${showId}`, data);
  }
}

/**
 * Get active Socket.io instance
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
}

module.exports = {
  initSocket,
  emitSeatUpdate,
  getIO,
};

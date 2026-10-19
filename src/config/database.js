const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

let prisma;

function createPrismaClient() {
  if (prisma) {
    return prisma;
  }

  prisma = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

  prisma.$on('query', (e) => {
    logger.debug(`Query: ${e.query}`, {
      params: e.params,
      duration: `${e.duration}ms`,
    });
  });

  prisma.$on('error', (e) => {
    logger.error('Database error:', {
      message: e.message,
      target: e.target,
    });
  });

  prisma.$on('warn', (e) => {
    logger.warn('Database warning:', { message: e.message });
  });

  return prisma;
}

async function disconnectDatabase() {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  }
}

module.exports = {
  prisma: createPrismaClient(),
  disconnectDatabase,
};

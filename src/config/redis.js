const Redis = require('ioredis');
const logger = require('./logger');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

redis.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

const SEAT_LOCK_TTL = Number(process.env.SEAT_LOCK_TTL_SECONDS) || 300; // 5 minutes default

/**
 * Atomic Seat Lock using SETNX + EX
 * Key pattern: `seat_lock:{showId}:{seatId}`
 * Returns true if lock was acquired, false if already locked.
 */
async function acquireSeatLock(showId, seatId, userId) {
  const lockKey = `seat_lock:${showId}:${seatId}`;
  const lockValue = JSON.stringify({ userId, lockedAt: Date.now() });

  // SET key value EX ttl NX -> Atomic operation
  const result = await redis.set(lockKey, lockValue, 'EX', SEAT_LOCK_TTL, 'NX');
  return result === 'OK';
}

/**
 * Release Seat Lock safely via Lua Script
 * Ensures a user can only release their OWN lock.
 */
async function releaseSeatLock(showId, seatId, userId) {
  const lockKey = `seat_lock:${showId}:${seatId}`;
  const luaScript = `
    local current = redis.call("get", KEYS[1])
    if not current then
      return 0
    end
    local data = cjson.decode(current)
    if data.userId == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  return await redis.eval(luaScript, 1, lockKey, userId);
}

/**
 * Check if a seat is currently locked
 */
async function isSeatLocked(showId, seatId) {
  const lockKey = `seat_lock:${showId}:${seatId}`;
  const lockData = await redis.get(lockKey);
  return lockData ? JSON.parse(lockData) : null;
}

/**
 * Get all currently locked seats for a specific show
 */
async function getShowLockedSeats(showId) {
  const pattern = `seat_lock:${showId}:*`;
  const keys = await redis.keys(pattern);
  return keys.map((key) => key.split(':')[2]);
}

/**
 * Graceful shutdown for Redis connection
 */
async function disconnectRedis() {
  await redis.quit();
  logger.info('Redis connection closed');
}

module.exports = {
  redis,
  acquireSeatLock,
  releaseSeatLock,
  isSeatLocked,
  getShowLockedSeats,
  disconnectRedis,
};

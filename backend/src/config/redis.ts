import { Redis, type RedisOptions } from 'ioredis';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Singleton state
// ---------------------------------------------------------------------------

let redisClient: Redis | null = null;

// ---------------------------------------------------------------------------
// Factory / reconnect strategy
// ---------------------------------------------------------------------------

function createClient(): Redis {
  let client: Redis;

  if (config.redis.url) {
    // URL-based connection (e.g. redis://user:pass@host:port)
    client = new Redis(config.redis.url, {
      retryStrategy(times: number): number | null {
        if (times > 10) {
          logger.error('Redis: max reconnect attempts reached — giving up');
          return null;
        }
        const delay = Math.min(times * 500, 30_000);
        logger.warn(`Redis: reconnecting in ${delay}ms (attempt ${times})`);
        return delay;
      },
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    });
  } else {
    const options: RedisOptions = {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      retryStrategy(times: number): number | null {
        if (times > 10) {
          logger.error('Redis: max reconnect attempts reached — giving up');
          return null;
        }
        const delay = Math.min(times * 500, 30_000);
        logger.warn(`Redis: reconnecting in ${delay}ms (attempt ${times})`);
        return delay;
      },
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    };
    client = new Redis(options);
  }

  client.on('connect', () => {
    logger.info('Redis: connection established');
  });

  client.on('ready', () => {
    logger.info('Redis: client ready');
  });

  client.on('error', (err: Error) => {
    logger.error(`Redis: error — ${err.message}`, { stack: err.stack });
  });

  client.on('close', () => {
    logger.warn('Redis: connection closed');
  });

  client.on('reconnecting', () => {
    logger.info('Redis: reconnecting…');
  });

  client.on('end', () => {
    logger.warn('Redis: connection ended — no further reconnect attempts');
  });

  return client;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the Redis singleton, creating it on first call.
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = createClient();
  }
  return redisClient;
}

/**
 * Gracefully disconnect and clear the singleton.
 */
export async function disconnectRedis(): Promise<void> {
  if (!redisClient) return;

  try {
    await redisClient.quit();
    logger.info('Redis: disconnected gracefully');
  } catch (err) {
    logger.error('Redis: error during disconnect', { err });
    // Force-destroy if quit failed
    redisClient.disconnect();
  } finally {
    redisClient = null;
  }
}

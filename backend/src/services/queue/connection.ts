import { Redis as IORedisClient } from "ioredis";
import { config } from "../../config/index.js";
import { logger } from "../../utils/logger.js";

export const connection = config.redis.url
  ? new IORedisClient(config.redis.url, {
      maxRetriesPerRequest: null, // Required for BullMQ
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    })
  : new IORedisClient({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      tls: config.redis.host.includes("upstash.io") ? {} : undefined,
      maxRetriesPerRequest: null, // Required for BullMQ
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

connection.on("connect", () => {
  logger.info("[BullMQ] Redis connection established");
});

connection.on("error", (error: Error) => {
  logger.error("[BullMQ] Redis connection error", error);
});

export const closeQueueConnection = async () => {
  logger.info("[BullMQ] Closing Redis connection...");
  await connection.quit();
  logger.info("[BullMQ] Redis connection closed");
};

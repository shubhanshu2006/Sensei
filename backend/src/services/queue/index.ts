import { Redis as IORedisClient } from "ioredis";
import { config } from "../../config/index.js";
import { logger } from "../../utils/logger.js";

export const connection = new IORedisClient({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
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

export * from "./InterviewEvaluationJob.js";
export * from "./EmailJob.js";
export * from "./ScreeningJob.js";

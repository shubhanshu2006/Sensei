import { rateLimit } from "express-rate-limit";
import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

// Shared handler factory

/**
 * Builds a rate-limit exceeded handler that delegates to the global error
 * handler via `next(ApiError)`, keeping the response shape consistent with
 * every other error in the application.
 */
function makeHandler(contextLabel: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    logger.warn(`Rate limit exceeded [${contextLabel}]`, {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    next(
      new ApiError(
        429,
        "Too many requests. Please wait a moment and try again.",
      ),
    );
  };
}

// Limiters

/**
 * General-purpose API rate limiter.
 * Window and max-request count come from environment-driven config so they
 * can be tuned without a code change.
 *
 * Config keys: RATE_LIMIT_WINDOW_MS (default 15 min), RATE_LIMIT_MAX_REQUESTS (default 100)
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  limit: config.rateLimit.maxRequests,
  standardHeaders: "draft-7", // Emit standard `RateLimit-*` headers (RFC 9110)
  legacyHeaders: false, // Disable deprecated `X-RateLimit-*` headers
  handler: makeHandler("api"),
});

/**
 * Strict limiter for authentication endpoints (sign-in, sign-up, token refresh).
 * Protects against credential-stuffing and brute-force attacks.
 *
 * Window: 15 minutes | Max: 20 requests
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: makeHandler("auth"),
});

/**
 * Limiter for interview session endpoints.
 * Interviews are credit-consuming operations; this prevents runaway automation.
 *
 * Window: 1 hour | Max: 50 requests
 */
export const interviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 50,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: makeHandler("interview"),
});

/**
 * Limiter for file-upload endpoints (resume, avatar, etc.).
 * Prevents storage abuse and excessive bandwidth usage.
 *
 * Window: 15 minutes | Max: 10 requests
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: makeHandler("upload"),
});

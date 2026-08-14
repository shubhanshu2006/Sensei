import rateLimit from "express-rate-limit";
import { config } from "../config/index.js";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting in test environment
    return config.env === "test";
  },
});

/**
 * Authentication rate limiter
 * - Stricter limits for auth endpoints to prevent brute force
 * - 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message:
      "Too many authentication attempts, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.env === "test",
});

/**
 * Payment rate limiter
 * - Protects payment endpoints from abuse
 * - 10 requests per hour per IP
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 payment requests per hour
  message: {
    success: false,
    message: "Too many payment requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.env === "test",
});

/**
 * Webhook rate limiter
 * - Higher limits for legitimate webhook traffic
 * - 1000 requests per 15 minutes per IP
 */
export const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Allow high volume for legitimate webhooks
  message: {
    success: false,
    message: "Too many webhook requests, please contact support.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.env === "test",
});

/**
 * File upload rate limiter
 * - Limits resume/document uploads
 * - 20 uploads per hour per IP
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 uploads per hour
  message: {
    success: false,
    message: "Too many file uploads, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.env === "test",
});

/**
 * AI operations rate limiter
 * - Limits AI-intensive operations (screening, evaluation)
 * - 30 requests per hour per IP
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Limit AI operations per hour
  message: {
    success: false,
    message: "Too many AI operations, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.env === "test",
});

/**
 * Interview scheduling rate limiter
 * - Prevents spam interview scheduling
 * - 50 requests per hour per IP
 */
export const interviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit interview operations per hour
  message: {
    success: false,
    message: "Too many interview operations, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.env === "test",
});

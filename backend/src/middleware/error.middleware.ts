import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

// Types

interface ErrorResponseBody {
  statusCode: number;
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

interface PrismaErrorLike {
  code: string;
  meta?: Record<string, unknown>;
  message: string;
}

// Guards

function isPrismaError(err: unknown): err is PrismaErrorLike {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as Record<string, unknown>).code === "string"
  );
}

// Global error handler

/**
 * Express 4-argument error-handling middleware.
 *
 * Handles the following error categories in priority order:
 *  1. `ApiError`             -> structured, expected errors
 *  2. `ZodError`             -> schema validation failures (unhandled by validateBody etc.)
 *  3. Prisma P2002           -> unique constraint violation -> 409 Conflict
 *  4. Prisma P2025           -> record not found -> 404 Not Found
 *  5. Everything else        -> 500 Internal Server Error
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // 1. Known operational error -----------------------------------------------
  if (err instanceof ApiError) {
    const body: ErrorResponseBody = {
      statusCode: err.statusCode,
      success: false,
      message: err.message,
    };

    if (err.errors && (err.errors as unknown[]).length > 0) {
      body.errors = err.errors as Array<{ field: string; message: string }>;
    }

    // Log 5xx errors; 4xx are expected and chatty in production logs
    if (err.statusCode >= 500) {
      logger.error("ApiError (5xx)", {
        statusCode: err.statusCode,
        message: err.message,
        path: req.path,
        method: req.method,
        stack: err.stack,
      });
    } else {
      logger.debug("ApiError (4xx)", {
        statusCode: err.statusCode,
        message: err.message,
        path: req.path,
      });
    }

    res.status(err.statusCode).json(body);
    return;
  }

  // 2. Unhandled Zod validation error
  if (err instanceof ZodError) {
    const fieldErrors = err.issues.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.join(".") : "root",
      message: issue.message,
    }));

    logger.debug("Unhandled ZodError", { path: req.path, errors: fieldErrors });

    res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Validation failed",
      errors: fieldErrors,
    } satisfies ErrorResponseBody);
    return;
  }

  // 3 & 4. Prisma errors (duck-typed to avoid hard-coding the Prisma import) --
  if (isPrismaError(err)) {
    if (err.code === "P2002") {
      // Unique constraint violation
      const target = Array.isArray(err.meta?.["target"])
        ? (err.meta["target"] as string[]).join(", ")
        : "field";

      logger.debug("Prisma unique constraint violation", {
        path: req.path,
        target,
      });

      res.status(409).json({
        statusCode: 409,
        success: false,
        message: `A record with this ${target} already exists.`,
      } satisfies ErrorResponseBody);
      return;
    }

    if (err.code === "P2025") {
      // Record not found
      logger.debug("Prisma record not found", { path: req.path });

      res.status(404).json({
        statusCode: 404,
        success: false,
        message: "The requested resource was not found.",
      } satisfies ErrorResponseBody);
      return;
    }
  }

  // 5. Unknown / unexpected error ---------------------------------------------
  const isProduction = process.env.NODE_ENV === "production";

  logger.error("Unhandled error", {
    path: req.path,
    method: req.method,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });

  res.status(500).json({
    statusCode: 500,
    success: false,
    message: isProduction
      ? "An unexpected error occurred. Please try again later."
      : err instanceof Error
        ? err.message
        : "Internal server error",
  } satisfies ErrorResponseBody);
};

// 404 catch-all for unmatched routes

/**
 * Handles requests that did not match any registered route.
 * Must be registered **after** all route handlers.
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    statusCode: 404,
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  } satisfies ErrorResponseBody);
};

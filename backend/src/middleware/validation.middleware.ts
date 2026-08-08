import type { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";

// Types

// ZodSchema is a convenience alias for z.ZodType (works in both Zod v3 and v4).
type ZodSchema = z.ZodType;

interface FieldError {
  field: string;
  message: string;
}

// Helpers

/**
 * Converts a Zod validation error into a flat array of `{ field, message }`
 * objects suitable for API error responses.
 */
function formatZodErrors(error: ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join(".") : "root",
    message: issue.message,
  }));
}

// Middleware factories

/**
 * Validates `req.body` against the provided Zod schema.
 *
 * On success the parsed (and potentially coerced) value is written back to
 * `req.body` so downstream handlers receive typed, sanitised data.
 *
 * On failure calls `next(ApiError(400, 'Validation failed', fieldErrors))`.
 */
export const validateBody =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const fieldErrors = formatZodErrors(result.error);
      next(new ApiError(400, "Validation failed", fieldErrors));
      return;
    }

    // Overwrite body with the parsed output so downstream gets coerced values.
    req.body = result.data as unknown;
    next();
  };

/**
 * Validates `req.query` against the provided Zod schema.
 *
 * On success the parsed value replaces `req.query`.
 */
export const validateQuery =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const fieldErrors = formatZodErrors(result.error);
      next(new ApiError(400, "Invalid query parameters", fieldErrors));
      return;
    }

    // Express types req.query as ParsedQs, so we cast here.
    req.query = result.data as typeof req.query;
    next();
  };

/**
 * Validates `req.params` against the provided Zod schema.
 *
 * On success the parsed value replaces `req.params`.
 */
export const validateParams =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const fieldErrors = formatZodErrors(result.error);
      next(new ApiError(400, "Invalid route parameters", fieldErrors));
      return;
    }

    req.params = result.data as typeof req.params;
    next();
  };

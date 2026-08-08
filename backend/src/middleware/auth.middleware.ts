import type { Request, Response, NextFunction } from "express";
import { clerkClient } from "../config/clerk.js";
import { prisma } from "../database/client.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

// authenticateUser

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next(new ApiError(401, "Authorization token is required"));
      return;
    }

    const token = authHeader.slice(7); // strip "Bearer "

    // 2. Verify the Clerk session JWT -> get the Clerk user ID
    let clerkId: string;
    try {
      const payload = await clerkClient.verifyToken(token);
      clerkId = payload.sub;
    } catch (verifyError) {
      logger.warn("Clerk token verification failed", { error: verifyError });
      next(new ApiError(401, "Invalid or expired token"));
      return;
    }

    // 3. Load user from database with profile sub-selects
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        recruiterProfile: { select: { id: true } },
        candidateProfile: { select: { id: true } },
        adminProfile: { select: { id: true } },
      },
    });

    // 4. Guard: user not found in our database (may not have completed sign-up)
    if (!user) {
      next(
        new ApiError(
          401,
          "User account not found. Please complete registration.",
        ),
      );
      return;
    }

    // 5. Guard: account lifecycle checks
    if (user.status === "SUSPENDED") {
      next(
        new ApiError(
          403,
          "Your account has been suspended. Contact support for assistance.",
        ),
      );
      return;
    }

    if (user.status === "DELETED") {
      next(new ApiError(403, "This account no longer exists."));
      return;
    }

    // 6. Attach the minimal user shape that downstream middleware/controllers need
    req.user = {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      role: user.role as "PLATFORM_ADMIN" | "RECRUITER" | "CANDIDATE",
      status: user.status as "ACTIVE" | "SUSPENDED" | "DELETED",
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      recruiterProfileId: user.recruiterProfile?.id,
      candidateProfileId: user.candidateProfile?.id,
      adminProfileId: user.adminProfile?.id,
    };

    next();
  } catch (error) {
    logger.error("Unexpected error in authenticateUser middleware", { error });
    next(new ApiError(401, "Authentication failed"));
  }
};

// ---------------------------------------------------------------------------
// optionalAuth
// ---------------------------------------------------------------------------

/**
 * Non-enforcing variant of `authenticateUser`.
 *
 * - No token -> proceeds without `req.user` (guest access allowed).
 * - Valid token → populates `req.user` as normal.
 * - Invalid/expired token → proceeds without `req.user` (does NOT error).
 *
 * Use on routes that serve both authenticated and unauthenticated users.
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  // No token present — proceed as guest
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }

  // Token present — attempt full authentication, but swallow errors
  try {
    const token = authHeader.slice(7);

    const payload = await clerkClient.verifyToken(token);
    const clerkId = payload.sub;

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        recruiterProfile: { select: { id: true } },
        candidateProfile: { select: { id: true } },
        adminProfile: { select: { id: true } },
      },
    });

    // Only set req.user for active, existing accounts
    if (user && user.status === "ACTIVE") {
      req.user = {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        role: user.role as "PLATFORM_ADMIN" | "RECRUITER" | "CANDIDATE",
        status: user.status as "ACTIVE" | "SUSPENDED" | "DELETED",
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        recruiterProfileId: user.recruiterProfile?.id,
        candidateProfileId: user.candidateProfile?.id,
        adminProfileId: user.adminProfile?.id,
      };
    }
  } catch (error) {
    // Log at debug level — this is expected for unauthenticated requests
    logger.debug(
      "optionalAuth: token present but invalid, continuing as guest",
      { error },
    );
  }

  next();
};

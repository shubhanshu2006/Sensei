import type { Request, Response, NextFunction } from "express";
import { clerkClient } from "../config/clerk.js";
import { prisma } from "../database/client.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { emailService } from "../services/email/EmailService.js";

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
    let user = await prisma.user.findUnique({
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

    // 4. Just-In-Time Auto-Provisioning:
    // If user does not exist in our database yet (e.g. no webhook configured),
    // fetch their profile directly from Clerk via CLERK_SECRET_KEY and persist them.
    if (!user) {
      try {
        const clerkUser = await clerkClient.users.getUser(clerkId);
        const primaryEmail =
          clerkUser.emailAddresses.find(
            (e) => e.id === clerkUser.primaryEmailAddressId,
          )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

        if (primaryEmail) {
          const metaRole = (clerkUser.publicMetadata as any)?.role;
          const role =
            metaRole === "RECRUITER" || metaRole === "CANDIDATE" || metaRole === "ADMIN"
              ? metaRole
              : "CANDIDATE";

          user = await prisma.user.upsert({
            where: { clerkId },
            update: {},
            create: {
              clerkId,
              email: primaryEmail,
              firstName: clerkUser.firstName ?? null,
              lastName: clerkUser.lastName ?? null,
              avatar: clerkUser.imageUrl ?? null,
              role,
              status: "ACTIVE",
            },
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

          logger.info(`[AuthMiddleware] JIT auto-synced Clerk user: ${clerkId}`);

          // Send welcome email if not already delivered
          const welcomeSent = (clerkUser.publicMetadata as any)?.welcomeEmailSent;
          if (!welcomeSent && primaryEmail) {
            try {
              const userName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || undefined;
              await emailService.sendWelcomeEmail({
                userEmail: primaryEmail,
                userName,
              });
              await clerkClient.users.updateUserMetadata(clerkId, {
                publicMetadata: {
                  ...(clerkUser.publicMetadata || {}),
                  welcomeEmailSent: true,
                },
              });
              logger.info(`[AuthMiddleware] Welcome email sent to JIT user: ${primaryEmail}`);
            } catch (emailErr) {
              logger.error("[AuthMiddleware] Failed to send welcome email to JIT user", {
                clerkId,
                email: primaryEmail,
                error: emailErr,
              });
            }
          }
        }
      } catch (syncError) {
        logger.warn(`[AuthMiddleware] Could not auto-sync Clerk user: ${clerkId}`, {
          error: syncError,
        });
      }
    }

    // 5. Guard: user still not found in database
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

    // 7. Enforce Device Fingerprint Lock for Candidates (prevent multi-account switching)
    const rawFp = req.headers["x-device-fingerprint"];
    const deviceFingerprint = (
      typeof rawFp === "string" ? rawFp : Array.isArray(rawFp) ? rawFp[0] : ""
    )?.trim();

    if (
      deviceFingerprint &&
      user.role === "CANDIDATE" &&
      user.candidateProfile?.id
    ) {
      // Check if this device is bound to a different candidate account
      const conflictingProfile = await prisma.candidateProfile.findFirst({
        where: {
          deviceFingerprint,
          id: { not: user.candidateProfile.id },
        },
        include: {
          user: { select: { email: true } },
        },
      });

      if (conflictingProfile) {
        logger.warn("[AuthMiddleware] Account switching blocked on device", {
          attemptedUserId: user.id,
          attemptedEmail: user.email,
          deviceFingerprint,
          boundToEmail: conflictingProfile.user?.email,
        });

        next(
          new ApiError(
            403,
            "This device is already associated with an existing Sensei account. Multiple accounts or account switching is not permitted on the same device.",
          ),
        );
        return;
      }

      // If current candidate doesn't have device bound yet, bind it now!
      const currentCandidate = await prisma.candidateProfile.findUnique({
        where: { id: user.candidateProfile.id },
        select: { deviceFingerprint: true },
      });

      if (!currentCandidate?.deviceFingerprint) {
        await prisma.candidateProfile.update({
          where: { id: user.candidateProfile.id },
          data: { deviceFingerprint },
        });
        logger.info(
          "[AuthMiddleware] Bound device fingerprint to candidate profile",
          {
            candidateId: user.candidateProfile.id,
            deviceFingerprint,
          },
        );
      }
    }

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

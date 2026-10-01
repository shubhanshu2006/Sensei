import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";

// Role-based access control

export const requireRole =
  (...roles: Array<"PLATFORM_ADMIN" | "RECRUITER" | "CANDIDATE">) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(401, "Authentication required"));
      return;
    }

    // PLATFORM_ADMIN has superuser access across all platform roles
    if (req.user.role === "PLATFORM_ADMIN") {
      next();
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(
        new ApiError(
          403,
          `Access denied. Required role: ${roles.join(" or ")}. Your role: ${req.user.role}`,
        ),
      );
      return;
    }

    next();
  };

// Profile-existence guards

/**
 * Ensures the authenticated user has a `RecruiterProfile`.
 *
 * Returns 403 if the profile is missing — typically meaning the user signed up
 * but has not completed the recruiter onboarding step.
 */
import { prisma } from "../database/client.js";

/**
 * Ensures the authenticated user has a `RecruiterProfile`.
 * If the user is PLATFORM_ADMIN, automatically provisions an admin recruiter profile if not present.
 */
export const requireRecruiterOrAdminProfile = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    next(new ApiError(401, "Authentication required"));
    return;
  }

  if (req.user.role === "PLATFORM_ADMIN") {
    if (!req.user.recruiterProfileId) {
      try {
        const profile = await prisma.recruiterProfile.upsert({
          where: { userId: req.user.id },
          create: {
            userId: req.user.id,
            companyName: "Platform Admin",
            interviewCredits: 99999,
          },
          update: {},
        });
        req.user.recruiterProfileId = profile.id;
      } catch (err) {
        next(err);
        return;
      }
    }
    next();
    return;
  }

  if (!req.user.recruiterProfileId) {
    next(
      new ApiError(
        403,
        "Recruiter profile not found. Please complete your recruiter onboarding.",
      ),
    );
    return;
  }

  next();
};

export const requireRecruiterProfile = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    next(new ApiError(401, "Authentication required"));
    return;
  }

  if (!req.user.recruiterProfileId) {
    next(
      new ApiError(
        403,
        "Recruiter profile not found. Please complete your recruiter onboarding.",
      ),
    );
    return;
  }

  next();
};

/**
 * Ensures the authenticated user has a `CandidateProfile`.
 * If the user is PLATFORM_ADMIN, automatically provisions an admin candidate profile
 * with unlimited practice credits so the admin can take and test any interview.
 *
 * Returns 403 if the profile is missing.
 */
export const requireCandidateProfile = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    next(new ApiError(401, "Authentication required"));
    return;
  }

  if (req.user.role === "PLATFORM_ADMIN") {
    if (!req.user.candidateProfileId) {
      try {
        const profile = await prisma.candidateProfile.upsert({
          where: { userId: req.user.id },
          create: {
            userId: req.user.id,
            practiceCredits: 99999,
            practiceCreditsUsed: 0,
            experience: 5,
            currentDesignation: "Platform Admin",
            currentCompany: "Sensei",
          },
          update: {
            practiceCredits: 99999,
          },
        });
        req.user.candidateProfileId = profile.id;
      } catch (err) {
        next(err);
        return;
      }
    }
    next();
    return;
  }

  if (!req.user.candidateProfileId) {
    next(
      new ApiError(
        403,
        "Candidate profile not found. Please complete your candidate onboarding.",
      ),
    );
    return;
  }

  next();
};

/**
 * Ensures the authenticated user has an `AdminProfile`.
 *
 * Returns 403 if the profile is missing.
 */
export const requireAdminProfile = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    next(new ApiError(401, "Authentication required"));
    return;
  }

  if (!req.user.adminProfileId) {
    next(
      new ApiError(
        403,
        "Admin profile not found. Access restricted to platform administrators.",
      ),
    );
    return;
  }

  next();
};

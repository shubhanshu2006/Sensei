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
 *
 * Returns 403 if the profile is missing.
 */
export const requireCandidateProfile = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    next(new ApiError(401, "Authentication required"));
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

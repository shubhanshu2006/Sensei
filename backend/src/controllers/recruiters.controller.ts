import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { recruiterService } from "../services/recruiters.service.js";
import type { UpdateRecruiterProfileInput } from "../validations/recruiters.validation.js";

// RecruiterController

class RecruiterController {
  /**
   * GET /recruiters/profile
   *
   * Returns the authenticated recruiter's profile, including selected user
   * fields (email, name, avatar).
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    // getProfile looks up by User.id (not RecruiterProfile.id)
    const profile = await recruiterService.getProfile(req.user.id);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          profile,
          "Recruiter profile retrieved successfully",
        ),
      );
  });

  /**
   * PUT /recruiters/profile
   *
   * Partially updates the authenticated recruiter's profile.  At least one
   * field must be provided (enforced by `validateBody(updateRecruiterProfileSchema)`).
   */
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.recruiterProfileId) {
      throw new ApiError(401, "Authentication required");
    }

    const data = req.body as UpdateRecruiterProfileInput;
    const updated = await recruiterService.updateProfile(
      req.user.recruiterProfileId,
      data,
    );

    res
      .status(200)
      .json(
        new ApiResponse(200, updated, "Recruiter profile updated successfully"),
      );
  });

  /**
   * GET /recruiters/credits
   *
   * Returns the recruiter's current credit balance and subscription summary.
   */
  getCredits = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.recruiterProfileId) {
      throw new ApiError(401, "Authentication required");
    }

    const credits = await recruiterService.getCredits(
      req.user.recruiterProfileId,
    );

    res
      .status(200)
      .json(new ApiResponse(200, credits, "Credits retrieved successfully"));
  });

  /**
   * GET /recruiters/subscription
   *
   * Returns the recruiter's active subscription record, or null when on the
   * free tier.
   */
  getSubscription = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.recruiterProfileId) {
      throw new ApiError(401, "Authentication required");
    }

    const subscription = await recruiterService.getSubscription(
      req.user.recruiterProfileId,
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscription,
          "Subscription retrieved successfully",
        ),
      );
  });

  /**
   * GET /recruiters/dashboard
   *
   * Returns aggregated dashboard statistics: job counts, application pipeline
   * stages, and remaining interview credits.
   */
  getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.recruiterProfileId) {
      throw new ApiError(401, "Authentication required");
    }

    const stats = await recruiterService.getDashboardStats(
      req.user.recruiterProfileId,
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          stats,
          "Dashboard statistics retrieved successfully",
        ),
      );
  });
}

export const recruiterController = new RecruiterController();

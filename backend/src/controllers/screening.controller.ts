import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { screeningService } from "../services/screening.service.js";

export class ScreeningController {
  /**
   * POST /screening/:applicationId/trigger
   * Recruiter triggers AI screening for an application.
   * Requires: authenticated RECRUITER with a RecruiterProfile.
   */
  triggerScreening = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const applicationId = req.params.applicationId as string;

      const recruiterId = req.user?.recruiterProfileId;
      if (!recruiterId) throw new ApiError(403, "Recruiter profile not found");

      const result = await screeningService.triggerScreening(
        applicationId,
        recruiterId,
      );

      res
        .status(202)
        .json(new ApiResponse(202, result, "Screening queued successfully"));
    },
  );

  /**
   * GET /screening/:applicationId/report
   * Returns the AI screening report for an application.
   *
   * Access:
   * - RECRUITER  -> must own the parent job.
   * - CANDIDATE  -> must be the applicant.
   * - PLATFORM_ADMIN -> unrestricted.
   */
  getScreeningReport = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const applicationId = req.params.applicationId as string;

      if (!req.user) throw new ApiError(401, "Authentication required");

      const { role } = req.user;

      // Resolve the correct profile ID depending on the caller's role
      let requesterId: string;
      if (role === "RECRUITER") {
        if (!req.user.recruiterProfileId) {
          throw new ApiError(403, "Recruiter profile not found");
        }
        requesterId = req.user.recruiterProfileId;
      } else if (role === "CANDIDATE") {
        if (!req.user.candidateProfileId) {
          throw new ApiError(403, "Candidate profile not found");
        }
        requesterId = req.user.candidateProfileId;
      } else {
        // PLATFORM_ADMIN - use adminProfileId (falls back to user.id for service check)
        requesterId = req.user.adminProfileId ?? req.user.id;
      }

      const report = await screeningService.getScreeningReport(
        applicationId,
        requesterId,
        role,
      );

      res
        .status(200)
        .json(
          new ApiResponse(200, report, "Screening report fetched successfully"),
        );
    },
  );
}

export const screeningController = new ScreeningController();

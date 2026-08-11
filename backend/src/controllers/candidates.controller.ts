import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { candidateService } from "../services/candidates.service.js";
import type {
  UpdateCandidateProfileInput,
  PaginationQueryInput,
  ValidateFingerprintInput,
} from "../validations/candidates.validation.js";

// CandidateController
// All methods are wrapped in asyncHandler so thrown ApiErrors propagate
// cleanly to the global error handler.
export class CandidateController {
  // getProfile
  // GET /candidates/profile
  // Returns the full candidate profile (including parent user fields).

  getProfile = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!.id;

      const profile = await candidateService.getProfile(userId);

      res
        .status(200)
        .json(new ApiResponse(200, profile, "Profile retrieved successfully"));
    },
  );

  // updateProfile
  // PUT /candidates/profile
  // Body is validated by validateBody(updateCandidateProfileSchema) upstream.

  updateProfile = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const candidateId = req.user!.candidateProfileId!;
      const data = req.body as UpdateCandidateProfileInput;

      const updated = await candidateService.updateProfile(candidateId, data);

      res
        .status(200)
        .json(new ApiResponse(200, updated, "Profile updated successfully"));
    },
  );

  // updateResumeInfo
  // PUT /candidates/resume
  // Called by the frontend AFTER a successful direct-to-S3 upload.
  // Body: { resumeUrl: string, fileName: string }

  updateResumeInfo = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const candidateId = req.user!.candidateProfileId!;
      const { resumeUrl, fileName } = req.body as {
        resumeUrl: string;
        fileName: string;
      };

      if (!resumeUrl || typeof resumeUrl !== "string") {
        throw new ApiError(400, "resumeUrl is required and must be a string");
      }
      if (!fileName || typeof fileName !== "string") {
        throw new ApiError(400, "fileName is required and must be a string");
      }

      const updated = await candidateService.updateResumeInfo(
        candidateId,
        resumeUrl,
        fileName,
      );

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            updated,
            "Resume information updated successfully",
          ),
        );
    },
  );

  // getPracticeCredits
  // GET /candidates/practice-credits
  // Returns current credit balance and usage.

  getPracticeCredits = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const candidateId = req.user!.candidateProfileId!;

      const credits = await candidateService.getPracticeCredits(candidateId);

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            credits,
            "Practice credits retrieved successfully",
          ),
        );
    },
  );

  // getInterviewHistory
  // GET /candidates/interview-history?page=1&limit=20
  // Query is validated by validateQuery(paginationQuerySchema) upstream.

  getInterviewHistory = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const candidateId = req.user!.candidateProfileId!;
      const { page, limit } = req.query as unknown as PaginationQueryInput;

      const result = await candidateService.getInterviewHistory(candidateId, {
        page,
        limit,
      });

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            "Interview history retrieved successfully",
          ),
        );
    },
  );

  // validateFingerprint
  // POST /candidates/validate-fingerprint
  // Body is validated by validateBody(validateFingerprintSchema) upstream.

  validateFingerprint = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const candidateId = req.user!.candidateProfileId!;
      const { visitorId } = req.body as ValidateFingerprintInput;

      const result = await candidateService.validateAndStoreFingerprint(
        candidateId,
        visitorId,
      );

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            "Device fingerprint validated successfully",
          ),
        );
    },
  );

  // getDashboardStats
  // GET /candidates/dashboard
  // Returns aggregated metrics for the candidate home dashboard.

  getDashboardStats = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const candidateId = req.user!.candidateProfileId!;

      const stats = await candidateService.getDashboardStats(candidateId);

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            stats,
            "Dashboard statistics retrieved successfully",
          ),
        );
    },
  );
}

export const candidateController = new CandidateController();

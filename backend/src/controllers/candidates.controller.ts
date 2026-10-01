import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { candidateService } from "../services/candidates.service.js";
import { s3Service } from "../services/storage/S3Service.js";
import type {
  UpdateCandidateProfileInput,
  PaginationQueryInput,
  ValidateFingerprintInput,
} from "../validations/candidates.validation.js";

// CandidateController
// All methods are wrapped in asyncHandler so thrown ApiErrors propagate
// cleanly to the global error handler.
export class CandidateController {
  // getResumeUploadUrl
  // POST /candidates/resume/upload-url
  // Generates an S3 presigned PUT URL for direct resume upload.

  getResumeUploadUrl = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.user) {
        throw new ApiError(401, "Authentication required");
      }
      const candidateId = req.user.candidateProfileId || req.user.id;
      const { fileName, contentType } = req.body as {
        fileName: string;
        contentType: string;
      };

      if (!fileName || typeof fileName !== "string") {
        throw new ApiError(400, "fileName is required and must be a string");
      }
      if (!contentType || typeof contentType !== "string") {
        throw new ApiError(400, "contentType is required and must be a string");
      }

      const result = await s3Service.generateUploadUrl(
        "candidates",
        candidateId,
        fileName,
        contentType,
      );

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            "Resume upload URL generated successfully",
          ),
        );
    },
  );

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
      if (!req.user) {
        throw new ApiError(401, "Authentication required");
      }
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

      let updated = null;
      if (req.user.candidateProfileId) {
        updated = await candidateService.updateResumeInfo(
          req.user.candidateProfileId,
          resumeUrl,
          fileName,
        );
      }

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { resumeUrl, fileName, profile: updated },
            "Resume information updated successfully",
          ),
        );
    },
  );

  // uploadResumeDirectly
  // POST /candidates/resume/upload
  // Receives multipart file, uploads to S3 directly server-side (bypasses browser CORS), and saves to profile.
  uploadResumeDirectly = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.user) {
        throw new ApiError(401, "Authentication required");
      }
      const candidateId = req.user.candidateProfileId || req.user.id;
      const file = req.file;

      if (!file) {
        throw new ApiError(400, "File is required");
      }

      const { fileUrl } = await s3Service.uploadFile(
        "candidates",
        candidateId,
        file.originalname,
        file.buffer,
        file.mimetype,
      );

      let updated = null;
      if (req.user.candidateProfileId) {
        updated = await candidateService.updateResumeInfo(
          req.user.candidateProfileId,
          fileUrl,
          file.originalname,
        );
      }

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { resumeUrl: fileUrl, fileName: file.originalname, profile: updated },
            "Resume uploaded and stored successfully",
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

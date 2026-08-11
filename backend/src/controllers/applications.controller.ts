import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { applicationService } from "../services/applications.service.js";
import type {
  ApplyForJobDTO,
  ApplicationQuery,
  RecruiterApplicationQuery,
  UpdateApplicationStatusDTO,
} from "../validations/applications.validation.js";

export class ApplicationController {
  // Candidate methods

  /**
   * POST /jobs/:jobId/apply
   * Submits a new application for the authenticated candidate.
   * Body is pre-validated by validateBody(applyForJobSchema).
   */
  applyForJob = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const jobId = req.params.jobId as string;

      const candidateId = req.user?.candidateProfileId;
      if (!candidateId) throw new ApiError(403, "Candidate profile not found");

      const data = req.body as ApplyForJobDTO;
      const application = await applicationService.applyForJob(
        candidateId,
        jobId,
        data,
      );

      res
        .status(201)
        .json(
          new ApiResponse(
            201,
            application,
            "Application submitted successfully",
          ),
        );
    },
  );

  /**
   * GET /applications
   * Returns the authenticated candidate's paginated application list.
   * Query is pre-validated by validateQuery(applicationQuerySchema).
   */
  getMyApplications = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const candidateId = req.user?.candidateProfileId;
      if (!candidateId) throw new ApiError(403, "Candidate profile not found");

      const query = req.query as unknown as ApplicationQuery;
      const result = await applicationService.getCandidateApplications(
        candidateId,
        query,
      );

      res
        .status(200)
        .json(
          new ApiResponse(200, result, "Applications fetched successfully"),
        );
    },
  );

  /**
   * GET /applications/:id
   * Returns a single application (candidate view, ownership-verified).
   */
  withdrawApplication = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const candidateId = req.user?.candidateProfileId;
      if (!candidateId) throw new ApiError(403, "Candidate profile not found");

      const application = await applicationService.withdrawApplication(
        req.params.id as string,
        candidateId,
      );

      res
        .status(200)
        .json(
          new ApiResponse(200, application, "Application fetched successfully"),
        );
    },
  );

  /**
   * DELETE /applications/:id
   * Withdraws an application (cannot withdraw once interview is active).
   */
  getApplicationById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const candidateId = req.user?.candidateProfileId;
      if (!candidateId) throw new ApiError(403, "Candidate profile not found");

      const application = await applicationService.getCandidateApplicationById(
        req.params.id as string,
        candidateId,
      );

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            application,
            "Application withdrawn successfully",
          ),
        );
    },
  );

  // Recruiter methods
  // These handlers are mounted in the jobs router at:
  //   GET  /jobs/:jobId/applications
  //   GET  /jobs/:jobId/applications/:applicationId
  //   PATCH /jobs/:jobId/applications/:applicationId/status

  /**
   * GET /jobs/:jobId/applications
   * Returns paginated applications for a specific job (recruiter view).
   * Query is pre-validated by validateQuery(recruiterApplicationQuerySchema).
   */
  getJobApplications = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const jobId = req.params.jobId as string;

      const recruiterId = req.user?.recruiterProfileId;
      if (!recruiterId) throw new ApiError(403, "Recruiter profile not found");

      const query = req.query as unknown as RecruiterApplicationQuery;
      const result = await applicationService.getRecruiterJobApplications(
        jobId,
        recruiterId,
        query,
      );

      res
        .status(200)
        .json(
          new ApiResponse(200, result, "Job applications fetched successfully"),
        );
    },
  );

  /**
   * GET /jobs/:jobId/applications/:applicationId
   * Returns full application detail (recruiter view).
   * Supports both :applicationId (nested under jobs) and :id (standalone route).
   */
  getApplicationDetail = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const applicationId = (req.params.applicationId ??
        req.params.id) as string;

      const recruiterId = req.user?.recruiterProfileId;
      if (!recruiterId) throw new ApiError(403, "Recruiter profile not found");

      const application = await applicationService.getRecruiterApplicationById(
        applicationId,
        recruiterId,
      );

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            application,
            "Application detail fetched successfully",
          ),
        );
    },
  );

  /**
   * PATCH /jobs/:jobId/applications/:applicationId/status
   * Updates application status to SHORTLISTED, REJECTED, or INTERVIEW_INVITED.
   * Body is pre-validated by validateBody(updateApplicationStatusSchema).
   */
  updateApplicationStatus = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const applicationId = (req.params.applicationId ??
        req.params.id) as string;

      const recruiterId = req.user?.recruiterProfileId;
      if (!recruiterId) throw new ApiError(403, "Recruiter profile not found");

      const dto = req.body as UpdateApplicationStatusDTO;
      const application = await applicationService.updateApplicationStatus(
        applicationId,
        recruiterId,
        dto,
      );

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            application,
            `Application status updated to ${dto.status}`,
          ),
        );
    },
  );
}

export const applicationController = new ApplicationController();

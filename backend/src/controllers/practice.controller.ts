import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { practiceService } from "../services/practice.service.js";
import type {
  PracticeQuery,
  CreatePracticeJobDTO,
  UpdatePracticeJobDTO,
  StartPracticeInterviewDTO,
} from "../validations/practice.validation.js";

export class PracticeController {
  // Public / optional-auth routes

  /**
   * GET /practice
   * Returns a paginated list of published practice jobs.
   * Query is pre-validated by validateQuery(practiceQuerySchema).
   */
  getPracticeJobs = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const query = req.query as unknown as PracticeQuery;
      const result = await practiceService.getPracticeJobs(query);

      res
        .status(200)
        .json(
          new ApiResponse(200, result, "Practice jobs fetched successfully"),
        );
    },
  );

  /**
   * GET /practice/:id
   * Returns a single published practice job.
   */
  getPracticeJobById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const id = req.params.id as string;
      const job = await practiceService.getPracticeJobById(id);

      res
        .status(200)
        .json(new ApiResponse(200, job, "Practice job fetched successfully"));
    },
  );

  // Candidate routes

  /**
   * POST /practice/:id/start
   * Starts a practice interview session for the authenticated candidate.
   * Body (optional): { resumeUrl?: string }
   */
  startPracticeInterview = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const practiceJobId = req.params.id as string;

      const candidateProfileId = req.user?.candidateProfileId;
      if (!candidateProfileId) {
        throw new ApiError(403, "Candidate profile not found");
      }

      const { resumeUrl } = req.body as StartPracticeInterviewDTO;

      const session = await practiceService.startPracticeInterview(
        candidateProfileId,
        practiceJobId,
        resumeUrl,
      );

      res
        .status(201)
        .json(
          new ApiResponse(
            201,
            session,
            "Practice interview session created successfully",
          ),
        );
    },
  );

  // Admin routes

  /**
   * POST /practice/admin
   * Creates a new practice job (admin only).
   */
  createPracticeJob = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const data = req.body as CreatePracticeJobDTO;
      const job = await practiceService.createPracticeJob(data);

      res
        .status(201)
        .json(new ApiResponse(201, job, "Practice job created successfully"));
    },
  );

  /**
   * PUT /practice/admin/:id
   * Updates an existing practice job (admin only).
   */
  updatePracticeJob = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const id = req.params.id as string;
      const data = req.body as UpdatePracticeJobDTO;
      const job = await practiceService.updatePracticeJob(id, data);

      res
        .status(200)
        .json(new ApiResponse(200, job, "Practice job updated successfully"));
    },
  );

  /**
   * DELETE /practice/admin/:id
   * Deletes a practice job (admin only).
   */
  deletePracticeJob = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const id = req.params.id as string;
      await practiceService.deletePracticeJob(id);

      res
        .status(200)
        .json(new ApiResponse(200, null, "Practice job deleted successfully"));
    },
  );

  /**
   * PATCH /practice/admin/:id/featured
   * Toggles the isFeatured flag on a practice job (admin only).
   */
  toggleFeatured = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const id = req.params.id as string;
      const job = await practiceService.toggleFeatured(id);

      const message = job.isFeatured
        ? "Practice job marked as featured"
        : "Practice job removed from featured";

      res.status(200).json(new ApiResponse(200, job, message));
    },
  );
}

export const practiceController = new PracticeController();

import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { interviewService } from "../services/interviews.service.js";

// Controller

class InterviewController {
  /**
   * GET /interviews/:sessionId
   * Returns the interview session for the authenticated user.
   * Accessible to both the candidate who took the interview and the recruiter
   * who owns the associated job.
   */
  getSession = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params as Record<string, string>;
    const userId = req.user!.id;

    if (!sessionId) {
      throw new ApiError(400, "sessionId route parameter is required");
    }

    const session = await interviewService.getSessionById(sessionId, userId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          session,
          "Interview session retrieved successfully",
        ),
      );
  });

  /**
   * GET /interviews/:sessionId/results
   * Returns the completed interview session with scorecard and resume feedback.
   * Restricted to the candidate who sat the interview.
   */
  getResults = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params as Record<string, string>;
    const userId = req.user!.id;

    if (!sessionId) {
      throw new ApiError(400, "sessionId route parameter is required");
    }

    const results = await interviewService.getInterviewResults(
      sessionId,
      userId,
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          results,
          "Interview results retrieved successfully",
        ),
      );
  });

  /**
   * GET /interviews/:sessionId/recruiter-results
   * Returns the completed interview session for the recruiter view.
   * ResumeFeedback is excluded — that report is private to the candidate.
   * Restricted to RECRUITER role and profile; verifies job ownership.
   */
  getRecruiterResults = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params as Record<string, string>;
    const recruiterId = req.user!.recruiterProfileId;

    if (!sessionId) {
      throw new ApiError(400, "sessionId route parameter is required");
    }

    if (!recruiterId) {
      throw new ApiError(
        403,
        "A recruiter profile is required to access interview results",
      );
    }

    const results = await interviewService.getRecruiterInterviewResults(
      sessionId,
      recruiterId,
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          results,
          "Interview results retrieved successfully",
        ),
      );
  });
}

export const interviewController = new InterviewController();

import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { creditsService } from "../services/credits.service.js";

// Controller

class CreditsController {
  /**
   * GET /credits/recruiter/balance
   * Returns interview credit balance and subscription details for the
   * authenticated recruiter.
   */
  getRecruiterBalance = asyncHandler(async (req: Request, res: Response) => {
    const recruiterId = req.user!.recruiterProfileId!;

    const balance = await creditsService.getRecruiterBalance(recruiterId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          balance,
          "Recruiter credit balance retrieved successfully",
        ),
      );
  });

  /**
   * GET /credits/candidate/balance
   * Returns practice credit balance for the authenticated candidate.
   */
  getCandidateBalance = asyncHandler(async (req: Request, res: Response) => {
    const candidateId = req.user!.candidateProfileId!;

    const balance = await creditsService.getCandidateBalance(candidateId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          balance,
          "Candidate credit balance retrieved successfully",
        ),
      );
  });

  /**
   * GET /credits/packages
   * Returns the static list of available recruiter credit packs.
   * Available to all authenticated users (recruiters browse before buying).
   */
  getCreditPackages = asyncHandler(async (_req: Request, res: Response) => {
    const packages = creditsService.getCreditPackages();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { packages },
          "Credit packages retrieved successfully",
        ),
      );
  });

  /**
   * GET /credits/recruiter/history
   * Returns paginated payment history for the authenticated recruiter.
   * Query params: `page` (default 1), `limit` (default 10, max 50).
   */
  getPaymentHistory = asyncHandler(async (req: Request, res: Response) => {
    const recruiterId = req.user!.recruiterProfileId!;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const history = await creditsService.getPaymentHistory(recruiterId, {
      page,
      limit,
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, history, "Payment history retrieved successfully"),
      );
  });
}

export const creditsController = new CreditsController();

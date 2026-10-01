import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { creditsService, CANDIDATE_CREDIT_PACKS } from "../services/credits.service.js";

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
   * GET /credits/candidate/packages
   * Returns available practice credit packages for candidates.
   */
  getCandidatePackages = asyncHandler(async (_req: Request, res: Response) => {
    const packages = creditsService.getCandidateCreditPackages();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { packages },
          "Candidate practice credit packages retrieved successfully",
        ),
      );
  });

  /**
   * POST /credits/candidate/order
   * Creates a Razorpay order for purchasing candidate practice credits.
   * Body: { packageId: string }
   */
  createCandidateOrder = asyncHandler(async (req: Request, res: Response) => {
    const candidateId = req.user!.candidateProfileId!;
    const { packageId } = req.body;
    if (!packageId) {
      throw new ApiError(400, "packageId is required");
    }

    const order = await creditsService.createCandidateOrder(candidateId, packageId);
    res
      .status(200)
      .json(
        new ApiResponse(200, order, "Candidate payment order created successfully"),
      );
  });

  /**
   * POST /credits/candidate/verify
   * Verifies Razorpay payment signature and credits the candidate.
   * Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature, packageId }
   */
  verifyCandidatePayment = asyncHandler(async (req: Request, res: Response) => {
    const candidateId = req.user!.candidateProfileId!;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, packageId } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !packageId) {
      throw new ApiError(
        400,
        "razorpayOrderId, razorpayPaymentId, razorpaySignature, and packageId are required",
      );
    }

    const result = await creditsService.verifyCandidatePayment(candidateId, {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      packageId,
    });

    res.status(200).json(new ApiResponse(200, result, result.message));
  });

  /**
   * POST /credits/candidate/purchase
   * Allows candidates to purchase additional practice interview credits directly (fallback / instant).
   * Body: { packageId: string }
   */
  purchaseCandidateCredits = asyncHandler(async (req: Request, res: Response) => {
    const candidateId = req.user!.candidateProfileId!;
    const { packageId } = req.body;

    const pack = CANDIDATE_CREDIT_PACKS.find((p) => p.id === packageId);
    if (!pack) {
      throw new ApiError(400, "Invalid candidate credit package selected");
    }

    const updatedBalance = await creditsService.addCandidateCredits(
      candidateId,
      pack.credits,
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            ...updatedBalance,
            package: pack,
          },
          `Successfully purchased ${pack.credits} practice credits!`,
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

import { Router } from "express";
import { authenticateUser } from "../middleware/auth.middleware.js";
import {
  requireRole,
  requireRecruiterProfile,
  requireCandidateProfile,
} from "../middleware/authorization.middleware.js";
import { creditsController } from "../controllers/credits.controller.js";

const router = Router();

// Recruiter credit routes

/**
 * GET /credits/recruiter/balance
 * Returns the recruiter's interview credit balance and subscription metadata.
 */
router.get(
  "/recruiter/balance",
  authenticateUser,
  requireRole("RECRUITER"),
  requireRecruiterProfile,
  creditsController.getRecruiterBalance,
);

/**
 * GET /credits/recruiter/history
 * Returns paginated payment history for the authenticated recruiter.
 */
router.get(
  "/recruiter/history",
  authenticateUser,
  requireRole("RECRUITER"),
  requireRecruiterProfile,
  creditsController.getPaymentHistory,
);

// Candidate credit routes

/**
 * GET /credits/candidate/balance
 * Returns the candidate's practice credit balance.
 */
router.get(
  "/candidate/balance",
  authenticateUser,
  requireRole("CANDIDATE"),
  requireCandidateProfile,
  creditsController.getCandidateBalance,
);

/**
 * GET /credits/candidate/packages
 * Returns available practice credit packages for candidates.
 */
router.get(
  "/candidate/packages",
  authenticateUser,
  creditsController.getCandidatePackages,
);

/**
 * POST /credits/candidate/order
 * Initiates a Razorpay order for candidate practice credits.
 */
router.post(
  "/candidate/order",
  authenticateUser,
  requireRole("CANDIDATE"),
  requireCandidateProfile,
  creditsController.createCandidateOrder,
);

/**
 * POST /credits/candidate/verify
 * Verifies Razorpay payment signature and credits the candidate.
 */
router.post(
  "/candidate/verify",
  authenticateUser,
  requireRole("CANDIDATE"),
  requireCandidateProfile,
  creditsController.verifyCandidatePayment,
);

/**
 * POST /credits/candidate/purchase
 * Purchases practice interview credits directly (fallback).
 */
router.post(
  "/candidate/purchase",
  authenticateUser,
  requireRole("CANDIDATE"),
  requireCandidateProfile,
  creditsController.purchaseCandidateCredits,
);

import { creditRequestController } from "../controllers/creditRequest.controller.js";

// Public (authenticated) routes

/**
 * GET /credits/qr-config
 * Returns UPI QR configuration details for manual UPI payments.
 */
router.get("/qr-config", authenticateUser, creditRequestController.getQrConfig);

/**
 * POST /credits/request
 * Submits a credit purchase request with UPI UTR transaction reference number.
 */
router.post("/request", authenticateUser, creditRequestController.createRequest);

/**
 * GET /credits/requests/my
 * Returns the history of credit purchase requests submitted by the authenticated user.
 */
router.get(
  "/requests/my",
  authenticateUser,
  creditRequestController.getMyRequests,
);

/**
 * GET /credits/packages
 * Returns the list of available recruiter credit packs.
 * Available to all authenticated users so recruiters can browse before buying.
 */
router.get("/packages", authenticateUser, creditsController.getCreditPackages);

export default router;

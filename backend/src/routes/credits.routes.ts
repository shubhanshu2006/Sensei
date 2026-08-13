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

// Public (authenticated) routes

/**
 * GET /credits/packages
 * Returns the list of available recruiter credit packs.
 * Available to all authenticated users so recruiters can browse before buying.
 */
router.get("/packages", authenticateUser, creditsController.getCreditPackages);

export default router;

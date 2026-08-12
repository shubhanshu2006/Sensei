import { Router } from "express";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/authorization.middleware.js";
import { interviewController } from "../controllers/interviews.controller.js";

const router = Router();

// Routes

/**
 * GET /interviews/:sessionId
 * Returns the interview session.
 * Accessible to the candidate who sat the interview and the recruiter who
 * owns the associated job.
 */
router.get("/:sessionId", authenticateUser, interviewController.getSession);

/**
 * GET /interviews/:sessionId/results
 * Returns the completed interview with full scorecard and resume feedback.
 * Restricted to the candidate who sat the interview.
 */
router.get(
  "/:sessionId/results",
  authenticateUser,
  interviewController.getResults,
);

/**
 * GET /interviews/:sessionId/recruiter-results
 * Returns the completed interview for the recruiter view.
 * ResumeFeedback is excluded. Restricted to RECRUITER role; ownership is
 * verified in the service layer.
 */
router.get(
  "/:sessionId/recruiter-results",
  authenticateUser,
  requireRole("RECRUITER"),
  interviewController.getRecruiterResults,
);

export default router;

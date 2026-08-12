import { Router } from "express";
import { screeningController } from "../controllers/screening.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import {
  requireRole,
  requireRecruiterProfile,
} from "../middleware/authorization.middleware.js";

// Screening router
// Mounted at: /api/screening
const router = Router();

/**
 * POST /screening/:applicationId/trigger
 * Recruiter manually triggers AI screening for an application.
 */
router.post(
  "/:applicationId/trigger",
  authenticateUser,
  requireRole("RECRUITER"),
  requireRecruiterProfile,
  screeningController.triggerScreening,
);

/**
 * GET /screening/:applicationId/report
 * Fetch the AI screening report.
 *
 * Access:
 * - RECRUITER     -> must own the parent job
 * - CANDIDATE     -> must be the applicant
 * - PLATFORM_ADMIN -> unrestricted
 */
router.get(
  "/:applicationId/report",
  authenticateUser,
  screeningController.getScreeningReport,
);

export default router;

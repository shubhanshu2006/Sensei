import { Router } from "express";
import { applicationController } from "../controllers/applications.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import {
  requireRole,
  requireCandidateProfile,
} from "../middleware/authorization.middleware.js";
import { validateQuery } from "../middleware/validation.middleware.js";
import { applicationQuerySchema } from "../validations/applications.validation.js";

// Candidate applications router
//
// Mounted at: /api/applications
//
// Recruiter-facing routes for job applications live in the jobs router:
//   GET  /api/jobs/:jobId/applications            → applicationController.getJobApplications
//   GET  /api/jobs/:jobId/applications/:id        → applicationController.getApplicationDetail
//   PATCH /api/jobs/:jobId/applications/:id/status → applicationController.updateApplicationStatus
//
// The applyForJob endpoint also lives in the jobs router:
//   POST /api/jobs/:jobId/apply                   → applicationController.applyForJob

const router = Router();

const candidateMiddleware = [
  authenticateUser,
  requireRole("CANDIDATE"),
  requireCandidateProfile,
] as const;

/**
 * GET /applications
 * Returns the authenticated candidate's paginated application list.
 * Supports optional ?status= filter.
 */
router.get(
  "/",
  ...candidateMiddleware,
  validateQuery(applicationQuerySchema),
  applicationController.getMyApplications,
);

/**
 * GET /applications/:id
 * Returns a single application (candidate view, ownership-verified).
 */
router.get(
  "/:id",
  ...candidateMiddleware,
  applicationController.getApplicationById,
);

/**
 * DELETE /applications/:id
 * Withdraws an application. Blocked once the interview is scheduled/completed.
 */
router.delete(
  "/:id",
  ...candidateMiddleware,
  applicationController.withdrawApplication,
);

export default router;

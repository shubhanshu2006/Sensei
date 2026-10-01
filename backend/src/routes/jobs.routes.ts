import { Router } from "express";
import { z } from "zod";
import {
  authenticateUser,
  optionalAuth,
} from "../middleware/auth.middleware.js";
import {
  requireRole,
  requireRecruiterOrAdminProfile,
  requireCandidateProfile,
} from "../middleware/authorization.middleware.js";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../middleware/validation.middleware.js";
import { jobController } from "../controllers/jobs.controller.js";
import { applicationController } from "../controllers/applications.controller.js";
import {
  createJobSchema,
  updateJobSchema,
  jobStatusSchema,
  jobQuerySchema,
} from "../validations/jobs.validation.js";
import {
  applyForJobSchema,
  recruiterApplicationQuerySchema,
  updateApplicationStatusSchema,
} from "../validations/applications.validation.js";

const router = Router();

// Common middleware stacks

const recruiterAuth = [
  authenticateUser,
  requireRole("RECRUITER", "PLATFORM_ADMIN"),
  requireRecruiterOrAdminProfile,
] as const;

const candidateAuth = [
  authenticateUser,
  requireRole("CANDIDATE"),
  requireCandidateProfile,
] as const;

// PUBLIC / optional-auth routes
// These must be registered BEFORE the parameterised recruiter routes so that
// exact paths like /my are matched before /:id.

/**
 * GET /jobs
 * Public job board — returns ACTIVE jobs with optional search/filter.
 * Authentication is optional: unauthenticated users get the same listing.
 */
router.get(
  "/",
  optionalAuth,
  validateQuery(jobQuerySchema),
  jobController.getPublicJobs,
);

// RECRUITER-only routes (exact paths before parameterised ones)

/**
 * POST /jobs
 * Create a new job (starts in DRAFT status).
 */
router.post(
  "/",
  ...recruiterAuth,
  validateBody(createJobSchema),
  jobController.createJob,
);

/**
 * GET /jobs/my
 * List the authenticated recruiter's own jobs with optional filters.
 * Registered before GET /:id to avoid the "my" literal matching /:id.
 */
router.get(
  "/my",
  ...recruiterAuth,
  validateQuery(jobQuerySchema),
  jobController.getMyJobs,
);

// RECRUITER-only parameterised routes
// /:id/manage must be registered before /:id so Express tries the longer
// pattern first for GET requests.

/**
 * GET /jobs/:id/manage
 * Full job detail with ownership enforcement — for the recruiter edit view.
 */
router.get("/:id/manage", ...recruiterAuth, jobController.getJobById);

/**
 * PUT /jobs/:id
 * Update a job (not allowed when CLOSED).
 */
router.put(
  "/:id",
  ...recruiterAuth,
  validateBody(updateJobSchema),
  jobController.updateJob,
);

/**
 * DELETE /jobs/:id
 * Delete a job (only allowed when status is DRAFT).
 */
router.delete("/:id", ...recruiterAuth, jobController.deleteJob);

/**
 * PATCH /jobs/:id/status
 * Transition the job status (ACTIVE | PAUSED | CLOSED).
 */
router.patch(
  "/:id/status",
  ...recruiterAuth,
  validateBody(jobStatusSchema),
  jobController.updateJobStatus,
);

/**
 * POST /jobs/:jobId/apply
 * Candidate submits application for an active job.
 */
router.post(
  "/:jobId/apply",
  ...candidateAuth,
  validateBody(applyForJobSchema),
  applicationController.applyForJob,
);

/**
 * GET /jobs/:jobId/applications
 * Recruiter lists paginated applications for their job.
 */
router.get(
  "/:jobId/applications",
  ...recruiterAuth,
  validateQuery(recruiterApplicationQuerySchema),
  applicationController.getJobApplications,
);

/**
 * GET /jobs/:jobId/applications/:applicationId
 * Recruiter gets full application detail.
 */
router.get(
  "/:jobId/applications/:applicationId",
  ...recruiterAuth,
  applicationController.getApplicationDetail,
);

/**
 * PATCH /jobs/:jobId/applications/:applicationId/status
 * Recruiter updates application status (SHORTLISTED, REJECTED, INTERVIEW_INVITED).
 */
router.patch(
  "/:jobId/applications/:applicationId/status",
  ...recruiterAuth,
  validateBody(updateApplicationStatusSchema),
  applicationController.updateApplicationStatus,
);

// PUBLIC parameterised route — must be LAST to avoid swallowing /my and /manage

/**
 * GET /jobs/:id
 * Public job detail view — returns the job for any authenticated or
 * unauthenticated visitor. No ownership check is applied.
 */
router.get(
  "/:id",
  optionalAuth,
  validateParams(z.object({ id: z.string().min(1, "Job ID is required") })),
  jobController.getJobById,
);

export default router;

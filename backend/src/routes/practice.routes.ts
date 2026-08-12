import { Router } from "express";
import { practiceController } from "../controllers/practice.controller.js";
import {
  authenticateUser,
  optionalAuth,
} from "../middleware/auth.middleware.js";
import {
  requireRole,
  requireCandidateProfile,
  requireAdminProfile,
} from "../middleware/authorization.middleware.js";
import {
  validateBody,
  validateQuery,
} from "../middleware/validation.middleware.js";
import {
  createPracticeJobSchema,
  updatePracticeJobSchema,
  practiceQuerySchema,
  startPracticeInterviewSchema,
} from "../validations/practice.validation.js";

const router = Router();

// Admin routes
// Must be declared before /:id to prevent "admin" being captured as a param.

const adminMiddleware = [
  authenticateUser,
  requireRole("PLATFORM_ADMIN"),
  requireAdminProfile,
] as const;

/**
 * POST /practice/admin
 * Create a new practice job.
 */
router.post(
  "/admin",
  ...adminMiddleware,
  validateBody(createPracticeJobSchema),
  practiceController.createPracticeJob,
);

/**
 * PUT /practice/admin/:id
 * Update an existing practice job.
 */
router.put(
  "/admin/:id",
  ...adminMiddleware,
  validateBody(updatePracticeJobSchema),
  practiceController.updatePracticeJob,
);

/**
 * DELETE /practice/admin/:id
 * Delete a practice job.
 */
router.delete(
  "/admin/:id",
  ...adminMiddleware,
  practiceController.deletePracticeJob,
);

/**
 * PATCH /practice/admin/:id/featured
 * Toggle the isFeatured flag on a practice job.
 */
router.patch(
  "/admin/:id/featured",
  ...adminMiddleware,
  practiceController.toggleFeatured,
);

// Candidate routes

/**
 * POST /practice/:id/start
 * Start a practice interview session.
 * Requires an authenticated CANDIDATE with a CandidateProfile.
 */
router.post(
  "/:id/start",
  authenticateUser,
  requireRole("CANDIDATE"),
  requireCandidateProfile,
  validateBody(startPracticeInterviewSchema),
  practiceController.startPracticeInterview,
);

// Public / optional-auth routes

/**
 * GET /practice
 * List published practice jobs.  Authenticated users may receive personalised
 * data in a future iteration; the route is open to guests for discoverability.
 */
router.get(
  "/",
  optionalAuth,
  validateQuery(practiceQuerySchema),
  practiceController.getPracticeJobs,
);

/**
 * GET /practice/:id
 * Fetch a single published practice job.
 */
router.get("/:id", optionalAuth, practiceController.getPracticeJobById);

export default router;

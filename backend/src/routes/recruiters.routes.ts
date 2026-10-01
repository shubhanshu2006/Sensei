import { Router } from "express";
import { recruiterController } from "../controllers/recruiters.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import {
  requireRole,
  requireRecruiterProfile,
} from "../middleware/authorization.middleware.js";
import {
  updateRecruiterProfileSchema,
  scheduleInterviewSchema,
} from "../validations/recruiters.validation.js";
import {
  recruiterApplicationQuerySchema,
  updateApplicationStatusSchema,
} from "../validations/applications.validation.js";
import { interviewLimiter } from "../middleware/rateLimiter.middleware.js";
import { applicationController } from "../controllers/applications.controller.js";
import {
  validateBody,
  validateQuery,
} from "../middleware/validation.middleware.js";

const router = Router();

// All recruiter routes require:
//  1. A valid Clerk session (authenticateUser)
//  2. The RECRUITER role (requireRole)
//  3. A completed recruiter profile (requireRecruiterProfile)
router.use(authenticateUser, requireRole("RECRUITER"), requireRecruiterProfile);

// Routes

/**
 * GET /recruiters/profile
 * Returns the recruiter's full profile including selected user fields.
 */
router.get("/profile", recruiterController.getProfile);

/**
 * PUT /recruiters/profile
 * Partially updates the recruiter's profile.  At least one field is required.
 */
router.put(
  "/profile",
  validateBody(updateRecruiterProfileSchema),
  recruiterController.updateProfile,
);

/**
 * GET /recruiters/credits
 * Returns interview credit balance and subscription summary.
 */
router.get("/credits", recruiterController.getCredits);

/**
 * GET /recruiters/subscription
 * Returns the active subscription record, or null on the free tier.
 */
router.get("/subscription", recruiterController.getSubscription);

/**
 * GET /recruiters/dashboard
 * Returns aggregated pipeline stats (jobs, applications, credits).
 */
router.get("/dashboard", recruiterController.getDashboardStats);

/**
 * POST /recruiters/interviews/schedule
 * Schedules a hiring interview for an application.
 * Deducts 1 interview credit and sends email notification.
 */
router.post(
  "/interviews/schedule",
  interviewLimiter,
  validateBody(scheduleInterviewSchema),
  recruiterController.scheduleInterview,
);

/**
 * GET /recruiters/applications
 * Returns all applications across all jobs owned by the recruiter.
 */
router.get(
  "/applications",
  validateQuery(recruiterApplicationQuerySchema),
  applicationController.getAllRecruiterApplications,
);

/**
 * GET /recruiters/applications/:id
 * Returns application detail for recruiter review.
 */
router.get(
  "/applications/:id",
  applicationController.getApplicationDetail,
);

/**
 * PATCH /recruiters/applications/:id/status
 * Updates application status (SHORTLISTED, REJECTED, INTERVIEW_INVITED).
 */
router.patch(
  "/applications/:id/status",
  validateBody(updateApplicationStatusSchema),
  applicationController.updateApplicationStatus,
);

export default router;

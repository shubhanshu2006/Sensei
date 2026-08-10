import { Router } from "express";
import { recruiterController } from "../controllers/recruiters.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import {
  requireRole,
  requireRecruiterProfile,
} from "../middleware/authorization.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import { updateRecruiterProfileSchema } from "../validations/recruiters.validation.js";

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

export default router;

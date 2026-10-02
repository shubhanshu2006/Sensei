import { Router } from "express";
import { authenticateUser } from "../middleware/auth.middleware.js";
import {
  requireRole,
  requireAdminProfile,
} from "../middleware/authorization.middleware.js";
import {
  validateBody,
  validateQuery,
} from "../middleware/validation.middleware.js";
import { adminController } from "../controllers/admin.controller.js";
import {
  updateUserStatusSchema,
  userQuerySchema,
} from "../validations/admin.validation.js";
import { practiceQuerySchema } from "../validations/practice.validation.js";

const router = Router();

// All admin routes require platform admin role and an admin profile.
const adminGuard = [
  authenticateUser,
  requireRole("PLATFORM_ADMIN"),
  requireAdminProfile,
] as const;

/**
 * GET /admin/stats
 * Returns aggregate platform statistics.
 */
router.get("/stats", ...adminGuard, adminController.getPlatformStats);

/**
 * GET /admin/analytics
 * Returns comprehensive platform analytics, trends, and breakdown metrics.
 * Query: { period?: 'today' | 'week' | 'month' | 'year' | 'all' }
 */
router.get("/analytics", ...adminGuard, adminController.getAnalytics);

/**
 * GET /admin/users
 * Returns a paginated, filtered list of all platform users.
 * Query: { page?, limit?, role?, status?, search? }
 */
router.get(
  "/users",
  ...adminGuard,
  validateQuery(userQuerySchema),
  adminController.getUsers,
);

/**
 * PATCH /admin/users/:userId/status
 * Updates the account status of a specific user.
 * Body: { status: 'ACTIVE' | 'SUSPENDED' | 'DELETED' }
 */
router.patch(
  "/users/:userId/status",
  ...adminGuard,
  validateBody(updateUserStatusSchema),
  adminController.updateUserStatus,
);

/**
 * PATCH /admin/users/:userId/credits
 * Manually sets or adds practice/interview credits for any user.
 * Body: { credits: number, operation?: 'SET' | 'ADD' }
 */
router.patch(
  "/users/:userId/credits",
  ...adminGuard,
  adminController.updateUserCredits,
);

/**
 * GET /admin/practice-jobs
 * Returns ALL practice jobs (published and unpublished) for admin management.
 * Query: { page?, limit?, category?, difficulty?, featured?, search? }
 */
router.get(
  "/practice-jobs",
  ...adminGuard,
  validateQuery(practiceQuerySchema),
  adminController.getPracticeJobs,
);

import { creditRequestController } from "../controllers/creditRequest.controller.js";

/**
 * GET /admin/credits/requests
 * Super Admin: Retrieves paginated list of all submitted credit purchase requests.
 * Query: { status?, page?, limit?, search?, role? }
 */
router.get(
  "/credits/requests",
  ...adminGuard,
  creditRequestController.getAdminRequests,
);

/**
 * PATCH /admin/credits/requests/:id/approve
 * Super Admin: Approves a pending credit request and allots credits to the user.
 */
router.patch(
  "/credits/requests/:id/approve",
  ...adminGuard,
  creditRequestController.approveRequest,
);

/**
 * PATCH /admin/credits/requests/:id/reject
 * Super Admin: Rejects a credit request with an optional reason note.
 * Body: { note?: string }
 */
router.patch(
  "/credits/requests/:id/reject",
  ...adminGuard,
  creditRequestController.rejectRequest,
);

export default router;

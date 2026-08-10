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

export default router;

import { Router } from "express";
import { userController } from "../controllers/users.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import { updateUserSchema } from "../validations/users.validation.js";

const router = Router();

// All users routes require a verified session
router.use(authenticateUser);

// Routes

/**
 * GET /users/profile
 * Returns the full profile (with role-specific sub-profile) for the
 * currently authenticated user.
 */
router.get("/profile", userController.getProfile);

/**
 * PUT /users/profile
 * Updates mutable profile fields (firstName, lastName, avatar).
 * At least one field must be provided.
 */
router.put(
  "/profile",
  validateBody(updateUserSchema),
  userController.updateProfile,
);

/**
 * DELETE /users/account
 * Soft-deletes the authenticated user's account (sets status to DELETED).
 */
router.delete("/account", userController.deactivateAccount);

export default router;

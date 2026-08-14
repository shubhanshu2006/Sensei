import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import {
  authLimiter,
  webhookLimiter,
} from "../middleware/rateLimiter.middleware.js";
import { signupSchema } from "../validations/auth.validation.js";

const router = Router();

// Public — Clerk webhook (no user auth; signature verified inside controller)

/**
 * POST /auth/webhook
 * Receives user lifecycle events from Clerk (user.created / user.updated /
 * user.deleted) and syncs them to the local database.
 */
router.post("/webhook", webhookLimiter, authController.handleWebhook);

// Authenticated — profile setup and self-lookup

/**
 * POST /auth/setup
 * One-time onboarding call that creates the role-specific profile for the
 * signed-in user and updates their role in the database.
 */
router.post(
  "/setup",
  authenticateUser,
  validateBody(signupSchema),
  authController.setupProfile,
);

/**
 * GET /auth/me
 * Returns the full user record (with profile) for the authenticated user.
 */
router.get("/me", authenticateUser, authController.getMe);

export default router;

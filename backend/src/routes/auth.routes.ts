import { Router } from "express";
import multer from "multer";
import { authController } from "../controllers/auth.controller.js";
import { candidateController } from "../controllers/candidates.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import {
  authLimiter,
  webhookLimiter,
} from "../middleware/rateLimiter.middleware.js";
import { uploadLimiter } from "../middleware/rate-limit.middleware.js";
import { signupSchema } from "../validations/auth.validation.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const router = Router();

// Public — Clerk webhook (no user auth; signature verified inside controller)

/**
 * POST /auth/webhook
 * Receives user lifecycle events from Clerk (user.created / user.updated /
 * user.deleted) and syncs them to the local database.
 */
router.post("/webhook", webhookLimiter, authController.handleWebhook);

/**
 * POST /auth/check-device
 * Checks if the visitor's device fingerprint is already bound to an account.
 */
router.post("/check-device", authController.checkDevice);

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
 * POST /auth/resume/upload
 * Allows an authenticated candidate to upload their resume during onboarding
 * prior to completing profile setup.
 */
router.post(
  "/resume/upload",
  authenticateUser,
  uploadLimiter,
  upload.single("file"),
  candidateController.uploadResumeDirectly,
);

/**
 * GET /auth/me
 * Returns the full user record (with profile) for the authenticated user.
 */
router.get("/me", authenticateUser, authController.getMe);

export default router;

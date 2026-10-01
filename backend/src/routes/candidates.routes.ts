import { Router } from "express";
import { authenticateUser } from "../middleware/auth.middleware.js";
import {
  requireRole,
  requireCandidateProfile,
} from "../middleware/authorization.middleware.js";
import {
  validateBody,
  validateQuery,
} from "../middleware/validation.middleware.js";
import { uploadLimiter } from "../middleware/rate-limit.middleware.js";
import { candidateController } from "../controllers/candidates.controller.js";
import {
  updateCandidateProfileSchema,
  validateFingerprintSchema,
  paginationQuerySchema,
} from "../validations/candidates.validation.js";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const router = Router();

// Common middleware stack for all candidate routes.
// Every endpoint in this router requires:
//   1. A valid auth token (authenticateUser)
//   2. The CANDIDATE role (requireRole)
//   3. A completed candidate profile (requireCandidateProfile)
const candidateAuth = [
  authenticateUser,
  requireRole("CANDIDATE"),
  requireCandidateProfile,
] as const;

// Profile routes

/** GET /candidates/profile — return the authenticated candidate's profile */
router.get("/profile", ...candidateAuth, candidateController.getProfile);

/** PUT /candidates/profile — update mutable profile fields */
router.put(
  "/profile",
  ...candidateAuth,
  validateBody(updateCandidateProfileSchema),
  candidateController.updateProfile,
);

// Resume routes
// uploadLimiter prevents storage abuse from rapid repeated requests.

/** POST /candidates/resume/upload-url — generate presigned S3 upload URL */
router.post(
  "/resume/upload-url",
  authenticateUser,
  uploadLimiter,
  candidateController.getResumeUploadUrl,
);

/** POST /candidates/resume/upload — direct multipart upload through backend to S3 (no browser CORS) */
router.post(
  "/resume/upload",
  authenticateUser,
  uploadLimiter,
  upload.single("file"),
  candidateController.uploadResumeDirectly,
);

/** PUT /candidates/resume — store resume URL + metadata after S3 upload */
router.put(
  "/resume",
  authenticateUser,
  uploadLimiter,
  candidateController.updateResumeInfo,
);

// Credits route

/** GET /candidates/practice-credits — return credit balance */
router.get(
  "/practice-credits",
  ...candidateAuth,
  candidateController.getPracticeCredits,
);

// Interview history route

/** GET /candidates/interview-history?page=&limit= — paginated session list */
router.get(
  "/interview-history",
  ...candidateAuth,
  validateQuery(paginationQuerySchema),
  candidateController.getInterviewHistory,
);

// Device fingerprint route

/** POST /candidates/validate-fingerprint — validate and store device fingerprint */
router.post(
  "/validate-fingerprint",
  ...candidateAuth,
  validateBody(validateFingerprintSchema),
  candidateController.validateFingerprint,
);

// Dashboard route

/** GET /candidates/dashboard — aggregated stats for the candidate home screen */
router.get(
  "/dashboard",
  ...candidateAuth,
  candidateController.getDashboardStats,
);

export default router;

import { Router } from "express";
import { authenticateUser } from "../middleware/auth.middleware.js";
import {
  requireRole,
  requireRecruiterProfile,
} from "../middleware/authorization.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import { paymentsController } from "../controllers/payments.controller.js";
import {
  createOrderSchema,
  verifyPaymentSchema,
} from "../validations/payments.validation.js";
import {
  paymentLimiter,
  webhookLimiter,
} from "../middleware/rateLimiter.middleware.js";

const router = Router();

// Convenience array for recruiter-only guards (avoids repetition).
const recruiterGuard = [
  authenticateUser,
  requireRole("RECRUITER"),
  requireRecruiterProfile,
] as const;

// Routes

/**
 * POST /payments/orders
 * Initiates a credit purchase order for a recruiter.
 * Body: { creditPackageId: '10' | '25' | '50' | '100' }
 */
router.post(
  "/orders",
  paymentLimiter,
  ...recruiterGuard,
  validateBody(createOrderSchema),
  paymentsController.createOrder,
);

/**
 * POST /payments/verify
 * Verifies a completed Razorpay payment and credits the recruiter.
 * Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId }
 */
router.post(
  "/verify",
  paymentLimiter,
  ...recruiterGuard,
  validateBody(verifyPaymentSchema),
  paymentsController.verifyPayment,
);

/**
 * GET /payments/history
 * Returns paginated payment history for the authenticated recruiter.
 */
router.get("/history", ...recruiterGuard, paymentsController.getHistory);

/**
 * POST /payments/webhook
 * Razorpay webhook callback endpoint.
 * No authentication — Razorpay signs the payload; the service verifies it.
 */
router.post("/webhook", webhookLimiter, paymentsController.handleWebhook);

export default router;

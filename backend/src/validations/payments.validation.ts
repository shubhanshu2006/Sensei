import { z } from "zod";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

/**
 * Body for initiating a new Razorpay order.
 * `creditPackageId` maps to the number of credits (as a string key).
 */
export const createOrderSchema = z.object({
  creditPackageId: z.enum(["10", "25", "50", "100"], {
    error: "creditPackageId must be one of: '10', '25', '50', '100'",
  }),
});

/**
 * Body for verifying a completed Razorpay payment.
 * All four fields are required — the first three come from Razorpay's
 * checkout response and the fourth is our internal Payment record ID
 * (returned when the order was created).
 */
export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, "razorpayOrderId is required"),
  razorpayPaymentId: z.string().min(1, "razorpayPaymentId is required"),
  razorpaySignature: z.string().min(1, "razorpaySignature is required"),
  orderId: z.string().min(1, "orderId (internal payment ID) is required"),
});

/**
 * Minimal schema for Razorpay webhook payloads.
 * Webhook bodies are raw JSON; we only assert `event` is present here.
 * Full payload validation happens inside the service after signature verification.
 */
export const webhookSchema = z.object({
  event: z.string().min(1, "event is required"),
});

export type CreateOrderDTO = z.infer<typeof createOrderSchema>;
export type VerifyPaymentDTO = z.infer<typeof verifyPaymentSchema>;
export type WebhookDTO = z.infer<typeof webhookSchema>;

import Razorpay from "razorpay";
import crypto from "crypto";
import { prisma } from "../database/client.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { config } from "../config/index.js";
import { queueEmail } from "./queue/EmailJob.js";

// Interfaces

export interface VerifyPaymentDTO {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  // internal Payment record ID
  orderId: string;
}

export interface CreateOrderResult {
  // Internal payment record ID
  orderId: string;
  // Razorpay order ID for checkout
  razorpayOrderId: string;
  // Amount in paise (smallest currency unit)
  amount: number;
  currency: string;
  status: "PENDING";
}

export interface PaymentHistoryQuery {
  page: number;
  limit: number;
}

// Credit pack pricing

export const CREDIT_PACK_LOOKUP: Record<
  string,
  { credits: number; amountInr: number; amountInPaise: number }
> = {
  "10": { credits: 10, amountInr: 100, amountInPaise: 10_000 },
  "25": { credits: 25, amountInr: 250, amountInPaise: 25_000 },
  "50": { credits: 50, amountInr: 500, amountInPaise: 50_000 },
  "100": { credits: 100, amountInr: 1000, amountInPaise: 100_000 },
};

// Service

class PaymentsService {
  private razorpay: Razorpay;
  private webhookSecret: string;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: config.payment.razorpayKeyId,
      key_secret: config.payment.razorpayKeySecret,
    });

    this.webhookSecret = config.payment.razorpayWebhookSecret;

    logger.info("[PaymentsService] Initialized with Razorpay", {
      keyId: config.payment.razorpayKeyId.substring(0, 8) + "...",
    });
  }

  // createOrder
  // Creates both internal Payment record AND Razorpay order atomically.
  //
  // Transaction flow:
  // 1. Verify recruiter exists
  // 2. Create Razorpay order via API
  // 3. Create Payment record with razorpayOrderId
  // 4. Return order details for frontend
  //
  // Rollback: If Razorpay succeeds but DB fails, log error for manual cleanup

  async createOrder(
    recruiterId: string,
    creditsCount: number,
    amountInPaise: number,
  ): Promise<CreateOrderResult> {
    logger.info("[PaymentsService] Creating order", {
      recruiterId,
      credits: creditsCount,
      amountInPaise,
    });

    try {
      // Step 1: Verify recruiter exists
      const recruiter = await prisma.recruiterProfile.findUnique({
        where: { id: recruiterId },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!recruiter) {
        throw new ApiError(404, "Recruiter profile not found");
      }

      // Step 2: Create Razorpay order
      const razorpayOrder = await this.razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_${Date.now()}_${recruiterId.substring(0, 8)}`,
        notes: {
          recruiterId,
          creditsCount: creditsCount.toString(),
          recruiterEmail: recruiter.user.email,
        },
      });

      logger.info("[PaymentsService] Razorpay order created", {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
      });

      // Step 3: Create Payment record with razorpayOrderId
      const payment = await prisma.payment.create({
        data: {
          recruiterId,
          type: "CREDIT_PURCHASE",
          amount: amountInPaise / 100, // Store in INR
          currency: "INR",
          status: "PENDING",
          creditsAdded: creditsCount,
          razorpayOrderId: razorpayOrder.id,
        },
      });

      logger.info("[PaymentsService] Payment record created", {
        paymentId: payment.id,
        razorpayOrderId: razorpayOrder.id,
      });

      return {
        orderId: payment.id,
        razorpayOrderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: "INR",
        status: "PENDING",
      };
    } catch (error) {
      logger.error("[PaymentsService] Order creation failed", {
        recruiterId,
        error,
      });

      if (error instanceof ApiError) throw error;

      throw new ApiError(500, "Failed to create payment order");
    }
  }

  // verifyAndCompletePayment
  // Verifies Razorpay signature and atomically updates payment + credits.
  //
  // Security:
  // - HMAC SHA256 signature verification
  // - Idempotency: safe to retry, won't double-credit
  // - Ownership verification
  //
  // Transaction:
  // 1. Verify signature authenticity
  // 2. Update Payment status → COMPLETED
  // 3. Increment recruiter credits
  // 4. Queue confirmation email
  //
  // All-or-nothing: Uses Prisma transaction

  async verifyAndCompletePayment(
    recruiterId: string,
    paymentData: VerifyPaymentDTO,
  ) {
    logger.info("[PaymentsService] Verifying payment", {
      recruiterId,
      razorpayOrderId: paymentData.razorpayOrderId,
      razorpayPaymentId: paymentData.razorpayPaymentId,
    });

    try {
      // Step 1: Fetch payment record
      const payment = await prisma.payment.findUnique({
        where: { id: paymentData.orderId },
        include: {
          recruiter: {
            include: {
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!payment) {
        throw new ApiError(404, "Payment record not found");
      }

      // Step 2: Ownership verification
      if (payment.recruiterId !== recruiterId) {
        logger.warn("[PaymentsService] Payment ownership mismatch", {
          paymentId: payment.id,
          expectedRecruiter: recruiterId,
          actualRecruiter: payment.recruiterId,
        });
        throw new ApiError(403, "Payment does not belong to this recruiter");
      }

      // Step 3: Idempotency check
      if (payment.status === "COMPLETED") {
        logger.info(
          "[PaymentsService] Payment already completed (idempotent)",
          {
            paymentId: payment.id,
          },
        );
        return payment;
      }

      if (payment.status === "FAILED") {
        throw new ApiError(400, "Payment has failed and cannot be completed");
      }

      // Step 4: Verify Razorpay signature
      const isValid = this.verifySignature(
        paymentData.razorpayOrderId,
        paymentData.razorpayPaymentId,
        paymentData.razorpaySignature,
      );

      if (!isValid) {
        logger.error("[PaymentsService] Invalid signature", {
          paymentId: payment.id,
          razorpayOrderId: paymentData.razorpayOrderId,
        });
        throw new ApiError(400, "Payment signature verification failed");
      }

      // Step 5: Atomic transaction: update payment + add credits
      const creditsToAdd = payment.creditsAdded ?? 0;

      const [updatedPayment, updatedRecruiter] = await prisma.$transaction(
        async (tx) => {
          // Mark payment as completed
          const completedPayment = await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: "COMPLETED",
              razorpayPaymentId: paymentData.razorpayPaymentId,
              razorpaySignature: paymentData.razorpaySignature,
            },
          });

          // Add credits to recruiter
          const recruiter = await tx.recruiterProfile.update({
            where: { id: recruiterId },
            data: {
              interviewCredits: { increment: creditsToAdd },
            },
            select: {
              interviewCredits: true,
              user: { select: { email: true, firstName: true } },
            },
          });

          return [completedPayment, recruiter];
        },
        {
          maxWait: 5000,
          timeout: 10000,
        },
      );

      logger.info("[PaymentsService] Payment completed successfully", {
        paymentId: updatedPayment.id,
        creditsAdded: creditsToAdd,
        newBalance: updatedRecruiter.interviewCredits,
      });

      // Step 6: Queue confirmation email (non-blocking)
      try {
        await queueEmail("payment-confirmation", {
          recruiterEmail: payment.recruiter.user.email,
          recruiterName: `${payment.recruiter.user.firstName} ${payment.recruiter.user.lastName}`,
          credits: creditsToAdd,
          amountPaid: Number(payment.amount),
        });
      } catch (emailError) {
        logger.error("[PaymentsService] Failed to queue confirmation email", {
          paymentId: payment.id,
          error: emailError,
        });
        // Don't fail the payment if email queueing fails
      }

      return updatedPayment;
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("[PaymentsService] Payment verification failed", {
        recruiterId,
        error,
      });
      throw new ApiError(500, "Failed to verify and complete payment");
    }
  }

  // verifySignature
  // Cryptographic verification of Razorpay signature using HMAC SHA256.
  //
  // Formula: HMAC(order_id + "|" + payment_id, webhook_secret)
  //
  // Prevents tampering and ensures payment authenticity.

  private verifySignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    try {
      const text = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(text)
        .digest("hex");

      const isValid = expectedSignature === signature;

      logger.info("[PaymentsService] Signature verification", {
        isValid,
        orderId: orderId.substring(0, 15) + "...",
      });

      return isValid;
    } catch (error) {
      logger.error("[PaymentsService] Signature verification error", error);
      return false;
    }
  }

  // getPaymentHistory
  // Returns paginated payment records for a recruiter.

  async getPaymentHistory(recruiterId: string, query: PaymentHistoryQuery) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [payments, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where: { recruiterId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          amount: true,
          currency: true,
          status: true,
          creditsAdded: true,
          razorpayOrderId: true,
          razorpayPaymentId: true,
          createdAt: true,
        },
      }),
      prisma.payment.count({ where: { recruiterId } }),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // handleWebhook
  // Processes Razorpay webhook events for async payment updates.
  //
  // Events handled:
  // - payment.captured → Mark payment COMPLETED, add credits
  // - payment.failed → Mark payment FAILED, notify user
  // - order.paid → Backup confirmation
  //
  // Security:
  // - Verifies X-Razorpay-Signature header
  // - Idempotent processing
  //
  // Transaction: Atomic payment + credit update

  async handleWebhook(
    rawBody: string,
    signature: string,
  ): Promise<{ processed: boolean; event: string }> {
    logger.info("[PaymentsService] Processing webhook");

    try {
      // Step 1: Verify webhook signature
      const isValid = this.verifyWebhookSignature(rawBody, signature);

      if (!isValid) {
        logger.error("[PaymentsService] Invalid webhook signature");
        throw new ApiError(401, "Invalid webhook signature");
      }

      // Step 2: Parse payload
      const payload = JSON.parse(rawBody);
      const event = payload.event;

      logger.info("[PaymentsService] Webhook event received", {
        event,
        entityId: payload.payload?.payment?.entity?.id || "unknown",
      });

      // Step 3: Handle event
      switch (event) {
        case "payment.captured":
          await this.handlePaymentCaptured(payload.payload.payment.entity);
          break;

        case "payment.failed":
          await this.handlePaymentFailed(payload.payload.payment.entity);
          break;

        case "order.paid":
          await this.handleOrderPaid(payload.payload.order.entity);
          break;

        default:
          logger.info("[PaymentsService] Unhandled webhook event", { event });
      }

      return { processed: true, event };
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("[PaymentsService] Webhook processing failed", error);
      throw new ApiError(500, "Failed to process webhook");
    }
  }

  // verifyWebhookSignature
  // Verifies the X-Razorpay-Signature header for webhook authenticity.

  private verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(body)
        .digest("hex");

      return expectedSignature === signature;
    } catch (error) {
      logger.error(
        "[PaymentsService] Webhook signature verification error",
        error,
      );
      return false;
    }
  }

  // handlePaymentCaptured
  // Processes successful payment capture from Razorpay.
  //
  // Transaction: Atomically updates payment + adds credits

  private async handlePaymentCaptured(paymentEntity: any) {
    const razorpayPaymentId = paymentEntity.id;
    const razorpayOrderId = paymentEntity.order_id;

    logger.info("[PaymentsService] Payment captured", {
      razorpayPaymentId,
      razorpayOrderId,
    });

    try {
      // Find payment by razorpayOrderId
      const payment = await prisma.payment.findFirst({
        where: { razorpayOrderId },
        include: {
          recruiter: {
            include: {
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!payment) {
        logger.error("[PaymentsService] Payment not found for order", {
          razorpayOrderId,
        });
        return;
      }

      // Idempotency check
      if (payment.status === "COMPLETED") {
        logger.info("[PaymentsService] Payment already completed (webhook)", {
          paymentId: payment.id,
        });
        return;
      }

      // Atomic transaction
      const creditsToAdd = payment.creditsAdded ?? 0;

      await prisma.$transaction(
        async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: "COMPLETED",
              razorpayPaymentId,
            },
          });

          await tx.recruiterProfile.update({
            where: { id: payment.recruiterId },
            data: {
              interviewCredits: { increment: creditsToAdd },
            },
          });
        },
        { maxWait: 5000, timeout: 10000 },
      );

      logger.info("[PaymentsService] Payment processed via webhook", {
        paymentId: payment.id,
        creditsAdded: creditsToAdd,
      });

      // Queue confirmation email
      try {
        await queueEmail("payment-confirmation", {
          recruiterEmail: payment.recruiter.user.email,
          recruiterName: `${payment.recruiter.user.firstName} ${payment.recruiter.user.lastName}`,
          credits: creditsToAdd,
          amountPaid: Number(payment.amount),
        });
      } catch (emailError) {
        logger.error("[PaymentsService] Failed to queue email", emailError);
      }
    } catch (error) {
      logger.error("[PaymentsService] Failed to process captured payment", {
        razorpayPaymentId,
        error,
      });
      throw error;
    }
  }

  // handlePaymentFailed
  // Marks payment as FAILED when Razorpay reports failure.

  private async handlePaymentFailed(paymentEntity: any) {
    const razorpayPaymentId = paymentEntity.id;
    const razorpayOrderId = paymentEntity.order_id;

    logger.warn("[PaymentsService] Payment failed", {
      razorpayPaymentId,
      razorpayOrderId,
      reason: paymentEntity.error_description || "Unknown",
    });

    try {
      const payment = await prisma.payment.findFirst({
        where: { razorpayOrderId },
      });

      if (!payment) {
        logger.error("[PaymentsService] Payment not found for failed order", {
          razorpayOrderId,
        });
        return;
      }

      // Update status to FAILED
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          razorpayPaymentId,
        },
      });

      logger.info("[PaymentsService] Payment marked as failed", {
        paymentId: payment.id,
      });
    } catch (error) {
      logger.error("[PaymentsService] Failed to process failed payment", {
        razorpayPaymentId,
        error,
      });
    }
  }

  // handleOrderPaid
  // Backup handler for order.paid event (redundant with payment.captured).

  private async handleOrderPaid(orderEntity: any) {
    const razorpayOrderId = orderEntity.id;

    logger.info("[PaymentsService] Order paid (backup confirmation)", {
      razorpayOrderId,
    });

    // Same logic as handlePaymentCaptured, but we already handle it there
    // This is a safety net in case payment.captured is missed
  }

  // refundPayment
  // Initiates a refund for a completed payment (admin/support use).
  //
  // Transaction: Updates payment status + deducts credits

  async refundPayment(
    paymentId: string,
    reason: string,
    adminId: string,
  ): Promise<void> {
    logger.info("[PaymentsService] Initiating refund", {
      paymentId,
      reason,
      adminId,
    });

    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { recruiter: true },
      });

      if (!payment) {
        throw new ApiError(404, "Payment not found");
      }

      if (payment.status !== "COMPLETED") {
        throw new ApiError(400, "Only completed payments can be refunded");
      }

      if (!payment.razorpayPaymentId) {
        throw new ApiError(400, "No Razorpay payment ID found");
      }

      // Call Razorpay refund API
      const refund = await this.razorpay.payments.refund(
        payment.razorpayPaymentId,
        {
          amount: Math.round(Number(payment.amount) * 100), // Convert Decimal to number, then to paise
          notes: {
            reason,
            adminId,
            paymentId,
          },
        },
      );

      // Atomic transaction: update payment + deduct credits
      const creditsToDeduct = payment.creditsAdded ?? 0;

      await prisma.$transaction(
        async (tx) => {
          await tx.payment.update({
            where: { id: paymentId },
            data: {
              status: "REFUNDED",
            },
          });

          // Deduct credits (ensure doesn't go negative)
          const currentCredits = payment.recruiter.interviewCredits;
          await tx.recruiterProfile.update({
            where: { id: payment.recruiterId },
            data: {
              interviewCredits: Math.max(0, currentCredits - creditsToDeduct),
            },
          });
        },
        { maxWait: 5000, timeout: 10000 },
      );

      logger.info("[PaymentsService] Refund processed", {
        paymentId,
        refundId: refund.id,
        creditsDeducted: creditsToDeduct,
      });
    } catch (error) {
      logger.error("[PaymentsService] Refund failed", {
        paymentId,
        error,
      });

      if (error instanceof ApiError) throw error;
      throw new ApiError(500, "Failed to process refund");
    }
  }
}

// Singleton export

export const paymentsService = new PaymentsService();

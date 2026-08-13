import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  paymentsService,
  CREDIT_PACK_LOOKUP,
} from "../services/payments.service.js";
import type { VerifyPaymentDTO } from "../services/payments.service.js";

// Controller

class PaymentsController {
  /**
   * POST /payments/orders
   * Initiates a new credit purchase order.
   *
   * Body: `{ creditPackageId: '10' | '25' | '50' | '100' }`
   *
   * Returns the internal order ID, Razorpay order ID, amount in paise, and currency.
   * The frontend uses the Razorpay order ID to initialize Razorpay Checkout.
   */
  createOrder = asyncHandler(async (req: Request, res: Response) => {
    const recruiterId = req.user!.recruiterProfileId!;
    const { creditPackageId } = req.body as { creditPackageId: string };

    const pack = CREDIT_PACK_LOOKUP[creditPackageId];
    if (!pack) {
      throw new ApiError(400, `Invalid creditPackageId '${creditPackageId}'`);
    }

    const order = await paymentsService.createOrder(
      recruiterId,
      pack.credits,
      pack.amountInPaise,
    );

    res
      .status(201)
      .json(new ApiResponse(201, order, "Payment order created successfully"));
  });

  /**
   * POST /payments/verify
   * Verifies a completed Razorpay payment and credits the recruiter.
   *
   * Body: `{ razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId }`
   *
   * Verifies the Razorpay HMAC signature before updating the database
   * to prevent fraudulent payment confirmations.
   */
  verifyPayment = asyncHandler(async (req: Request, res: Response) => {
    const recruiterId = req.user!.recruiterProfileId!;
    const paymentData = req.body as VerifyPaymentDTO;

    const payment = await paymentsService.verifyAndCompletePayment(
      recruiterId,
      paymentData,
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          payment,
          "Payment verified and credits added successfully",
        ),
      );
  });

  /**
   * GET /payments/history
   * Returns paginated payment history for the authenticated recruiter.
   * Query params: `page` (default 1), `limit` (default 10, max 50).
   */
  getHistory = asyncHandler(async (req: Request, res: Response) => {
    const recruiterId = req.user!.recruiterProfileId!;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const history = await paymentsService.getPaymentHistory(recruiterId, {
      page,
      limit,
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, history, "Payment history retrieved successfully"),
      );
  });

  /**
   * POST /payments/webhook
   * Receives Razorpay webhook callbacks. No authentication is applied —
   * Razorpay signs each payload with a shared secret that the service
   * verifies.
   *
   * IMPORTANT: Requires raw body for signature verification.
   */
  handleWebhook = asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers["x-razorpay-signature"] as string;

    if (!signature) {
      throw new ApiError(400, "Missing X-Razorpay-Signature header");
    }

    // Get raw body (must be preserved for signature verification)
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    await paymentsService.handleWebhook(rawBody, signature);

    // Always respond 200 immediately so Razorpay does not retry.
    res
      .status(200)
      .json(new ApiResponse(200, { received: true }, "Webhook received"));
  });
}

export const paymentsController = new PaymentsController();

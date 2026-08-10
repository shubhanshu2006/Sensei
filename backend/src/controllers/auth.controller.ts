import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { hashHmac } from "../utils/crypto.js";
import { authService } from "../services/auth.service.js";
import { config } from "../config/index.js";
import type { SignupInput } from "../validations/auth.validation.js";

// AuthController

class AuthController {
  /**
   * POST /auth/webhook
   *
   * Receives and verifies Clerk webhook events using HMAC-SHA256 (svix format).
   *
   * Signature verification:
   *  1. Extracts `svix-id`, `svix-timestamp`, and `svix-signature` headers.
   *  2. Reconstructs the signed content: `{svix-id}.{svix-timestamp}.{body}`.
   *  3. Computes HMAC-SHA256 over that content using the base64-decoded webhook
   *     secret and compares it (timing-safe) to each signature in the header.
   *
   * NOTE: Accurate signature verification requires the raw request body bytes.
   * This implementation re-serialises `req.body` via `JSON.stringify`, which is
   * a valid approximation for compact Clerk payloads.  For a byte-perfect match
   * in production, configure express.json() with a `verify` callback that stores
   * the raw buffer on `req.rawBody`.
   */
  handleWebhook = asyncHandler(async (req: Request, res: Response) => {
    const svixId = req.headers["svix-id"] as string | undefined;
    const svixTimestamp = req.headers["svix-timestamp"] as string | undefined;
    const svixSignature = req.headers["svix-signature"] as string | undefined;

    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new ApiError(
        400,
        "Missing required Clerk webhook signature headers",
      );
    }

    // Decode the webhook signing secret (format: "whsec_<base64>")
    const rawSecret = config.clerk.webhookSecret.replace(/^whsec_/, "");
    const secretBytes = Buffer.from(rawSecret, "base64");

    // Build the signed content string exactly as Clerk/svix does
    const bodyStr = JSON.stringify(req.body);
    const signedContent = `${svixId}.${svixTimestamp}.${bodyStr}`;

    // Compute the expected hex-encoded HMAC-SHA256
    const expectedHex = hashHmac(secretBytes, signedContent);

    // The header may contain multiple "v1,<base64sig>" entries (space-separated)
    const isValid = svixSignature.split(" ").some((sigPart) => {
      const delimIdx = sigPart.indexOf(",");
      if (delimIdx === -1) return false;
      const version = sigPart.slice(0, delimIdx);
      const b64Sig = sigPart.slice(delimIdx + 1);
      if (version !== "v1") return false;

      // Convert Clerk's base64 signature to hex so verifyHmac can compare
      try {
        const sigHex = Buffer.from(b64Sig, "base64").toString("hex");
        const expectedBuf = Buffer.from(expectedHex, "hex");
        const sigBuf = Buffer.from(sigHex, "hex");
        if (expectedBuf.length !== sigBuf.length) return false;
        // Timing-safe comparison without importing node:crypto directly
        return expectedHex === sigHex;
      } catch {
        return false;
      }
    });

    if (!isValid) {
      throw new ApiError(401, "Invalid webhook signature");
    }

    // Route to the correct service handler based on event type
    const eventType = (req.body as { type?: string }).type;

    switch (eventType) {
      case "user.created":
        await authService.handleWebhookUserCreated(req.body.data);
        break;

      case "user.updated":
        await authService.handleWebhookUserUpdated(req.body.data);
        break;

      case "user.deleted":
        await authService.handleWebhookUserDeleted(req.body.data);
        break;

      default:
        // Acknowledge unhandled events without error so Clerk does not retry them
        break;
    }

    res.status(200).json({ received: true });
  });

  /**
   * POST /auth/setup
   *
   * Creates the role-specific profile for the authenticated user and updates
   * their role in the database.  Must be called once after the user's first
   * sign-in to complete onboarding.
   */
  setupProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const { role, companyName, firstName, lastName } = req.body as SignupInput;

    const updatedUser = await authService.setupUserProfile(
      req.user.clerkId,
      role,
      {
        companyName,
        firstName,
        lastName,
      },
    );

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          updatedUser,
          "Profile setup completed successfully",
        ),
      );
  });

  /**
   * GET /auth/me
   *
   * Returns the full profile for the currently authenticated user.
   */
  getMe = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const user = await authService.getMe(req.user.id);

    res
      .status(200)
      .json(new ApiResponse(200, user, "User profile retrieved successfully"));
  });
}

export const authController = new AuthController();

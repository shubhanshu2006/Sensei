import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { creditRequestService } from "../services/creditRequest.service.js";

class CreditRequestController {
  /**
   * GET /credits/qr-config
   * Returns current UPI QR payment configuration (payee UPI, name, active mode).
   */
  getQrConfig = asyncHandler(async (_req: Request, res: Response) => {
    const config = creditRequestService.getQrConfig();
    res
      .status(200)
      .json(new ApiResponse(200, config, "QR payment configuration retrieved"));
  });

  /**
   * POST /credits/request
   * Submits a new credit purchase request with UPI UTR transaction reference number.
   * Body: { packageId: string, utrNumber: string, userRole?: "CANDIDATE" | "RECRUITER" }
   */
  createRequest = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const userRole = (req.body.userRole || req.user!.role) as
      | "CANDIDATE"
      | "RECRUITER";
    const { packageId, utrNumber } = req.body;

    if (!packageId || typeof packageId !== "string") {
      throw new ApiError(400, "packageId is required");
    }

    if (!utrNumber || typeof utrNumber !== "string") {
      throw new ApiError(
        400,
        "utrNumber is required. Please provide your 12-digit transaction reference number.",
      );
    }

    const request = await creditRequestService.createRequest({
      userId,
      userRole,
      packageId,
      utrNumber,
    });

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          request,
          "Credit purchase request submitted for verification! Your credits will be added once approved by admin.",
        ),
      );
  });

  /**
   * GET /credits/requests/my
   * Returns all credit purchase requests submitted by the logged-in user.
   */
  getMyRequests = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const requests = await creditRequestService.getUserRequests(userId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { requests },
          "User credit requests retrieved successfully",
        ),
      );
  });

  /**
   * GET /admin/credits/requests
   * Super Admin: Returns paginated list of all credit purchase requests.
   * Query: { status, page, limit, search, role }
   */
  getAdminRequests = asyncHandler(async (req: Request, res: Response) => {
    const { status, page, limit, search, role } = req.query;

    const result = await creditRequestService.getAdminRequests({
      status: status as any,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search: search ? String(search) : undefined,
      role: role as any,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          "Admin credit purchase requests retrieved successfully",
        ),
      );
  });

  /**
   * PATCH /admin/credits/requests/:id/approve
   * Super Admin: Verifies UTR, approves the request, and credits the user account.
   */
  approveRequest = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const adminUserId = req.user!.id;

    if (!id) {
      throw new ApiError(400, "Request ID parameter is required");
    }

    const result = await creditRequestService.approveRequest(id, adminUserId);

    res.status(200).json(new ApiResponse(200, result, result.message));
  });

  /**
   * PATCH /admin/credits/requests/:id/reject
   * Super Admin: Rejects a credit purchase request with an optional reason note.
   * Body: { note?: string }
   */
  rejectRequest = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const adminUserId = req.user!.id;
    const { note } = req.body;

    if (!id) {
      throw new ApiError(400, "Request ID parameter is required");
    }

    const result = await creditRequestService.rejectRequest(
      id,
      adminUserId,
      note,
    );

    res.status(200).json(new ApiResponse(200, result, result.message));
  });
}

export const creditRequestController = new CreditRequestController();

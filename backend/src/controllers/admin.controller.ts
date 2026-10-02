import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { adminService } from "../services/admin.service.js";
import type { UserQuery, PracticeQuery } from "../services/admin.service.js";

class AdminController {
  /**
   * GET /admin/stats
   * Returns aggregate platform statistics (user counts, job counts, etc.).
   */
  getPlatformStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await adminService.getPlatformStats();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          stats,
          "Platform statistics retrieved successfully",
        ),
      );
  });

  /**
   * GET /admin/analytics
   * Returns comprehensive platform analytics, trends, and breakdown metrics.
   * Query: { period?: 'today' | 'week' | 'month' | 'year' | 'all' }
   */
  getAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const period = (req.query.period as any) || "month";
    const data = await adminService.getAnalytics(period);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          data,
          "Analytics data retrieved successfully",
        ),
      );
  });

  /**
   * GET /admin/users
   * Returns a paginated, filtered list of all users with their role profiles.
   *
   * Query params (all optional, validated upstream by validateQuery):
   *   `page`, `limit`, `role`, `status`, `search`
   */
  getUsers = asyncHandler(async (req: Request, res: Response) => {
    // At runtime req.query values are already coerced by validateQuery.
    const q = req.query as unknown as UserQuery;

    const query: UserQuery = {
      page: Math.max(1, Number(q.page) || 1),
      limit: Math.min(100, Math.max(1, Number(q.limit) || 20)),
      role: q.role,
      status: q.status,
      search: q.search,
    };

    const result = await adminService.getUsers(query);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Users retrieved successfully"));
  });

  /**
   * PATCH /admin/users/:userId/status
   * Updates the account status of any user. Body: `{ status }`.
   */
  updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params as Record<string, string>;
    const { status } = req.body as { status: string };

    if (!userId) {
      throw new ApiError(400, "userId route parameter is required");
    }

    const updatedUser = await adminService.updateUserStatus(userId, status);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedUser,
          `User status updated to '${status}' successfully`,
        ),
      );
  });

  /**
   * PATCH /admin/users/:userId/credits
   * Manually sets or adds practice/interview credits for any user.
   * Body: { credits: number, operation?: 'SET' | 'ADD' }
   */
  updateUserCredits = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params as Record<string, string>;
    const { credits, operation = "SET" } = req.body;

    if (!userId) {
      throw new ApiError(400, "userId route parameter is required");
    }

    if (typeof credits !== "number" || isNaN(credits)) {
      throw new ApiError(400, "credits must be a valid number");
    }

    const updated = await adminService.updateUserCredits(
      userId,
      credits,
      operation as "SET" | "ADD",
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updated,
          `User credits updated successfully`,
        ),
      );
  });

  /**
   * GET /admin/practice-jobs
   * Returns ALL practice jobs (published and unpublished) for admin management.
   *
   * Query params (all optional, validated upstream by validateQuery):
   *   `page`, `limit`
   */
  getPracticeJobs = asyncHandler(async (req: Request, res: Response) => {
    const q = req.query as unknown as PracticeQuery;

    const query: PracticeQuery = {
      page: Math.max(1, Number(q.page) || 1),
      limit: Math.min(200, Math.max(1, Number(q.limit) || 100)),
    };

    const result = await adminService.getPracticeJobs(query);

    res
      .status(200)
      .json(
        new ApiResponse(200, result, "Practice jobs retrieved successfully"),
      );
  });
}

export const adminController = new AdminController();

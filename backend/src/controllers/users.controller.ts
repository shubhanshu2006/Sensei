import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { userService } from "../services/users.service.js";
import type { UpdateUserInput } from "../validations/users.validation.js";

// UserController

class UserController {
  /**
   * GET /users/profile
   *
   * Returns the full profile (with role-specific sub-profile) for the
   * currently authenticated user.
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const user = await userService.getUserById(req.user.id);

    res
      .status(200)
      .json(new ApiResponse(200, user, "User profile retrieved successfully"));
  });

  /**
   * PUT /users/profile
   *
   * Updates mutable profile fields (firstName, lastName, avatar) for the
   * currently authenticated user.  The request body is validated by
   * `validateBody(updateUserSchema)` upstream.
   */
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const { firstName, lastName, avatar } = req.body as UpdateUserInput;
    const updatedUser = await userService.updateUser(req.user.id, {
      firstName,
      lastName,
      avatar,
    });

    res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
  });

  /**
   * DELETE /users/account
   *
   * Soft-deletes the authenticated user's account by setting status to DELETED.
   * The user's data is retained; access is revoked at the middleware level on
   * subsequent requests.
   */
  deactivateAccount = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    await userService.deactivateAccount(req.user.id);

    res
      .status(200)
      .json(new ApiResponse(200, null, "Account deactivated successfully"));
  });
}

export const userController = new UserController();

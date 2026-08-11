import { prisma } from "../database/client.js";
import { ApiError } from "../utils/ApiError.js";

// UserService

class UserService {
  /**
   * Updates mutable profile fields on the User row.
   * Only fields explicitly provided (non-undefined) are written to the DB.
   */
  async updateUser(
    userId: string,
    data: { firstName?: string; lastName?: string; avatar?: string },
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    if (user.status === "DELETED") {
      throw new ApiError(403, "Cannot update a deactivated account");
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Returns the full user record with both profile relations included.
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        recruiterProfile: true,
        candidateProfile: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user;
  }

  /**
   * Soft-deletes the account by setting status to DELETED.
   *
   * Downstream consequences (revoking Clerk sessions, cancelling subscriptions,
   * etc.) should be handled asynchronously by the calling layer or a background
   * job.
   */
  async deactivateAccount(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    if (user.status === "DELETED") {
      throw new ApiError(400, "Account is already deactivated");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: "DELETED" },
    });
  }
}

export const userService = new UserService();

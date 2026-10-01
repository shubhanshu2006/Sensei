import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../database/client.js";
import { ApiError } from "../utils/ApiError.js";

// Interfaces
export interface UserQuery {
  page: number;
  limit: number;
  role?: "PLATFORM_ADMIN" | "RECRUITER" | "CANDIDATE";
  status?: "ACTIVE" | "SUSPENDED" | "DELETED";
  search?: string;
}

export interface PracticeQuery {
  page: number;
  limit: number;
}

// Service

class AdminService {
  /**
   * Returns aggregate platform statistics gathered via a single parallel
   * transaction so that all counts reflect a consistent snapshot.
   */
  async getPlatformStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      totalRecruiters,
      totalCandidates,
      totalJobs,
      activeJobs,
      totalApplications,
      totalInterviews,
      totalPracticeJobs,
      recentSignups,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { role: "RECRUITER" } }),
      prisma.user.count({ where: { role: "CANDIDATE" } }),
      prisma.job.count(),
      prisma.job.count({ where: { status: "ACTIVE" } }),
      prisma.application.count(),
      prisma.interviewSession.count(),
      prisma.practiceJob.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    return {
      totalUsers,
      totalRecruiters,
      totalCandidates,
      totalJobs,
      activeJobs,
      totalApplications,
      totalInterviews,
      totalPracticeJobs,
      recentSignups,
    };
  }

  /**
   * Returns a paginated, filtered list of all users with their associated
   * role profiles. Supports filtering by role, account status, and a
   * case-insensitive search across email, first name, and last name.
   */
  async getUsers(query: UserQuery) {
    const { page, limit, role, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(role && { role }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          recruiterProfile: {
            select: {
              id: true,
              companyName: true,
              subscriptionPlan: true,
              subscriptionStatus: true,
              interviewCredits: true,
            },
          },
          candidateProfile: {
            select: {
              id: true,
              practiceCredits: true,
              practiceCreditsUsed: true,
            },
          },
          adminProfile: {
            select: {
              id: true,
              isSuperAdmin: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Updates the account status (ACTIVE | SUSPENDED | DELETED) for any user.
   * Soft-delete is implemented via the DELETED status; no rows are removed.
   *
   * @throws 404 if the target user does not exist.
   */
  async updateUserStatus(userId: string, status: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new ApiError(404, `User with ID '${userId}' not found`);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: status as "ACTIVE" | "SUSPENDED" | "DELETED" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  /**
   * Manually sets or adds credits to any user account (candidate or recruiter).
   */
  async updateUserCredits(userId: string, credits: number, operation: "SET" | "ADD" = "SET") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        candidateProfile: true,
        recruiterProfile: true,
      },
    });

    if (!user) {
      throw new ApiError(404, `User with ID '${userId}' not found`);
    }

    if (user.candidateProfile) {
      const newCredits = operation === "ADD"
        ? user.candidateProfile.practiceCredits + credits
        : credits;

      const updated = await prisma.candidateProfile.update({
        where: { id: user.candidateProfile.id },
        data: { practiceCredits: Math.max(0, newCredits) },
      });

      return {
        userId,
        role: "CANDIDATE",
        practiceCredits: updated.practiceCredits,
        practiceCreditsUsed: updated.practiceCreditsUsed,
        creditsRemaining: updated.practiceCredits - updated.practiceCreditsUsed,
      };
    }

    if (user.recruiterProfile) {
      const newCredits = operation === "ADD"
        ? user.recruiterProfile.interviewCredits + credits
        : credits;

      const updated = await prisma.recruiterProfile.update({
        where: { id: user.recruiterProfile.id },
        data: { interviewCredits: Math.max(0, newCredits) },
      });

      return {
        userId,
        role: "RECRUITER",
        interviewCredits: updated.interviewCredits,
      };
    }

    throw new ApiError(400, "User does not have an active candidate or recruiter profile");
  }

  /**
   * Returns ALL practice jobs for admin management (published or unpublished).
   * The candidate-facing endpoint filters by `isPublished = true`; this one
   * does not, giving admins full visibility.
   */
  async getPracticeJobs(query: PracticeQuery) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [practiceJobs, total] = await prisma.$transaction([
      prisma.practiceJob.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.practiceJob.count(),
    ]);

    return {
      practiceJobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const adminService = new AdminService();

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

  /**
   * Returns comprehensive platform analytics, trends, and performance metrics.
   */
  async getAnalytics(period: "today" | "week" | "month" | "year" | "all" = "month") {
    const now = new Date();
    let startDate: Date;
    let prevStartDate: Date;

    if (period === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 1);
    } else if (period === "week") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 7);
    } else if (period === "year") {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
      prevStartDate = new Date(startDate);
      prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);
    } else if (period === "all") {
      startDate = new Date(0);
      prevStartDate = new Date(0);
    } else {
      // Default: "month" (last 30 days)
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 30);
    }

    const isAll = period === "all";

    const [
      totalUsers,
      usersInPeriod,
      prevUsersInPeriod,
      totalJobs,
      jobsInPeriod,
      prevJobsInPeriod,
      totalApplications,
      applicationsInPeriod,
      prevApplicationsInPeriod,
      revenueInPeriodAgg,
      prevRevenueInPeriodAgg,
      totalRevenueAgg,
      totalInterviews,
      completedInterviews,
      avgScoreAgg,
      avgDurationAgg,
      topRecruiters,
      jobsWithSkills,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      isAll ? Promise.resolve(0) : prisma.user.count({ where: { createdAt: { gte: prevStartDate, lt: startDate } } }),

      prisma.job.count(),
      prisma.job.count({ where: { createdAt: { gte: startDate } } }),
      isAll ? Promise.resolve(0) : prisma.job.count({ where: { createdAt: { gte: prevStartDate, lt: startDate } } }),

      prisma.application.count(),
      prisma.application.count({ where: { appliedAt: { gte: startDate } } }),
      isAll ? Promise.resolve(0) : prisma.application.count({ where: { appliedAt: { gte: prevStartDate, lt: startDate } } }),

      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "COMPLETED", createdAt: { gte: startDate } },
      }),
      isAll
        ? Promise.resolve({ _sum: { amount: null } })
        : prisma.payment.aggregate({
            _sum: { amount: true },
            where: { status: "COMPLETED", createdAt: { gte: prevStartDate, lt: startDate } },
          }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "COMPLETED" },
      }),

      prisma.interviewSession.count(),
      prisma.interviewSession.count({ where: { status: "COMPLETED" } }),
      prisma.scorecard.aggregate({ _avg: { overallScore: true } }),
      prisma.interviewSession.aggregate({
        _avg: { durationMinutes: true },
        where: { status: "COMPLETED", durationMinutes: { gt: 0 } },
      }),

      prisma.recruiterProfile.findMany({
        take: 5,
        orderBy: { jobs: { _count: "desc" } },
        select: {
          id: true,
          companyName: true,
          _count: { select: { jobs: true } },
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      }),

      prisma.job.findMany({
        select: { requiredSkills: true },
        take: 200,
      }),
    ]);

    const calcGrowth = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 1000) / 10;
    };

    const currentRevenue = Number(revenueInPeriodAgg._sum.amount || 0);
    const prevRevenue = Number(prevRevenueInPeriodAgg._sum.amount || 0);
    const totalRevenue = Number(totalRevenueAgg._sum.amount || 0);

    const userGrowth = calcGrowth(usersInPeriod, prevUsersInPeriod);
    const jobGrowth = calcGrowth(jobsInPeriod, prevJobsInPeriod);
    const appGrowth = calcGrowth(applicationsInPeriod, prevApplicationsInPeriod);
    const revenueGrowth = calcGrowth(currentRevenue, prevRevenue);

    // Build 12-month historical trend
    const monthNames = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
    const fullMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyTrends = [];
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [recentUsers, recentPayments] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.payment.findMany({
        where: { status: "COMPLETED", createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true, amount: true },
      }),
    ]);

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const nextMonth = new Date(year, month + 1, 1);

      const usersCount = recentUsers.filter(
        (u) => u.createdAt >= d && u.createdAt < nextMonth,
      ).length;

      const revenueSum = recentPayments
        .filter((p) => p.createdAt >= d && p.createdAt < nextMonth)
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      monthlyTrends.push({
        label: monthNames[month],
        fullMonth: `${fullMonthNames[month]} ${year}`,
        users: usersCount,
        revenue: Math.round(revenueSum),
      });
    }

    const maxUsers = Math.max(...monthlyTrends.map((t) => t.users), 1);
    const maxRev = Math.max(...monthlyTrends.map((t) => t.revenue), 1);

    const userTrendChart = monthlyTrends.map((t) => ({
      ...t,
      heightPercentage: t.users === 0 ? 8 : Math.max(12, Math.round((t.users / maxUsers) * 100)),
    }));

    const revenueTrendChart = monthlyTrends.map((t) => ({
      ...t,
      heightPercentage: t.revenue === 0 ? 8 : Math.max(12, Math.round((t.revenue / maxRev) * 100)),
    }));

    // Aggregate skills demand from real jobs
    const skillCounts: Record<string, number> = {};
    for (const job of jobsWithSkills) {
      if (Array.isArray(job.requiredSkills)) {
        for (const skill of job.requiredSkills) {
          if (typeof skill === "string" && skill.trim()) {
            const normalized = skill.trim();
            const key = normalized.charAt(0).toUpperCase() + normalized.slice(1);
            skillCounts[key] = (skillCounts[key] || 0) + 1;
          }
        }
      }
    }

    const totalJobsCount = Math.max(totalJobs, 1);
    const sortedSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill, count]) => ({
        skill,
        count,
        demand: Math.min(100, Math.round((count / totalJobsCount) * 100)),
      }));

    const skillsList = sortedSkills.length > 0
      ? sortedSkills
      : [
          { skill: "TypeScript", count: 0, demand: 0 },
          { skill: "React", count: 0, demand: 0 },
          { skill: "Node.js", count: 0, demand: 0 },
          { skill: "Python", count: 0, demand: 0 },
          { skill: "SQL", count: 0, demand: 0 },
        ];

    const companyColors = ["emerald", "orange", "amber", "rose", "indigo"];
    const maxCompanyJobs = Math.max(...topRecruiters.map((r) => r._count.jobs), 1);

    const formattedCompanies = topRecruiters.map((r, i) => {
      const name =
        r.companyName?.trim() ||
        `${r.user?.firstName || ""} ${r.user?.lastName || ""}`.trim() ||
        "Independent Recruiter";
      return {
        id: r.id,
        name,
        jobs: r._count.jobs,
        color: companyColors[i % companyColors.length],
        percentage: Math.round((r._count.jobs / maxCompanyJobs) * 100),
      };
    });

    const interviewSuccessRate = totalInterviews > 0
      ? Math.round((completedInterviews / totalInterviews) * 100)
      : 0;

    const avgScore = avgScoreAgg._avg.overallScore
      ? Math.round(avgScoreAgg._avg.overallScore)
      : 0;

    const candidateRating = avgScore > 0 ? (avgScore / 20).toFixed(1) : "5.0";
    const avgDuration = Math.round(avgDurationAgg._avg.durationMinutes || 0);

    return {
      period,
      summary: {
        users: {
          total: totalUsers,
          inPeriod: usersInPeriod,
          growth: userGrowth,
        },
        jobs: {
          total: totalJobs,
          inPeriod: jobsInPeriod,
          growth: jobGrowth,
        },
        applications: {
          total: totalApplications,
          inPeriod: applicationsInPeriod,
          growth: appGrowth,
        },
        revenue: {
          total: totalRevenue,
          inPeriod: currentRevenue,
          growth: revenueGrowth,
        },
      },
      trends: {
        users: userTrendChart,
        revenue: revenueTrendChart,
      },
      performance: {
        totalInterviews,
        completedInterviews,
        interviewSuccessRate,
        avgDurationMinutes: avgDuration || 15,
        avgOverallScore: avgScore,
        candidateSatisfaction: `${candidateRating}/5`,
      },
      topCompanies: formattedCompanies,
      topSkills: skillsList,
    };
  }
}

export const adminService = new AdminService();

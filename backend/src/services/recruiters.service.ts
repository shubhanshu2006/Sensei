import { prisma } from "../database/client.js";
import { ApiError } from "../utils/ApiError.js";

// Local types

export interface RecruiterProfileUpdate {
  companyName?: string;
  companyWebsite?: string;
  companySize?: string;
  industry?: string;
  designation?: string;
  phoneNumber?: string;
}

// RecruiterService

class RecruiterService {
  /**
   * Returns a recruiter's profile by the owner's User.id, with selected user
   * fields included for display purposes.
   *
   * Throws 404 when no recruiter profile exists for the given userId.
   */
  async getProfile(userId: string) {
    const profile = await prisma.recruiterProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    if (!profile) {
      throw new ApiError(404, "Recruiter profile not found");
    }

    return profile;
  }

  /**
   * Partially updates a recruiter profile by its RecruiterProfile.id.
   * Only provided (non-undefined) fields are written to the database.
   */
  async updateProfile(
    recruiterId: string,
    data: Partial<RecruiterProfileUpdate>,
  ) {
    const profile = await prisma.recruiterProfile.findUnique({
      where: { id: recruiterId },
    });

    if (!profile) {
      throw new ApiError(404, "Recruiter profile not found");
    }

    return prisma.recruiterProfile.update({
      where: { id: recruiterId },
      data,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }

  /**
   * Returns the credit and subscription summary for a recruiter.
   *
   * `creditsRemaining` combines paid interview credits and any unused free-trial
   * credits so the caller receives a single usable number.
   */
  async getCredits(recruiterId: string) {
    const profile = await prisma.recruiterProfile.findUnique({
      where: { id: recruiterId },
      select: {
        interviewCredits: true,
        freeTrialCredits: true,
        freeTrialUsed: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
      },
    });

    if (!profile) {
      throw new ApiError(404, "Recruiter profile not found");
    }

    return {
      interviewCredits: profile.interviewCredits,
      freeTrialCredits: profile.freeTrialCredits,
      freeTrialUsed: profile.freeTrialUsed,
      subscriptionPlan: profile.subscriptionPlan,
      subscriptionStatus: profile.subscriptionStatus,
      subscriptionEndDate: profile.subscriptionEndDate,
      // Unified credit count: paid credits + free-trial credits (if not yet used).
      creditsRemaining:
        profile.interviewCredits +
        (profile.freeTrialUsed ? 0 : profile.freeTrialCredits),
    };
  }

  /**
   * Returns the most recent ACTIVE subscription for a recruiter, or null when
   * the recruiter is on the free tier with no active subscription record.
   */
  async getSubscription(recruiterId: string) {
    const profile = await prisma.recruiterProfile.findUnique({
      where: { id: recruiterId },
    });

    if (!profile) {
      throw new ApiError(404, "Recruiter profile not found");
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        recruiterId,
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
    });

    return subscription;
  }

  /**
   * Aggregates dashboard statistics for a recruiter using a single interactive
   * transaction to guarantee a consistent read.
   *
   * Returns:
   *  - totalJobs / activeJobs: job listing counts
   *  - totalApplications: all applications across the recruiter's jobs
   *  - pendingScreening: applications awaiting or undergoing AI screening
   *  - shortlisted: applications the recruiter has shortlisted
   *  - invitedForInterview: applications at any interview stage
   *  - creditsRemaining: usable interview credits
   */
  async getDashboardStats(recruiterId: string) {
    return prisma.$transaction(async (tx) => {
      const profile = await tx.recruiterProfile.findUnique({
        where: { id: recruiterId },
        select: {
          interviewCredits: true,
          freeTrialCredits: true,
          freeTrialUsed: true,
        },
      });

      if (!profile) {
        throw new ApiError(404, "Recruiter profile not found");
      }

      const [
        totalJobs,
        activeJobs,
        totalApplications,
        pendingScreening,
        shortlisted,
        invitedForInterview,
      ] = await Promise.all([
        tx.job.count({
          where: { recruiterId },
        }),
        tx.job.count({
          where: { recruiterId, status: "ACTIVE" },
        }),
        tx.application.count({
          where: { job: { recruiterId } },
        }),
        tx.application.count({
          where: {
            job: { recruiterId },
            status: { in: ["SUBMITTED", "SCREENING_IN_PROGRESS"] },
          },
        }),
        tx.application.count({
          where: { job: { recruiterId }, status: "SHORTLISTED" },
        }),
        tx.application.count({
          where: {
            job: { recruiterId },
            status: {
              in: [
                "INTERVIEW_INVITED",
                "INTERVIEW_SCHEDULED",
                "INTERVIEW_COMPLETED",
              ],
            },
          },
        }),
      ]);

      const creditsRemaining =
        profile.interviewCredits +
        (profile.freeTrialUsed ? 0 : profile.freeTrialCredits);

      return {
        totalJobs,
        activeJobs,
        totalApplications,
        pendingScreening,
        shortlisted,
        invitedForInterview,
        creditsRemaining,
      };
    });
  }
}

export const recruiterService = new RecruiterService();

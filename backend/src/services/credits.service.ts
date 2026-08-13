import { prisma } from "../database/client.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

// Credit pack constants

/**
 * The four available recruiter credit packs.
 * Prices are in INR; amounts in paise are derived by × 100 for Razorpay use.
 */
export const RECRUITER_CREDIT_PACKS = [
  {
    id: "10",
    credits: 10,
    amountInr: 100,
    currency: "INR",
    label: "10 Interview Credits",
  },
  {
    id: "25",
    credits: 25,
    amountInr: 250,
    currency: "INR",
    label: "25 Interview Credits",
  },
  {
    id: "50",
    credits: 50,
    amountInr: 500,
    currency: "INR",
    label: "50 Interview Credits",
  },
  {
    id: "100",
    credits: 100,
    amountInr: 1000,
    currency: "INR",
    label: "100 Interview Credits",
  },
] as const;

// Interfaces

export interface RecruiterBalance {
  interviewCredits: number;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionEndDate: Date | null;
  freeTrialCredits: number;
  freeTrialUsed: boolean;
}

export interface CandidateBalance {
  practiceCredits: number;
  practiceCreditsUsed: number;
}

export interface PaymentHistoryQuery {
  page: number;
  limit: number;
}

// Service

class CreditsService {
  /**
   * Returns the current credit balance and subscription metadata for a
   * recruiter profile.
   */
  async getRecruiterBalance(recruiterId: string): Promise<RecruiterBalance> {
    const profile = await prisma.recruiterProfile.findUnique({
      where: { id: recruiterId },
      select: {
        interviewCredits: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        freeTrialCredits: true,
        freeTrialUsed: true,
      },
    });

    if (!profile) {
      throw new ApiError(404, "Recruiter profile not found");
    }

    return {
      interviewCredits: profile.interviewCredits,
      subscriptionPlan: profile.subscriptionPlan,
      subscriptionStatus: profile.subscriptionStatus,
      subscriptionEndDate: profile.subscriptionEndDate,
      freeTrialCredits: profile.freeTrialCredits,
      freeTrialUsed: profile.freeTrialUsed,
    };
  }

  /**
   * Deducts 1 interview credit from the recruiter.
   * Called internally by the interview system when a session is started.
   *
   * Transaction: Atomic credit deduction
   * Throws 402 if the recruiter has no remaining credits.
   */
  async deductRecruiterCredit(recruiterId: string): Promise<void> {
    try {
      // Use transaction with Serializable isolation to prevent race conditions
      await prisma.$transaction(
        async (tx) => {
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

          // Calculate total available credits
          const totalCredits =
            profile.interviewCredits +
            (profile.freeTrialUsed ? 0 : profile.freeTrialCredits);

          if (totalCredits <= 0) {
            throw new ApiError(
              402,
              "Insufficient interview credits. Please purchase more credits to start a new interview.",
            );
          }

          // Deduct from paid credits first, then free trial
          // Use updateMany with WHERE condition to prevent negative credits (race condition protection)
          if (profile.interviewCredits > 0) {
            const updated = await tx.recruiterProfile.updateMany({
              where: {
                id: recruiterId,
                interviewCredits: { gt: 0 }, // Atomic constraint
              },
              data: { interviewCredits: { decrement: 1 } },
            });

            if (updated.count === 0) {
              throw new ApiError(
                409,
                "Credit deduction failed due to concurrent modification. Please try again.",
              );
            }
          } else {
            // Use free trial credit
            const updated = await tx.recruiterProfile.updateMany({
              where: {
                id: recruiterId,
                freeTrialCredits: { gt: 0 }, // Atomic constraint
              },
              data: {
                freeTrialCredits: { decrement: 1 },
                freeTrialUsed: profile.freeTrialCredits === 1, // Mark used when last credit consumed
              },
            });

            if (updated.count === 0) {
              throw new ApiError(
                409,
                "Credit deduction failed due to concurrent modification. Please try again.",
              );
            }
          }
        },
        {
          maxWait: 5000,
          timeout: 10000,
          isolationLevel: "Serializable", // Highest isolation level for financial operations
        },
      );

      logger.info("[CreditsService] Credit deducted", { recruiterId });
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("[CreditsService] Failed to deduct credit", {
        recruiterId,
        error,
      });
      throw new ApiError(500, "Failed to deduct interview credit");
    }
  }

  /**
   * Refunds 1 interview credit to the recruiter.
   * Called internally when a session is abandoned before 70% completion.
   *
   * Transaction: Atomic credit refund
   */
  async refundRecruiterCredit(recruiterId: string): Promise<void> {
    try {
      await prisma.$transaction(
        async (tx) => {
          const profile = await tx.recruiterProfile.findUnique({
            where: { id: recruiterId },
            select: { id: true },
          });

          if (!profile) {
            throw new ApiError(404, "Recruiter profile not found");
          }

          await tx.recruiterProfile.update({
            where: { id: recruiterId },
            data: { interviewCredits: { increment: 1 } },
          });
        },
        { maxWait: 5000, timeout: 10000 },
      );

      logger.info("[CreditsService] Credit refunded", { recruiterId });
    } catch (error) {
      logger.error("[CreditsService] Failed to refund credit", {
        recruiterId,
        error,
      });
      throw new ApiError(500, "Failed to refund interview credit");
    }
  }

  /**
   * Returns the current practice-credit balance for a candidate.
   */
  async getCandidateBalance(candidateId: string): Promise<CandidateBalance> {
    const profile = await prisma.candidateProfile.findUnique({
      where: { id: candidateId },
      select: {
        practiceCredits: true,
        practiceCreditsUsed: true,
      },
    });

    if (!profile) {
      throw new ApiError(404, "Candidate profile not found");
    }

    return {
      practiceCredits: profile.practiceCredits,
      practiceCreditsUsed: profile.practiceCreditsUsed,
    };
  }

  /**
   * Deducts 1 practice credit from the candidate and increments the
   * `practiceCreditsUsed` counter.
   *
   * Transaction: Atomic credit deduction
   * Throws 402 if the candidate has no remaining practice credits.
   */
  async deductCandidateCredit(candidateId: string): Promise<void> {
    try {
      await prisma.$transaction(
        async (tx) => {
          const profile = await tx.candidateProfile.findUnique({
            where: { id: candidateId },
            select: { practiceCredits: true, practiceCreditsUsed: true },
          });

          if (!profile) {
            throw new ApiError(404, "Candidate profile not found");
          }

          const remaining =
            profile.practiceCredits - profile.practiceCreditsUsed;

          if (remaining <= 0) {
            throw new ApiError(
              402,
              "Insufficient practice credits. Please purchase more credits to start a new practice session.",
            );
          }

          // Use updateMany with WHERE condition to prevent over-deduction (race condition protection)
          const updated = await tx.candidateProfile.updateMany({
            where: {
              id: candidateId,
              practiceCreditsUsed: { lt: profile.practiceCredits }, // Ensure we don't exceed total credits
            },
            data: {
              practiceCreditsUsed: { increment: 1 },
            },
          });

          if (updated.count === 0) {
            throw new ApiError(
              409,
              "Credit deduction failed due to concurrent modification. Please try again.",
            );
          }
        },
        {
          maxWait: 5000,
          timeout: 10000,
          isolationLevel: "Serializable",
        },
      );

      logger.info("[CreditsService] Practice credit deducted", { candidateId });
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("[CreditsService] Failed to deduct practice credit", {
        candidateId,
        error,
      });
      throw new ApiError(500, "Failed to deduct practice credit");
    }
  }

  /**
   * Returns the static list of available credit packs that recruiters can
   * purchase. No DB call required.
   */
  getCreditPackages() {
    return RECRUITER_CREDIT_PACKS;
  }

  /**
   * Returns a paginated list of payment records for a recruiter.
   */
  async getPaymentHistory(recruiterId: string, query: PaymentHistoryQuery) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [payments, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where: { recruiterId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
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
}

export const creditsService = new CreditsService();

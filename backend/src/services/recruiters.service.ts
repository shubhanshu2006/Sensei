import { prisma } from "../database/client.js";
import { ApiError } from "../utils/ApiError.js";
import { generateSessionToken } from "../utils/crypto.js";
import { emailService } from "./email/EmailService.js";
import { logger } from "../utils/logger.js";

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

  /**
   * Schedules a hiring interview for an application.
   * 
   * Steps:
   * 1. Verify application exists and recruiter owns it
   * 2. Verify application is in valid state (SHORTLISTED or INTERVIEW_INVITED)
   * 3. Atomically deduct credit and create session (transaction)
   * 4. Send email notification to candidate
   */
  async scheduleHiringInterview(
    applicationId: string,
    recruiterId: string,
    scheduledTime: Date,
  ) {
    // 1. Verify application exists and recruiter owns it
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            recruiterId: true,
            recruiter: {
              select: {
                companyName: true,
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
        candidate: {
          select: {
            id: true,
            resumeUrl: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!application) {
      throw new ApiError(404, "Application not found");
    }

    if (application.job.recruiterId !== recruiterId) {
      throw new ApiError(403, "Access denied. You do not own this job.");
    }

    // 2. Verify application is in valid state
    const validStatuses = ["SHORTLISTED", "INTERVIEW_INVITED"];
    if (!validStatuses.includes(application.status)) {
      throw new ApiError(
        400,
        `Cannot schedule interview for application with status: ${application.status}. Application must be SHORTLISTED or INTERVIEW_INVITED.`,
      );
    }

    // 3. Verify candidate has resume
    if (!application.candidate.resumeUrl) {
      throw new ApiError(
        400,
        "Cannot schedule interview. Candidate has not uploaded a resume.",
      );
    }

    const resumeUrl = application.candidate.resumeUrl;

    // 4. Atomically deduct credit and create session
    try {
      const session = await prisma.$transaction(
        async (tx) => {
          // Deduct recruiter credit (uses atomic check in creditsService)
          // We call this directly instead of using creditsService to stay in transaction
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

          const totalCredits =
            profile.interviewCredits +
            (profile.freeTrialUsed ? 0 : profile.freeTrialCredits);

          if (totalCredits <= 0) {
            throw new ApiError(
              402,
              "Insufficient interview credits. Please purchase more credits to schedule an interview.",
            );
          }

          // Deduct from paid credits first, then free trial
          if (profile.interviewCredits > 0) {
            const updated = await tx.recruiterProfile.updateMany({
              where: {
                id: recruiterId,
                interviewCredits: { gt: 0 },
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
            const updated = await tx.recruiterProfile.updateMany({
              where: {
                id: recruiterId,
                freeTrialCredits: { gt: 0 },
              },
              data: {
                freeTrialCredits: { decrement: 1 },
                freeTrialUsed:
                  profile.freeTrialCredits === 1
                    ? true
                    : profile.freeTrialUsed,
              },
            });

            if (updated.count === 0) {
              throw new ApiError(
                409,
                "Credit deduction failed due to concurrent modification. Please try again.",
              );
            }
          }

          // Create InterviewSession
          const newSession = await tx.interviewSession.create({
            data: {
              interviewType: "HIRING",
              applicationId,
              candidateId: application.candidate.id,
              status: "SCHEDULED",
              sessionToken: generateSessionToken(),
              resumeUrl: resumeUrl,
              jobDescription: application.job.description,
              scheduledAt: scheduledTime,
            },
            select: {
              id: true,
              sessionToken: true,
              status: true,
              interviewType: true,
              applicationId: true,
              resumeUrl: true,
              jobDescription: true,
              scheduledAt: true,
              createdAt: true,
            },
          });

          // Update application status to INTERVIEW_SCHEDULED
          await tx.application.update({
            where: { id: applicationId },
            data: { status: "INTERVIEW_SCHEDULED" },
          });

          return newSession;
        },
        {
          maxWait: 5000,
          timeout: 10000,
          isolationLevel: "Serializable",
        },
      );

      // 5. Send email notification to candidate
      try {
        const interviewLink = `${process.env.FRONTEND_URL}/interviews/${session.sessionToken}`;
        
        await emailService.sendEmail({
          to: application.candidate.user.email,
          subject: `Interview Scheduled - ${application.job.title} at ${application.job.recruiter.companyName}`,
          htmlBody: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Interview Scheduled</h2>
  <p>Hello ${application.candidate.user.firstName},</p>
  <p>Your interview has been scheduled!</p>
  <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0;"><strong>Company:</strong> ${application.job.recruiter.companyName}</p>
    <p style="margin: 10px 0 0 0;"><strong>Position:</strong> ${application.job.title}</p>
    <p style="margin: 10px 0 0 0;"><strong>Scheduled Time:</strong> ${scheduledTime.toLocaleString()}</p>
  </div>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${interviewLink}" style="background-color: #4F46E5; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Join Interview
    </a>
  </div>
  <p><strong>Important:</strong> Please join the interview at the scheduled time. Make sure you're in a quiet environment with a stable internet connection.</p>
  <p>Best regards,<br>The Sensei Team</p>
</div>
          `,
          textBody: `
Hello ${application.candidate.user.firstName},

Your interview has been scheduled!

Company: ${application.job.recruiter.companyName}
Position: ${application.job.title}
Scheduled Time: ${scheduledTime.toLocaleString()}

Interview Link: ${interviewLink}

Please use the link above to join the interview at the scheduled time.

Best regards,
Sensei Team
          `,
        });
      } catch (emailError) {
        // Email failure should not fail the entire operation
        logger.error("[RecruiterService] Failed to send interview invitation email", {
          applicationId,
          error: emailError,
        });
      }

      logger.info(
        `[RecruiterService] Hiring interview scheduled: ${session.id} for application ${applicationId}`,
      );

      return session;
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("[RecruiterService] Failed to schedule hiring interview", {
        applicationId,
        recruiterId,
        error,
      });
      throw new ApiError(500, "Failed to schedule interview");
    }
  }
}

export const recruiterService = new RecruiterService();

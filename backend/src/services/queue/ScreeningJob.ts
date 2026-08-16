import { Queue, Worker, Job } from "bullmq";
import { connection } from "./index.js";
import { prisma } from "../../database/client.js";
import { aiEngine } from "../ai/AIEngine.js";
import { logger } from "../../utils/logger.js";
import { queueEmail } from "./EmailJob.js";

// ScreeningJob - Background processing for AI resume screening
//
// Triggered when: Recruiter triggers screening for an application
//
// Processing steps:
// 1. Fetch application and job details
// 2. Call AI Engine to analyze resume + GitHub
// 3. Create ScreeningReport with AI recommendations
// 4. Update Application status
// 5. Send notification emails
//
// Queue name: 'screening'
// Concurrency: 5 workers (AI calls are slow)
// Retry: 3 attempts with exponential backoff

export interface ScreeningJobData {
  applicationId: string;
  resumeUrl: string;
  githubUrl?: string;
  jobId: string;
  jobTitle: string;
  jobDescription: string;
  requiredSkills: string[];
  experienceLevel: string;
}

export const screeningQueue = new Queue("screening", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000, // 2s, 4s, 8s
    },
    removeOnComplete: {
      age: 86400, // Keep for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 604800, // Keep for 7 days
    },
  },
});

export const screeningWorker = new Worker<ScreeningJobData>(
  "screening",
  async (job: Job<ScreeningJobData>) => {
    const {
      applicationId,
      resumeUrl,
      githubUrl,
      jobTitle,
      jobDescription,
      requiredSkills,
      experienceLevel,
    } = job.data;

    logger.info("[ScreeningJob] Starting screening", {
      jobId: job.id,
      applicationId,
    });

    try {
      // Step 1: Verify application still needs screening
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        select: {
          id: true,
          status: true,
          candidate: {
            select: {
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          job: {
            select: {
              recruiter: {
                select: {
                  user: {
                    select: {
                      email: true,
                      firstName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!application) {
        throw new Error(`Application ${applicationId} not found`);
      }

      if (application.status !== "SCREENING_IN_PROGRESS") {
        logger.warn("[ScreeningJob] Application status changed, skipping", {
          applicationId,
          status: application.status,
        });
        return { skipped: true, reason: "Status changed" };
      }

      // Step 2: Call AI Engine for screening analysis
      logger.info("[ScreeningJob] Calling AI Engine for screening");

      const screeningResult = await aiEngine.screenCandidate({
        resumeUrl,
        githubUrl,
        jobDescription,
        jobTitle,
        requiredSkills,
        experienceLevel,
      });

      // Step 3: Map decision to enum value
      let decision:
        "STRONG_MATCH" | "MODERATE_MATCH" | "WEAK_MATCH" | "NOT_SUITABLE";

      if (screeningResult.overallMatchScore >= 85) {
        decision = "STRONG_MATCH";
      } else if (screeningResult.overallMatchScore >= 70) {
        decision = "MODERATE_MATCH";
      } else if (screeningResult.overallMatchScore >= 50) {
        decision = "WEAK_MATCH";
      } else {
        decision = "NOT_SUITABLE";
      }

      // Step 4: Create ScreeningReport and update Application atomically
      await prisma.$transaction(async (tx) => {
        // Create screening report
        await tx.screeningReport.create({
          data: {
            applicationId,
            overallMatchScore: screeningResult.overallMatchScore,
            decision,
            skillMatchAnalysis: {
              analysis: screeningResult.skillMatchAnalysis,
            },
            experienceAnalysis: {
              analysis: screeningResult.experienceAnalysis,
            },
            projectRelevance: {
              analysis: screeningResult.projectRelevance,
            },
            resumeCredibility: {
              analysis: screeningResult.resumeCredibility,
            },
            aiRecommendation: screeningResult.aiRecommendation,
            screeningFeedback: screeningResult.screeningFeedback,
            processingTimeMs: screeningResult.processingTimeMs,
          },
        });

        // Update application status
        await tx.application.update({
          where: { id: applicationId },
          data: {
            status: "SCREENING_COMPLETED",
            screeningCompletedAt: new Date(),
          },
        });
      });

      logger.info("[ScreeningJob] Screening completed", {
        jobId: job.id,
        applicationId,
        score: screeningResult.overallMatchScore,
        decision,
      });

      // Step 5: Queue notification emails (non-blocking)
      try {
        // Email to recruiter
        await queueEmail("screening-completed-recruiter", {
          recruiterEmail: application.job.recruiter.user.email,
          recruiterName:
            application.job.recruiter.user.firstName || "Recruiter",
          candidateName: `${application.candidate.user.firstName} ${application.candidate.user.lastName}`,
          jobTitle,
          score: screeningResult.overallMatchScore,
          decision,
          applicationId,
        });

        // Email to candidate (if rejected)
        if (decision === "NOT_SUITABLE" || decision === "WEAK_MATCH") {
          await queueEmail("screening-completed-candidate", {
            candidateEmail: application.candidate.user.email,
            candidateName: `${application.candidate.user.firstName} ${application.candidate.user.lastName}`,
            jobTitle,
            feedback: screeningResult.screeningFeedback,
          });
        }
      } catch (emailError) {
        logger.error("[ScreeningJob] Failed to queue emails", {
          applicationId,
          error: emailError,
        });
        // Don't fail the job if email queueing fails
      }

      return {
        success: true,
        applicationId,
        score: screeningResult.overallMatchScore,
        decision,
      };
    } catch (error) {
      logger.error("[ScreeningJob] Screening failed", {
        jobId: job.id,
        applicationId,
        error,
      });

      // Update application to SUBMITTED so recruiter can retry
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: "SUBMITTED" },
      });

      throw error; // Will trigger retry
    }
  },
  {
    connection,
    concurrency: 5, // Process 5 screenings in parallel
  },
);

screeningWorker.on("completed", (job) => {
  logger.info("[ScreeningJob] Job completed", {
    jobId: job.id,
    duration: Date.now() - job.processedOn!,
  });
});

screeningWorker.on("failed", (job, err) => {
  logger.error("[ScreeningJob] Job failed", {
    jobId: job?.id,
    error: err.message,
    attempts: job?.attemptsMade,
  });
});

screeningWorker.on("stalled", (jobId) => {
  logger.warn("[ScreeningJob] Job stalled", { jobId });
});

export const queueScreening = async (data: ScreeningJobData) => {
  const job = await screeningQueue.add("screen-application", data, {
    jobId: `screen-${data.applicationId}`, // Idempotent
  });

  logger.info("[ScreeningJob] Job queued", {
    jobId: job.id,
    applicationId: data.applicationId,
  });

  return job;
};

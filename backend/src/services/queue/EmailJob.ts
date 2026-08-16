import { Queue, Worker, Job } from "bullmq";
import { connection } from "./index.js";
import { emailService } from "../email/EmailService.js";
import { logger } from "../../utils/logger.js";

// EmailJob - Background email sending
//
// Prevents blocking HTTP requests with slow SMTP operations.
//
// Email types:
// - interview-invitation
// - interview-completed
// - payment-confirmation
// - credit-low-warning
//
// Queue name: 'email'
// Concurrency: 5 workers
// Retry: 3 attempts

export type EmailJobType =
  | "interview-invitation"
  | "interview-completed"
  | "payment-confirmation"
  | "credit-low-warning"
  | "screening-completed-recruiter"
  | "screening-completed-candidate";

export interface EmailJobData {
  type: EmailJobType;
  data: Record<string, any>;
}

export const emailQueue = new Queue("email", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: {
      age: 86400, // 24 hours
      count: 500,
    },
    removeOnFail: {
      age: 604800, // 7 days
    },
  },
});

export const emailWorker = new Worker<EmailJobData>(
  "email",
  async (job: Job<EmailJobData>) => {
    const { type, data } = job.data;

    logger.info("[EmailJob] Processing email", {
      jobId: job.id,
      type,
      recipient: data.candidateEmail || data.recruiterEmail,
    });

    try {
      switch (type) {
        case "interview-invitation":
          await emailService.sendInterviewInvitation({
            candidateEmail: data.candidateEmail,
            candidateName: data.candidateName,
            jobTitle: data.jobTitle,
            companyName: data.companyName,
            interviewLink: data.interviewLink,
          });
          break;

        case "interview-completed":
          await emailService.sendInterviewCompleted({
            candidateEmail: data.candidateEmail,
            candidateName: data.candidateName,
            jobTitle: data.jobTitle,
            resultsLink: data.resultsLink,
          });
          break;

        case "payment-confirmation":
          await emailService.sendPaymentConfirmation({
            recruiterEmail: data.recruiterEmail,
            recruiterName: data.recruiterName,
            credits: data.credits,
            amountPaid: data.amountPaid,
          });
          break;

        case "credit-low-warning":
          await emailService.sendCreditLowWarning({
            recruiterEmail: data.recruiterEmail,
            recruiterName: data.recruiterName,
            creditsRemaining: data.creditsRemaining,
          });
          break;

        case "screening-completed-recruiter":
          await emailService.sendScreeningCompletedRecruiter({
            recruiterEmail: data.recruiterEmail,
            recruiterName: data.recruiterName,
            candidateName: data.candidateName,
            jobTitle: data.jobTitle,
            score: data.score,
            decision: data.decision,
            applicationId: data.applicationId,
          });
          break;

        case "screening-completed-candidate":
          await emailService.sendScreeningCompletedCandidate({
            candidateEmail: data.candidateEmail,
            candidateName: data.candidateName,
            jobTitle: data.jobTitle,
            feedback: data.feedback,
          });
          break;

        default:
          throw new Error(`Unknown email type: ${type}`);
      }

      logger.info("[EmailJob] Email sent successfully", {
        jobId: job.id,
        type,
      });

      return { success: true };
    } catch (error) {
      logger.error("[EmailJob] Failed to send email", {
        jobId: job.id,
        type,
        error,
      });
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
  },
);

emailWorker.on("completed", (job) => {
  logger.info("[EmailJob] Job completed", { jobId: job.id });
});

emailWorker.on("failed", (job, err) => {
  logger.error("[EmailJob] Job failed", {
    jobId: job?.id,
    error: err.message,
    attempts: job?.attemptsMade,
  });
});

export const queueEmail = async (
  type: EmailJobType,
  data: Record<string, any>,
) => {
  const job = await emailQueue.add(type, { type, data });

  logger.info("[EmailJob] Email queued", {
    jobId: job.id,
    type,
  });

  return job;
};

import { prisma } from "../database/client.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { screeningQueue } from "./queue/ScreeningJob.js";

// ScreeningService - AI-powered resume screening
// Triggers background screening jobs via BullMQ for async processing.
// Worker processes the job, generates ScreeningReport, and updates Application.

export class ScreeningService {
  /**
   * Marks an application as SCREENING_IN_PROGRESS and queues the AI job.
   *
   * Guards:
   * - Application must exist.
   * - Recruiter must own the parent job.
   *
   * The actual screening is processed asynchronously by ScreeningJob worker.
   */
  async triggerScreening(applicationId: string, recruiterId: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            id: true,
            recruiterId: true,
            title: true,
            description: true,
            requiredSkills: true,
            experienceLevel: true,
          },
        },
      },
    });

    if (!application) throw new ApiError(404, "Application not found");

    if (application.job.recruiterId !== recruiterId) {
      throw new ApiError(403, "Access denied. You do not own this job.");
    }

    // Prevent re-triggering if already in progress or completed
    if (
      application.status === "SCREENING_IN_PROGRESS" ||
      application.status === "SCREENING_COMPLETED"
    ) {
      throw new ApiError(
        409,
        `Screening is already ${application.status === "SCREENING_IN_PROGRESS" ? "in progress" : "completed"} for this application`,
      );
    }

    // Update status to IN_PROGRESS
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: "SCREENING_IN_PROGRESS" },
    });

    // Queue the screening job for background processing
    const job = await screeningQueue.add(
      "screen-application",
      {
        applicationId,
        resumeUrl: application.resumeUrl,
        githubUrl: application.githubUrl,
        jobId: application.jobId,
        jobTitle: application.job.title,
        jobDescription: application.job.description,
        requiredSkills: application.job.requiredSkills,
        experienceLevel: application.job.experienceLevel,
      },
      {
        jobId: `screen-${applicationId}`, // Idempotent job ID
      },
    );

    logger.info(
      `[ScreeningService] Screening job queued: ${job.id} for application ${applicationId}`,
    );

    return {
      queued: true,
      applicationId,
      jobId: job.id,
    };
  }

  /**
   * Returns the screening report for an application.
   *
   * Access rules:
   * - RECRUITER: must own the parent job.
   * - CANDIDATE: must be the applicant.
   * - PLATFORM_ADMIN: unrestricted access.
   */
  async getScreeningReport(
    applicationId: string,
    requesterId: string,
    role: string,
  ) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: { select: { recruiterId: true } },
        screeningReport: true,
      },
    });

    if (!application) throw new ApiError(404, "Application not found");

    // Role-based access control
    if (role === "RECRUITER") {
      if (application.job.recruiterId !== requesterId) {
        throw new ApiError(403, "Access denied");
      }
    } else if (role === "CANDIDATE") {
      if (application.candidateId !== requesterId) {
        throw new ApiError(403, "Access denied");
      }
    } else if (role !== "PLATFORM_ADMIN") {
      throw new ApiError(403, "Access denied");
    }

    if (!application.screeningReport) {
      throw new ApiError(
        404,
        "Screening report is not yet available for this application. Please check back after screening completes.",
      );
    }

    return application.screeningReport;
  }
}

export const screeningService = new ScreeningService();

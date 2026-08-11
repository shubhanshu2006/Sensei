import { prisma } from "../database/client.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import type {
  ApplyForJobDTO,
  ApplicationQuery,
  RecruiterApplicationQuery,
  UpdateApplicationStatusDTO,
} from "../validations/applications.validation.js";

// Pagination helper

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

function buildPagination(
  total: number,
  page: number,
  limit: number,
): Pagination {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// Statuses that indicate an interview is already in progress or done;
// candidates cannot withdraw from these states.
const NON_WITHDRAWABLE_STATUSES = [
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_COMPLETED",
] as const;

// ApplicationService
export class ApplicationService {
  // Candidate methods

  /**
   * Submits a new application for the given job.
   *
   * Guards:
   * - Job must exist and be ACTIVE.
   * - Candidate must not have already applied (@@unique [jobId, candidateId]).
   */
  async applyForJob(candidateId: string, jobId: string, data: ApplyForJobDTO) {
    // 1. Verify job exists and is accepting applications
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, status: true, title: true },
    });

    if (!job) throw new ApiError(404, "Job not found");

    if (job.status !== "ACTIVE") {
      throw new ApiError(
        400,
        "This job is not currently accepting applications",
      );
    }

    // 2. Prevent duplicate applications
    const existing = await prisma.application.findUnique({
      where: { jobId_candidateId: { jobId, candidateId } },
      select: { id: true },
    });

    if (existing) {
      throw new ApiError(409, "You have already applied for this job");
    }

    // 3. Create the application
    const application = await prisma.application.create({
      data: {
        jobId,
        candidateId,
        resumeUrl: data.resumeUrl,
        coverLetter: data.coverLetter,
        githubUrl: data.githubUrl,
        portfolioUrl: data.portfolioUrl,
        status: "SUBMITTED",
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            jobType: true,
            experienceLevel: true,
            recruiter: {
              select: { companyName: true, industry: true },
            },
          },
        },
      },
    });

    logger.info(
      `[ApplicationService] Application submitted: ${application.id} — candidate ${candidateId} → job ${jobId}`,
    );

    return application;
  }

  /**
   * Returns a paginated list of the candidate's own applications.
   * Optionally filtered by status.
   */
  async getCandidateApplications(candidateId: string, query: ApplicationQuery) {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where = {
      candidateId,
      ...(status ? { status } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appliedAt: "desc" },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              location: true,
              jobType: true,
              experienceLevel: true,
              status: true,
              recruiter: {
                select: {
                  companyName: true,
                  industry: true,
                  companyWebsite: true,
                },
              },
            },
          },
          screeningReport: {
            select: { overallMatchScore: true, decision: true },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    return { data, pagination: buildPagination(total, page, limit) };
  }

  /**
   * Returns a single application visible to the candidate who owns it.
   * Includes limited screening feedback (the candidate-facing portion only).
   */
  async getCandidateApplicationById(
    applicationId: string,
    candidateId: string,
  ) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            jobType: true,
            experienceLevel: true,
            salary: true,
            status: true,
            recruiter: {
              select: {
                companyName: true,
                companyWebsite: true,
                industry: true,
              },
            },
          },
        },
        screeningReport: {
          select: {
            overallMatchScore: true,
            decision: true,
            // screeningFeedback is shared with candidate once screening completes
            screeningFeedback: true,
          },
        },
      },
    });

    if (!application) throw new ApiError(404, "Application not found");

    if (application.candidateId !== candidateId) {
      throw new ApiError(403, "Access denied");
    }

    return application;
  }

  /**
   * Sets application status to WITHDRAWN.
   * Rejected if the interview has already been scheduled or completed.
   */
  async withdrawApplication(applicationId: string, candidateId: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { id: true, candidateId: true, status: true },
    });

    if (!application) throw new ApiError(404, "Application not found");
    if (application.candidateId !== candidateId)
      throw new ApiError(403, "Access denied");

    if (application.status === "WITHDRAWN") {
      throw new ApiError(400, "Application has already been withdrawn");
    }

    if (
      (NON_WITHDRAWABLE_STATUSES as readonly string[]).includes(
        application.status,
      )
    ) {
      throw new ApiError(
        400,
        "Cannot withdraw application once an interview has been scheduled or completed",
      );
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { status: "WITHDRAWN" },
    });

    logger.info(`[ApplicationService] Application withdrawn: ${applicationId}`);
    return updated;
  }

  // -------------------------------------------------------------------------
  // Recruiter methods
  // -------------------------------------------------------------------------

  /**
   * Returns a paginated list of applications for a specific job.
   * Verifies the recruiter owns the job before returning data.
   * Supports sorting by appliedAt or screeningReport score.
   */
  async getRecruiterJobApplications(
    jobId: string,
    recruiterId: string,
    query: RecruiterApplicationQuery,
  ) {
    const { page, limit, status, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    // Ownership check
    const job = await prisma.job.findFirst({
      where: { id: jobId, recruiterId },
      select: { id: true },
    });

    if (!job) throw new ApiError(404, "Job not found or access denied");

    const where = {
      jobId,
      ...(status ? { status } : {}),
    };

    // Prisma supports ordering by a relation field
    const orderBy =
      sortBy === "score"
        ? {
            screeningReport: { overallMatchScore: sortOrder as "asc" | "desc" },
          }
        : { appliedAt: sortOrder as "asc" | "desc" };

    const [data, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          candidate: {
            select: {
              id: true,
              experience: true,
              currentCompany: true,
              currentDesignation: true,
              location: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
          screeningReport: {
            select: { overallMatchScore: true, decision: true },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    return { data, pagination: buildPagination(total, page, limit) };
  }

  /**
   * Returns full application detail for recruiter review.
   * Includes candidate profile (excluding private resume feedback)
   * and the complete screening report.
   */
  async getRecruiterApplicationById(
    applicationId: string,
    recruiterId: string,
  ) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            recruiterId: true,
            experienceLevel: true,
            location: true,
            jobType: true,
          },
        },
        candidate: {
          select: {
            id: true,
            phoneNumber: true,
            location: true,
            experience: true,
            currentCompany: true,
            currentDesignation: true,
            githubUrl: true,
            portfolioUrl: true,
            linkedinUrl: true,
            // resumeUrl is intentionally excluded here — access is controlled
            // via a separate download endpoint with presigned URLs.
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        screeningReport: {
          select: {
            id: true,
            overallMatchScore: true,
            decision: true,
            skillMatchAnalysis: true,
            experienceAnalysis: true,
            projectRelevance: true,
            resumeCredibility: true,
            aiRecommendation: true,
            processingTimeMs: true,
            createdAt: true,
            // screeningFeedback is the candidate-facing portion; recruiters
            // instead receive the full aiRecommendation above.
          },
        },
      },
    });

    if (!application) throw new ApiError(404, "Application not found");

    if (application.job.recruiterId !== recruiterId) {
      throw new ApiError(403, "Access denied");
    }

    return application;
  }

  /**
   * Updates an application's status to one of the recruiter-permitted values:
   * SHORTLISTED, REJECTED, or INTERVIEW_INVITED.
   *
   * Sets interviewInvitedAt automatically when status = INTERVIEW_INVITED.
   */
  async updateApplicationStatus(
    applicationId: string,
    recruiterId: string,
    dto: UpdateApplicationStatusDTO,
  ) {
    // Verify application exists and recruiter owns the parent job
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: { select: { recruiterId: true } } },
    });

    if (!application) throw new ApiError(404, "Application not found");

    if (application.job.recruiterId !== recruiterId) {
      throw new ApiError(403, "Access denied");
    }

    const now = new Date();

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: dto.status,
        ...(dto.status === "INTERVIEW_INVITED"
          ? { interviewInvitedAt: now }
          : {}),
      },
    });

    logger.info(
      `[ApplicationService] Application ${applicationId} status → ${dto.status} (recruiter: ${recruiterId})`,
    );

    return updated;
  }
}

export const applicationService = new ApplicationService();

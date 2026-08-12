import { prisma } from "../database/client.js";
import { ApiError } from "../utils/ApiError.js";
import { generateSessionToken } from "../utils/crypto.js";
import { logger } from "../utils/logger.js";
import { creditsService } from "./credits.service.js";
import type {
  CreatePracticeJobDTO,
  UpdatePracticeJobDTO,
  PracticeQuery,
} from "../validations/practice.validation.js";

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

// PracticeService

export class PracticeService {
  // Public / guest methods

  /**
   * Returns a paginated list of PUBLISHED practice jobs.
   * Supports filtering by category, difficulty, isFeatured, and free-text
   * search on title.  Sorted by isFeatured desc, then createdAt desc.
   */
  async getPracticeJobs(query: PracticeQuery) {
    const { page, limit, category, difficulty, search, isFeatured } = query;
    const skip = (page - 1) * limit;

    const where = {
      isPublished: true,
      ...(category !== undefined ? { category } : {}),
      ...(difficulty !== undefined ? { difficulty } : {}),
      ...(isFeatured !== undefined ? { isFeatured } : {}),
      ...(search
        ? { title: { contains: search, mode: "insensitive" as const } }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.practiceJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          difficulty: true,
          requiredSkills: true,
          technologies: true,
          estimatedDuration: true,
          isFeatured: true,
          practiceCount: true,
          averageScore: true,
          createdAt: true,
        },
      }),
      prisma.practiceJob.count({ where }),
    ]);

    return { data, pagination: buildPagination(total, page, limit) };
  }

  /**
   * Returns a single published practice job or throws 404.
   */
  async getPracticeJobById(id: string) {
    const job = await prisma.practiceJob.findUnique({ where: { id } });

    if (!job || !job.isPublished) {
      throw new ApiError(404, "Practice job not found");
    }

    return job;
  }

  // Admin methods

  /**
   * Creates a new practice job.  Published by default.
   */
  async createPracticeJob(data: CreatePracticeJobDTO) {
    const job = await prisma.practiceJob.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        difficulty: data.difficulty,
        requiredSkills: data.requiredSkills,
        technologies: data.technologies ?? [],
        estimatedDuration: data.estimatedDuration,
        isFeatured: data.isFeatured ?? false,
        isPublished: true,
      },
    });

    logger.info(
      `[PracticeService] Practice job created: ${job.id} — "${job.title}"`,
    );
    return job;
  }

  /**
   * Updates an existing practice job.
   */
  async updatePracticeJob(id: string, data: UpdatePracticeJobDTO) {
    const existing = await prisma.practiceJob.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Practice job not found");

    const job = await prisma.practiceJob.update({ where: { id }, data });
    return job;
  }

  /**
   * Permanently deletes a practice job.
   */
  async deletePracticeJob(id: string): Promise<void> {
    const existing = await prisma.practiceJob.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new ApiError(404, "Practice job not found");

    await prisma.practiceJob.delete({ where: { id } });
    logger.info(`[PracticeService] Practice job deleted: ${id}`);
  }

  /**
   * Toggles the isFeatured flag on a practice job.
   */
  async toggleFeatured(id: string) {
    const existing = await prisma.practiceJob.findUnique({
      where: { id },
      select: { isFeatured: true },
    });
    if (!existing) throw new ApiError(404, "Practice job not found");

    const job = await prisma.practiceJob.update({
      where: { id },
      data: { isFeatured: !existing.isFeatured },
    });

    return job;
  }

  // Candidate methods

  /**
   * Creates a practice InterviewSession for a candidate.
   *
   * Steps:
   * 1. Verify the practice job exists and is published.
   * 2. Fetch candidate profile and resolve resume URL.
   * 3. Atomically deduct credit and create session (transaction).
   * 4. Optionally increment practiceCount for analytics.
   */
  async startPracticeInterview(
    candidateProfileId: string,
    practiceJobId: string,
    resumeUrlOverride?: string,
  ) {
    // 1. Practice job must exist and be published
    const practiceJob = await prisma.practiceJob.findUnique({
      where: { id: practiceJobId },
      select: { id: true, title: true, description: true, isPublished: true },
    });

    if (!practiceJob || !practiceJob.isPublished) {
      throw new ApiError(404, "Practice job not found");
    }

    // 2. Candidate profile must exist and have resume
    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: candidateProfileId },
      select: { 
        id: true, 
        practiceCredits: true, 
        practiceCreditsUsed: true,
        resumeUrl: true 
      },
    });

    if (!candidate) {
      throw new ApiError(404, "Candidate profile not found");
    }

    // Check if candidate has available credits (total - used)
    const availableCredits = candidate.practiceCredits - candidate.practiceCreditsUsed;
    if (availableCredits <= 0) {
      throw new ApiError(
        402, 
        "Insufficient practice credits. Please purchase more credits to start a practice session."
      );
    }

    // Resolve resume URL
    const sessionResumeUrl = resumeUrlOverride ?? candidate.resumeUrl;
    if (!sessionResumeUrl) {
      throw new ApiError(
        400,
        "A resume is required to start a practice interview. Please upload your resume first.",
      );
    }

    // 3. Atomically deduct credit and create session in a transaction
    try {
      const session = await prisma.$transaction(async (tx) => {
        // Deduct practice credit using creditsService pattern
        // This ensures atomic credit deduction with race condition protection
        const updated = await tx.candidateProfile.updateMany({
          where: { 
            id: candidateProfileId,
            practiceCreditsUsed: { lt: candidate.practiceCredits }, // Atomic constraint
          },
          data: {
            practiceCreditsUsed: { increment: 1 },
          },
        });

        if (updated.count === 0) {
          throw new ApiError(
            409, 
            'Credit deduction failed due to concurrent modification. Please try again.'
          );
        }

        // Create the InterviewSession
        const newSession = await tx.interviewSession.create({
          data: {
            interviewType: "PRACTICE",
            candidateId: candidateProfileId,
            practiceJobId,
            status: "SCHEDULED",
            sessionToken: generateSessionToken(),
            resumeUrl: sessionResumeUrl,
            jobDescription: practiceJob.description,
            scheduledAt: new Date(),
          },
          select: {
            id: true,
            sessionToken: true,
            status: true,
            interviewType: true,
            practiceJobId: true,
            resumeUrl: true,
            jobDescription: true,
            scheduledAt: true,
            createdAt: true,
          },
        });

        // 4. Increment practiceCount for analytics (optional but useful)
        await tx.practiceJob.update({
          where: { id: practiceJobId },
          data: { practiceCount: { increment: 1 } },
        });

        return newSession;
      }, {
        maxWait: 5000,
        timeout: 10000,
        isolationLevel: 'Serializable', // Highest isolation for credit operations
      });

      logger.info(
        `[PracticeService] Practice session created: ${session.id} for candidate ${candidateProfileId} (job: ${practiceJobId})`,
      );

      return session;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      
      logger.error('[PracticeService] Failed to create practice session', {
        candidateId: candidateProfileId,
        practiceJobId,
        error,
      });
      throw new ApiError(500, 'Failed to create practice interview session');
    }
  }
}

export const practiceService = new PracticeService();

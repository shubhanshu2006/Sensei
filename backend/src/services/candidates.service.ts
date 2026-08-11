import { prisma } from "../database/client.js";
import { ApiError } from "../utils/ApiError.js";

// Local type aliases — mirror the Prisma schema enums so we avoid importing
// from the generated client (which requires `prisma generate` to be run).
type ApplicationStatus =
  | "SUBMITTED"
  | "SCREENING_IN_PROGRESS"
  | "SCREENING_COMPLETED"
  | "SHORTLISTED"
  | "REJECTED"
  | "INTERVIEW_INVITED"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_COMPLETED"
  | "WITHDRAWN";

// DTO / parameter types
export interface CandidateUpdateData {
  phoneNumber?: string;
  location?: string;
  experience?: number;
  currentCompany?: string;
  currentDesignation?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Active application statuses (applications that are "in-flight")

const ACTIVE_APPLICATION_STATUSES: ApplicationStatus[] = [
  "SUBMITTED",
  "SCREENING_IN_PROGRESS",
  "SHORTLISTED",
  "INTERVIEW_INVITED",
  "INTERVIEW_SCHEDULED",
];

// CandidateService

export class CandidateService {
  // getProfile
  // Returns the CandidateProfile including the parent User fields.

  async getProfile(userId: string) {
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!profile) {
      throw new ApiError(404, "Candidate profile not found");
    }

    return profile;
  }

  // updateProfile
  // Updates the mutable fields on the CandidateProfile.

  async updateProfile(candidateId: string, data: CandidateUpdateData) {
    const profile = await prisma.candidateProfile.update({
      where: { id: candidateId },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    return profile;
  }

  // updateResumeInfo
  // Called by the frontend after the file has been uploaded directly to S3.
  // Stores the resulting URL, original filename, and upload timestamp.

  async updateResumeInfo(
    candidateId: string,
    resumeUrl: string,
    fileName: string,
  ) {
    const profile = await prisma.candidateProfile.update({
      where: { id: candidateId },
      data: {
        resumeUrl,
        resumeFileName: fileName,
        resumeUploadedAt: new Date(),
      },
      select: {
        id: true,
        resumeUrl: true,
        resumeFileName: true,
        resumeUploadedAt: true,
      },
    });

    return profile;
  }

  // getPracticeCredits
  // Returns credit balances for the candidate dashboard / credit display.

  async getPracticeCredits(candidateId: string) {
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
      creditsRemaining: profile.practiceCredits - profile.practiceCreditsUsed,
    };
  }

  // getInterviewHistory
  // Returns paginated interview sessions for a candidate, covering both
  // PRACTICE sessions (candidateId foreign key) and HIRING sessions
  // (linked through the Application record).

  async getInterviewHistory(
    candidateId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<unknown>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Match both practice sessions (direct candidateId) and
    // hiring sessions (through application -> candidateId).
    const where = {
      OR: [{ candidateId }, { application: { candidateId } }],
    };

    const [total, sessions] = await Promise.all([
      prisma.interviewSession.count({ where }),
      prisma.interviewSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          // Practice interview context
          practiceJob: {
            select: {
              id: true,
              title: true,
              category: true,
              difficulty: true,
              estimatedDuration: true,
            },
          },
          // Hiring interview context
          application: {
            select: {
              id: true,
              status: true,
              appliedAt: true,
              job: {
                select: {
                  id: true,
                  title: true,
                  location: true,
                  jobType: true,
                  experienceLevel: true,
                  recruiter: {
                    select: {
                      companyName: true,
                    },
                  },
                },
              },
            },
          },
          // Result summary (available after session is COMPLETED)
          scorecard: {
            select: {
              overallScore: true,
              overallRecommendation: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  // validateAndStoreFingerprint
  // Checks how many OTHER candidate accounts share the same device fingerprint.
  // Throws if the device is already associated with 2+ other accounts (which
  // would make this registration the 3rd — considered too many for one device).
  // Otherwise stores the fingerprint and returns a risk assessment.

  async validateAndStoreFingerprint(
    candidateId: string,
    visitorId: string,
  ): Promise<{ isValid: boolean; riskLevel: "low" | "medium" | "high" }> {
    // Count accounts other than the current one that share this fingerprint.
    const existingCount = await prisma.candidateProfile.count({
      where: {
        deviceFingerprint: visitorId,
        id: { not: candidateId },
      },
    });

    // 3+ total accounts (2+ others + this one) -> deny.
    if (existingCount >= 2) {
      throw new ApiError(
        400,
        "Device already registered with too many accounts",
      );
    }

    // Safe to store the fingerprint.
    await prisma.candidateProfile.update({
      where: { id: candidateId },
      data: { deviceFingerprint: visitorId },
    });

    // Risk level based on how many other accounts share this device.
    const riskLevel: "low" | "medium" | "high" =
      existingCount === 0 ? "low" : "medium";

    return { isValid: true, riskLevel };
  }

  // getDashboardStats
  // Aggregates key metrics for the candidate dashboard in a single pass
  // using Promise.all to parallelise the database queries.

  async getDashboardStats(candidateId: string) {
    const [
      totalApplications,
      activeApplications,
      practiceInterviews,
      hiringInterviews,
      profile,
    ] = await Promise.all([
      // All applications ever submitted by this candidate.
      prisma.application.count({
        where: { candidateId },
      }),

      // Applications that are still "live" (not yet rejected/withdrawn/completed).
      prisma.application.count({
        where: {
          candidateId,
          status: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            in: ACTIVE_APPLICATION_STATUSES as any,
          },
        },
      }),

      // Practice sessions — linked directly via candidateId.
      prisma.interviewSession.count({
        where: {
          candidateId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          interviewType: "PRACTICE" as any,
        },
      }),

      // Hiring sessions — linked through the Application record.
      prisma.interviewSession.count({
        where: {
          application: { candidateId },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          interviewType: "HIRING" as any,
        },
      }),

      // Credit balance for "credits remaining" metric.
      prisma.candidateProfile.findUnique({
        where: { id: candidateId },
        select: {
          practiceCredits: true,
          practiceCreditsUsed: true,
        },
      }),
    ]);

    return {
      totalApplications,
      activeApplications,
      practiceInterviews,
      totalInterviews: practiceInterviews + hiringInterviews,
      creditsRemaining: profile
        ? profile.practiceCredits - profile.practiceCreditsUsed
        : 0,
    };
  }
}

export const candidateService = new CandidateService();

import { prisma } from "../database/client.js";
import { ApiError } from "../utils/ApiError.js";

// Local type aliases — mirror the Prisma schema enums.

type JobStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED";
type ExperienceLevel =
  "ENTRY_LEVEL" | "MID_LEVEL" | "SENIOR_LEVEL" | "LEAD" | "ARCHITECT";
type ScreeningMode = "AUTOMATIC" | "ASSISTED";
type UpdateableJobStatus = "ACTIVE" | "PAUSED" | "CLOSED";

// DTO types

export interface ScreeningConfig {
  resume: boolean;
  github: boolean;
  portfolio: boolean;
}

export interface CreateJobDTO {
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  experienceLevel: ExperienceLevel;
  minExperience?: number;
  maxExperience?: number;
  location?: string;
  jobType?: string;
  salary?: string;
  screeningConfig: ScreeningConfig;
  screeningMode?: ScreeningMode;
  autoInviteThreshold?: number;
}

export interface UpdateJobDTO {
  title?: string;
  description?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  experienceLevel?: ExperienceLevel;
  minExperience?: number;
  maxExperience?: number;
  location?: string;
  jobType?: string;
  salary?: string;
  screeningConfig?: ScreeningConfig;
  screeningMode?: ScreeningMode;
  autoInviteThreshold?: number;
}

export interface JobQuery {
  page: number;
  limit: number;
  status?: string;
  experienceLevel?: string;
  search?: string;
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

// Helper — builds pagination metadata from counts.

function buildPagination(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// JobService

export class JobService {
  // createJob
  // Always starts in DRAFT status so the recruiter can review before
  // publishing.

  async createJob(recruiterId: string, data: CreateJobDTO) {
    const job = await prisma.job.create({
      data: {
        recruiterId,
        title: data.title,
        description: data.description,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        requiredSkills: data.requiredSkills as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        preferredSkills: data.preferredSkills as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        experienceLevel: data.experienceLevel as any,
        minExperience: data.minExperience,
        maxExperience: data.maxExperience,
        location: data.location,
        jobType: data.jobType,
        salary: data.salary,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        screeningConfig: data.screeningConfig as any,
        screeningMode: data.screeningMode ?? "ASSISTED",
        autoInviteThreshold: data.autoInviteThreshold ?? 80,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: "DRAFT" as any,
      },
    });

    return job;
  }

  // getRecruiterJobs
  // Returns the calling recruiter's own jobs with optional filters.

  async getRecruiterJobs(
    recruiterId: string,
    query: JobQuery,
  ): Promise<PaginatedResult<unknown>> {
    const { page, limit, status, experienceLevel, search } = query;
    const skip = (page - 1) * limit;

    // Build the where clause dynamically.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { recruiterId };
    if (status) where.status = status;
    if (experienceLevel) where.experienceLevel = experienceLevel;
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { applications: true },
          },
        },
      }),
    ]);

    return { data: jobs, pagination: buildPagination(page, limit, total) };
  }

  // getJobById
  // Fetches a single job. When recruiterId is provided, ownership is verified —
  // used by the /manage route to prevent one recruiter from peeking at
  // another recruiter's draft/paused jobs.

  async getJobById(jobId: string, recruiterId?: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        _count: {
          select: { applications: true },
        },
        recruiter: {
          select: {
            id: true,
            companyName: true,
            industry: true,
            companySize: true,
          },
        },
      },
    });

    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    // Enforce ownership for recruiter-specific views.
    if (recruiterId !== undefined && job.recruiterId !== recruiterId) {
      throw new ApiError(
        403,
        "Access denied. You do not have permission to manage this job.",
      );
    }

    return job;
  }

  // updateJob
  // Verifies ownership and prevents updates on CLOSED jobs.

  async updateJob(jobId: string, recruiterId: string, data: UpdateJobDTO) {
    // getJobById with recruiterId verifies ownership and throws if not found.
    const existing = await this.getJobById(jobId, recruiterId);

    if ((existing.status as JobStatus) === "CLOSED") {
      throw new ApiError(
        400,
        "Cannot update a closed job. Create a new job instead.",
      );
    }

    // Build only the fields that are explicitly provided (sparse update).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: Record<string, any> = {};
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.description !== undefined)
      updatePayload.description = data.description;
    if (data.requiredSkills !== undefined)
      updatePayload.requiredSkills = data.requiredSkills;
    if (data.preferredSkills !== undefined)
      updatePayload.preferredSkills = data.preferredSkills;
    if (data.experienceLevel !== undefined)
      updatePayload.experienceLevel = data.experienceLevel;
    if (data.minExperience !== undefined)
      updatePayload.minExperience = data.minExperience;
    if (data.maxExperience !== undefined)
      updatePayload.maxExperience = data.maxExperience;
    if (data.location !== undefined) updatePayload.location = data.location;
    if (data.jobType !== undefined) updatePayload.jobType = data.jobType;
    if (data.salary !== undefined) updatePayload.salary = data.salary;
    if (data.screeningConfig !== undefined)
      updatePayload.screeningConfig = data.screeningConfig;
    if (data.screeningMode !== undefined)
      updatePayload.screeningMode = data.screeningMode;
    if (data.autoInviteThreshold !== undefined)
      updatePayload.autoInviteThreshold = data.autoInviteThreshold;

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: updatePayload,
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    return updated;
  }

  // deleteJob
  // Allowed only for DRAFT jobs - once published the job cannot be deleted
  // (use CLOSE instead) to preserve application history integrity.

  async deleteJob(jobId: string, recruiterId: string) {
    const job = await this.getJobById(jobId, recruiterId);

    if ((job.status as JobStatus) !== "DRAFT") {
      throw new ApiError(
        400,
        "Only draft jobs can be deleted. To hide a published job, change its status to CLOSED.",
      );
    }

    await prisma.job.delete({ where: { id: jobId } });
  }

  // updateJobStatus
  // Handles the status lifecycle: DRAFT → ACTIVE → PAUSED ↔ ACTIVE → CLOSED.
  // Sets publishedAt on first transition to ACTIVE, and closedAt when CLOSED.

  async updateJobStatus(
    jobId: string,
    recruiterId: string,
    status: UpdateableJobStatus,
  ) {
    const job = await this.getJobById(jobId, recruiterId);

    if ((job.status as JobStatus) === "CLOSED") {
      throw new ApiError(
        400,
        "A closed job cannot be re-opened. Create a new job instead.",
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = { status };

    // Set publishedAt on first-ever activation.
    if (status === "ACTIVE" && !job.publishedAt) {
      updateData.publishedAt = new Date();
    }

    // Always record when the job was closed.
    if (status === "CLOSED") {
      updateData.closedAt = new Date();
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
    });

    return updated;
  }

  // getPublicJobs
  // Returns ACTIVE jobs for candidate browsing. Sensitive recruiter data
  // (like draft configs) is excluded via select projection.

  async getPublicJobs(query: JobQuery): Promise<PaginatedResult<unknown>> {
    const { page, limit, experienceLevel, search } = query;
    const skip = (page - 1) * limit;

    // Public listing always filters to ACTIVE jobs only.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { status: "ACTIVE" as any };
    if (experienceLevel) where.experienceLevel = experienceLevel;
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        // Sort by most recently published first.
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          requiredSkills: true,
          preferredSkills: true,
          experienceLevel: true,
          minExperience: true,
          maxExperience: true,
          location: true,
          jobType: true,
          salary: true,
          status: true,
          screeningMode: true,
          publishedAt: true,
          createdAt: true,
          _count: {
            select: { applications: true },
          },
          recruiter: {
            select: {
              id: true,
              companyName: true,
              industry: true,
              companySize: true,
            },
          },
        },
      }),
    ]);

    return { data: jobs, pagination: buildPagination(page, limit, total) };
  }
}

// Singleton export

export const jobService = new JobService();

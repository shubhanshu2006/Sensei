import { z } from "zod";

// applyForJobSchema
export const applyForJobSchema = z.object({
  resumeUrl: z.string().url("resumeUrl must be a valid URL"),
  coverLetter: z
    .string()
    .max(2000, "Cover letter must be at most 2000 characters")
    .optional(),
  githubUrl: z.string().url("githubUrl must be a valid URL").optional(),
  portfolioUrl: z.string().url("portfolioUrl must be a valid URL").optional(),
});

export type ApplyForJobDTO = z.infer<typeof applyForJobSchema>;

// Shared status enum (all possible application statuses)
export const ApplicationStatusEnum = z.enum([
  "SUBMITTED",
  "SCREENING_IN_PROGRESS",
  "SCREENING_COMPLETED",
  "SHORTLISTED",
  "REJECTED",
  "INTERVIEW_INVITED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_COMPLETED",
  "WITHDRAWN",
]);

// applicationQuerySchema  (candidate view)
export const applicationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: ApplicationStatusEnum.optional(),
});

export type ApplicationQuery = z.infer<typeof applicationQuerySchema>;

// recruiterApplicationQuerySchema  (recruiter view per job)
export const recruiterApplicationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: ApplicationStatusEnum.optional(),
  sortBy: z.enum(["appliedAt", "score"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type RecruiterApplicationQuery = z.infer<
  typeof recruiterApplicationQuerySchema
>;

// updateApplicationStatusSchema
// Recruiters may only set one of these three statuses manually.
export const updateApplicationStatusSchema = z.object({
  status: z.enum(["SHORTLISTED", "REJECTED", "INTERVIEW_INVITED"], {
    message: "Status must be one of: SHORTLISTED, REJECTED, INTERVIEW_INVITED",
  }),
});

export type UpdateApplicationStatusDTO = z.infer<
  typeof updateApplicationStatusSchema
>;

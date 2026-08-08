import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared enums used in both create and update schemas
// ---------------------------------------------------------------------------

const experienceLevelEnum = z.enum([
  "ENTRY_LEVEL",
  "MID_LEVEL",
  "SENIOR_LEVEL",
  "LEAD",
  "ARCHITECT",
]);

const jobTypeEnum = z.enum([
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
]);

const screeningModeEnum = z.enum(["AUTOMATIC", "ASSISTED"]);

const screeningConfigSchema = z.object({
  resume: z.boolean(),
  github: z.boolean(),
  portfolio: z.boolean(),
});

// ---------------------------------------------------------------------------
// Experience cross-field validation
// Applied as a .refine() on both create and update schemas.
// ---------------------------------------------------------------------------

const experienceRefine = (data: {
  minExperience?: number | null | undefined;
  maxExperience?: number | null | undefined;
}): boolean => {
  if (
    data.maxExperience !== undefined &&
    data.maxExperience !== null &&
    data.minExperience !== undefined &&
    data.minExperience !== null
  ) {
    return data.maxExperience >= data.minExperience;
  }
  return true;
};

// ---------------------------------------------------------------------------
// Base object (all optional) — shared between create and update shapes.
// Defaults are NOT applied here so that the update schema can treat missing
// fields as "no-op" rather than overwriting with defaults.
// ---------------------------------------------------------------------------

const jobBaseObject = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title cannot exceed 200 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  requiredSkills: z
    .array(z.string().min(1))
    .min(1, "At least one required skill must be specified")
    .max(20, "Cannot specify more than 20 required skills"),
  preferredSkills: z.array(z.string().min(1)).optional(),
  experienceLevel: experienceLevelEnum,
  minExperience: z.number().int().min(0).max(30).optional(),
  maxExperience: z.number().int().min(0).max(30).optional(),
  location: z.string().min(1).optional(),
  jobType: jobTypeEnum.optional(),
  salary: z.string().min(1).optional(),
  screeningConfig: screeningConfigSchema,
  screeningMode: screeningModeEnum,
  autoInviteThreshold: z.number().min(0).max(100),
});

// ---------------------------------------------------------------------------
// createJobSchema
// Required fields: title, description, requiredSkills, experienceLevel,
//                  screeningConfig.
// screeningMode and autoInviteThreshold default to 'ASSISTED' and 80.
// ---------------------------------------------------------------------------

export const createJobSchema = jobBaseObject
  .extend({
    screeningMode: screeningModeEnum.default("ASSISTED"),
    autoInviteThreshold: z.number().min(0).max(100).default(80),
  })
  .refine(experienceRefine, {
    message: "maxExperience must be greater than or equal to minExperience",
    path: ["maxExperience"],
  });

export type CreateJobInput = z.infer<typeof createJobSchema>;

// ---------------------------------------------------------------------------
// updateJobSchema
// All fields become optional. At least one must be supplied.
// The experience cross-field constraint is still enforced when both are present.
// ---------------------------------------------------------------------------

export const updateJobSchema = jobBaseObject
  .partial()
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  })
  .refine(experienceRefine, {
    message: "maxExperience must be greater than or equal to minExperience",
    path: ["maxExperience"],
  });

export type UpdateJobInput = z.infer<typeof updateJobSchema>;

// ---------------------------------------------------------------------------
// jobStatusSchema
// DRAFT is not a valid transition target via the status endpoint
// (jobs start as DRAFT on creation).
// ---------------------------------------------------------------------------

export const jobStatusSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "CLOSED"]),
});

export type JobStatusInput = z.infer<typeof jobStatusSchema>;

// ---------------------------------------------------------------------------
// jobQuerySchema
// Used for both recruiter "my jobs" listing and public job browsing.
// z.coerce converts query string values to the appropriate primitive types.
// ---------------------------------------------------------------------------

export const jobQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "CLOSED"]).optional(),
  experienceLevel: experienceLevelEnum.optional(),
  search: z.string().min(1).optional(),
});

export type JobQueryInput = z.infer<typeof jobQuerySchema>;

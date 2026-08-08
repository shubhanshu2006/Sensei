import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared enums
// ---------------------------------------------------------------------------

export const PracticeJobCategoryEnum = z.enum([
  "FRONTEND",
  "BACKEND",
  "FULLSTACK",
  "MOBILE",
  "DEVOPS",
  "DATA_SCIENCE",
  "MACHINE_LEARNING",
  "SYSTEM_DESIGN",
  "PRODUCT_MANAGEMENT",
  "OTHER",
]);

export const PracticeJobDifficultyEnum = z.enum([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
]);

// ---------------------------------------------------------------------------
// createPracticeJobSchema
// ---------------------------------------------------------------------------

export const createPracticeJobSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  category: PracticeJobCategoryEnum,
  difficulty: PracticeJobDifficultyEnum,
  requiredSkills: z
    .array(z.string().min(1))
    .min(1, "At least one required skill must be specified")
    .max(15, "At most 15 required skills are allowed"),
  technologies: z.array(z.string().min(1)).optional(),
  estimatedDuration: z
    .number()
    .int("Duration must be a whole number")
    .min(5, "Duration must be at least 5 minutes")
    .max(120, "Duration must be at most 120 minutes")
    .optional(),
  isFeatured: z.boolean().default(false),
});

export type CreatePracticeJobDTO = z.infer<typeof createPracticeJobSchema>;

// ---------------------------------------------------------------------------
// updatePracticeJobSchema  (all fields optional, at least one required)
// ---------------------------------------------------------------------------

export const updatePracticeJobSchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(50).optional(),
    category: PracticeJobCategoryEnum.optional(),
    difficulty: PracticeJobDifficultyEnum.optional(),
    requiredSkills: z.array(z.string().min(1)).min(1).max(15).optional(),
    technologies: z.array(z.string().min(1)).optional(),
    estimatedDuration: z.number().int().min(5).max(120).optional(),
    isFeatured: z.boolean().optional(),
    isPublished: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one field must be provided for update",
  });

export type UpdatePracticeJobDTO = z.infer<typeof updatePracticeJobSchema>;

// ---------------------------------------------------------------------------
// practiceQuerySchema
// ---------------------------------------------------------------------------

export const practiceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  category: PracticeJobCategoryEnum.optional(),
  difficulty: PracticeJobDifficultyEnum.optional(),
  search: z.string().optional(),
  /**
   * Query strings are always strings — preprocess "true"/"false" → boolean
   * so that ?isFeatured=false correctly filters to non-featured jobs.
   */
  isFeatured: z.preprocess((val) => {
    if (val === "true") return true;
    if (val === "false") return false;
    return val;
  }, z.boolean().optional()),
});

export type PracticeQuery = z.infer<typeof practiceQuerySchema>;

// ---------------------------------------------------------------------------
// startPracticeInterviewSchema
// ---------------------------------------------------------------------------

export const startPracticeInterviewSchema = z.object({
  /**
   * Optional: client may supply a specific resume URL to use for this session.
   * Falls back to the candidate's stored profile resume when omitted.
   */
  resumeUrl: z.string().url("resumeUrl must be a valid URL").optional(),
});

export type StartPracticeInterviewDTO = z.infer<
  typeof startPracticeInterviewSchema
>;

import { z } from "zod";

// updateCandidateProfileSchema
// At least one field required (enforced by refine).
export const updateCandidateProfileSchema = z
  .object({
    phoneNumber: z.string().min(1).optional(),
    location: z.string().min(1).optional(),
    experience: z.number().int().min(0).max(50).optional(),
    currentCompany: z.string().min(1).optional(),
    currentDesignation: z.string().min(1).optional(),
    githubUrl: z.string().url("Must be a valid URL").optional(),
    portfolioUrl: z.string().url("Must be a valid URL").optional(),
    linkedinUrl: z.string().url("Must be a valid URL").optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one field must be provided to update the profile",
  });

export type UpdateCandidateProfileInput = z.infer<
  typeof updateCandidateProfileSchema
>;

// validateFingerprintSchema
export const validateFingerprintSchema = z.object({
  visitorId: z.string().min(1, "visitorId is required"),
  requestId: z.string().min(1, "requestId is required"),
});

export type ValidateFingerprintInput = z.infer<
  typeof validateFingerprintSchema
>;

// paginationQuerySchema
// Used on routes that accept ?page= and ?limit= query parameters.
// z.coerce.number() is required because query string values are always strings.

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(20),
});

export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;

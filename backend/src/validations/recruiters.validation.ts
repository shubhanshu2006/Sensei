import { z } from "zod";

// Shared field definitions

const companySizeEnum = z.enum(["1-10", "11-50", "51-200", "201-500", "500+"]);

// Create schema (used during initial profile setup, called from auth service)

export const createRecruiterProfileSchema = z.object({
  companyName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must not exceed 100 characters"),
  companyWebsite: z
    .string()
    .url("Company website must be a valid URL")
    .optional(),
  companySize: companySizeEnum.optional(),
  industry: z.string().min(1).max(100).optional(),
  designation: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().min(5).max(20).optional(),
});

export type CreateRecruiterProfileInput = z.infer<
  typeof createRecruiterProfileSchema
>;

// Update schema — all fields optional, but at least one required

export const updateRecruiterProfileSchema = z
  .object({
    companyName: z
      .string()
      .min(2, "Company name must be at least 2 characters")
      .max(100, "Company name must not exceed 100 characters")
      .optional(),
    companyWebsite: z
      .string()
      .url("Company website must be a valid URL")
      .optional(),
    companySize: companySizeEnum.optional(),
    industry: z.string().min(1).max(100).optional(),
    designation: z.string().min(1).max(100).optional(),
    phoneNumber: z.string().min(5).max(20).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message:
      "At least one field must be provided to update the recruiter profile",
  });

export type UpdateRecruiterProfileInput = z.infer<
  typeof updateRecruiterProfileSchema
>;

// Schedule interview schema

export const scheduleInterviewSchema = z.object({
  applicationId: z.string().uuid("Invalid application ID format"),
  scheduledTime: z
    .string()
    .datetime("Scheduled time must be a valid ISO 8601 datetime")
    .refine(
      (val) => new Date(val) > new Date(),
      "Scheduled time must be in the future",
    ),
});

export type ScheduleInterviewInput = z.infer<typeof scheduleInterviewSchema>;

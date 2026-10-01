import { z } from "zod";

// Signup / Profile-setup schema

/**
 * Validates the body of POST /auth/setup.
 *
 * Rules:
 *  - `role` is always required (RECRUITER | CANDIDATE).
 *  - `companyName` is required **and** ≥ 2 chars when role is RECRUITER.
 *  - `firstName` / `lastName` are optional on all roles.
 */
export const signupSchema = z
  .object({
    role: z.enum(["RECRUITER", "CANDIDATE"]),
    companyName: z
      .string()
      .min(2, "Company name must be at least 2 characters")
      .max(100)
      .optional(),
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    // Candidate profile fields (stored once during onboarding)
    resumeUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
    resumeFileName: z.string().max(255).optional().nullable(),
    currentDesignation: z.string().max(100).optional().or(z.literal("")).nullable(),
    experience: z.union([z.number().int().min(0).max(50), z.null()]).optional(),
    deviceFingerprint: z.string().optional().nullable(),
  })
  .refine(
    (data) =>
      data.role !== "RECRUITER" ||
      (data.companyName !== undefined && data.companyName.trim().length >= 2),
    {
      message: "Company name is required for recruiter registration",
      path: ["companyName"],
    },
  );

export type SignupInput = z.infer<typeof signupSchema>;

export const checkDeviceSchema = z.object({
  visitorId: z.string().min(1, "visitorId is required"),
});

export type CheckDeviceInput = z.infer<typeof checkDeviceSchema>;


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

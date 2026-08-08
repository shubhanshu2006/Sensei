import { z } from "zod";

// Update-user schema

/**
 * Validates the body of PUT /users/profile.
 * All fields are optional individually, but at least one must be present.
 */
export const updateUserSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name cannot be empty")
      .max(50)
      .optional(),
    lastName: z.string().min(1, "Last name cannot be empty").max(50).optional(),
    avatar: z.string().url("Avatar must be a valid URL").optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message:
      "At least one field (firstName, lastName, or avatar) must be provided",
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

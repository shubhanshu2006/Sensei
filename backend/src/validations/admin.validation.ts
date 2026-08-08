import { z } from "zod";

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "DELETED"], {
    error: "status must be one of: 'ACTIVE', 'SUSPENDED', 'DELETED'",
  }),
});

export const userQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, "page must be at least 1")
    .optional()
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, "limit must be at least 1")
    .max(100, "limit cannot exceed 100")
    .optional()
    .default(20),
  role: z.enum(["PLATFORM_ADMIN", "RECRUITER", "CANDIDATE"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "DELETED"]).optional(),
  search: z.string().optional(),
});

export const analyticsQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "from must be a date in YYYY-MM-DD format")
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "to must be a date in YYYY-MM-DD format")
    .optional(),
  groupBy: z.enum(["day", "week", "month"]).optional().default("day"),
});

export type UpdateUserStatusDTO = z.infer<typeof updateUserStatusSchema>;
export type UserQueryDTO = z.infer<typeof userQuerySchema>;
export type AnalyticsQueryDTO = z.infer<typeof analyticsQuerySchema>;

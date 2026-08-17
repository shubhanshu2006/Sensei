import { z } from "zod";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

/**
 * Body for initiating an interview session.
 * Exactly one of `applicationId` (hiring interview) or `practiceJobId`
 * (practice interview) must be supplied — never both, never neither.
 */
export const startInterviewSchema = z
  .object({
    applicationId: z
      .string()
      .uuid("applicationId must be a valid UUID")
      .optional(),
    practiceJobId: z
      .string()
      .uuid("practiceJobId must be a valid UUID")
      .optional(),
  })
  .refine(
    (data) => Boolean(data.applicationId) || Boolean(data.practiceJobId),
    {
      message: "Either applicationId or practiceJobId is required",
      path: ["applicationId"],
    },
  )
  .refine((data) => !(data.applicationId && data.practiceJobId), {
    message: "Provide either applicationId or practiceJobId, not both",
    path: ["practiceJobId"],
  });

/**
 * Body for submitting an answer to an interview question.
 * Used by the WebSocket gateway for real-time interviews.
 */
export const submitAnswerSchema = z.object({
  sessionToken: z.string().min(1, "sessionToken is required"),
  questionIndex: z
    .number()
    .int("questionIndex must be an integer")
    .min(0, "questionIndex must be non-negative"),
  answer: z.string().min(10, "answer must be at least 10 characters"),
  audioBase64: z.string().optional(),
});

/**
 * Body for explicitly ending an interview session.
 * `reason` defaults to COMPLETED if not provided.
 */
export const endInterviewSchema = z.object({
  sessionToken: z.string().min(1, "sessionToken is required"),
  reason: z
    .enum(["COMPLETED", "ABANDONED", "TIMEOUT"])
    .optional()
    .default("COMPLETED"),
});

export type StartInterviewDTO = z.infer<typeof startInterviewSchema>;
export type SubmitAnswerDTO = z.infer<typeof submitAnswerSchema>;
export type EndInterviewDTO = z.infer<typeof endInterviewSchema>;

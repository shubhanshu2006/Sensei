import { z } from "zod";

// Constants
const CREDIT_PACK_MAP: Record<number, number> = {
  10: 100,
  25: 250,
  50: 500,
  100: 1000,
};

const VALID_CREDIT_COUNTS = Object.keys(CREDIT_PACK_MAP).map(Number) as [
  number,
  ...number[],
];

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

/**
 * Validates a recruiter credit purchase request.
 * Both `credits` and `amount` must belong to a recognised pack AND must be
 * consistent with each other (e.g. 25 credits → ₹250, not ₹100).
 */
export const purchaseCreditsSchema = z
  .object({
    credits: z
      .number()
      .int("credits must be an integer")
      .refine((v) => VALID_CREDIT_COUNTS.includes(v), {
        message: `credits must be one of: ${VALID_CREDIT_COUNTS.join(", ")}`,
      }),
    amount: z
      .number()
      .int("amount must be an integer")
      .positive("amount must be positive"),
  })
  .refine((data) => CREDIT_PACK_MAP[data.credits] === data.amount, {
    message:
      "Invalid credits/amount pair. Valid pairs: 10 credits = ₹100, 25 credits = ₹250, 50 credits = ₹500, 100 credits = ₹1000",
    path: ["amount"],
  });

/**
 * Validates a candidate practice-credit purchase request.
 * Candidates can buy between 1 and 10 practice credits in a single order.
 */
export const candidatePurchaseCreditsSchema = z.object({
  credits: z
    .number()
    .int("credits must be an integer")
    .min(1, "credits must be at least 1")
    .max(10, "credits cannot exceed 10 per purchase"),
  amount: z
    .number()
    .int("amount must be an integer")
    .positive("amount must be positive"),
});

export type PurchaseCreditsDTO = z.infer<typeof purchaseCreditsSchema>;
export type CandidatePurchaseCreditsDTO = z.infer<
  typeof candidatePurchaseCreditsSchema
>;

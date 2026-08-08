import { z } from "zod";

// triggerScreeningSchema
// Used by admins / recruiters to manually kick off AI screening for an
// application (the applicationId is also carried as a route param but this
// schema lets us validate it from the body when needed).

export const triggerScreeningSchema = z.object({
  applicationId: z.string().uuid("applicationId must be a valid UUID"),
});

export type TriggerScreeningDTO = z.infer<typeof triggerScreeningSchema>;

// Augment Express's Request type so that req.user is globally available
// after the authenticateUser middleware runs.
// Types are defined as string-literal unions to avoid depending on the
// generated Prisma client at type-declaration time.

export type UserRole = "PLATFORM_ADMIN" | "RECRUITER" | "CANDIDATE";
export type AccountStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  status: AccountStatus;
  /** Present when the user has a RecruiterProfile row */
  recruiterProfileId?: string;
  /** Present when the user has a CandidateProfile row */
  candidateProfileId?: string;
  /** Present when the user has an AdminProfile row */
  adminProfileId?: string;
}

declare global {
  namespace Express {
    interface Request {
      /** Set by `authenticateUser` middleware after successful token verification. */
      user?: AuthUser;
    }
  }
}

import { prisma } from "../database/client.js";
import { ApiError } from "../utils/ApiError.js";

// Clerk webhook payload types
export interface ClerkEmailAddress {
  id?: string;
  email_address: string;
}

export interface ClerkUserData {
  id: string;
  email_addresses: ClerkEmailAddress[];
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  /** Clerk publicMetadata — may contain `role` set by your frontend before sign-up. */
  public_metadata?: Record<string, unknown>;
}

// AuthService
class AuthService {
  // Webhook handlers

  /**
   * Handles the `user.created` Clerk webhook event.
   *
   * Creates the User row in our database.  The role is sourced from Clerk's
   * `publicMetadata.role`.  If no valid role is present in metadata, the user
   * is persisted with the default role of CANDIDATE so that `authenticateUser`
   * can load them; the role is corrected when the user completes profile setup
   * via POST /auth/setup.
   *
   * The upsert is idempotent — re-delivered webhooks are silently ignored.
   */
  async handleWebhookUserCreated(data: ClerkUserData): Promise<void> {
    const primaryEmail = data.email_addresses[0]?.email_address;
    if (!primaryEmail) {
      throw new ApiError(400, "Clerk user is missing a primary email address");
    }

    const metaRole = data.public_metadata?.role;
    const role =
      metaRole === "RECRUITER" || metaRole === "CANDIDATE"
        ? metaRole
        : "CANDIDATE";

    await prisma.user.upsert({
      where: { clerkId: data.id },
      // Idempotent re-delivery: do nothing if the row already exists.
      update: {},
      create: {
        clerkId: data.id,
        email: primaryEmail,
        firstName: data.first_name ?? null,
        lastName: data.last_name ?? null,
        avatar: data.image_url ?? null,
        role,
        status: "ACTIVE",
      },
    });
  }

  /**
   * Handles the `user.updated` Clerk webhook event.
   *
   * Syncs mutable profile fields (email, name, avatar).  Uses `updateMany` so
   * the call is safe even if the webhook arrives before the `user.created` event
   * has been processed.
   */
  async handleWebhookUserUpdated(data: ClerkUserData): Promise<void> {
    const primaryEmail = data.email_addresses[0]?.email_address;

    await prisma.user.updateMany({
      where: { clerkId: data.id },
      data: {
        ...(primaryEmail ? { email: primaryEmail } : {}),
        ...(data.first_name !== undefined
          ? { firstName: data.first_name }
          : {}),
        ...(data.last_name !== undefined ? { lastName: data.last_name } : {}),
        ...(data.image_url !== undefined ? { avatar: data.image_url } : {}),
      },
    });
  }

  /**
   * Handles the `user.deleted` Clerk webhook event.
   *
   * Soft-deletes the user by setting their status to DELETED.  Profile data is
   * preserved for audit purposes; cascade deletes are handled by the DB if
   * required at a later cleanup stage.
   */
  async handleWebhookUserDeleted(data: { id: string }): Promise<void> {
    await prisma.user.updateMany({
      where: { clerkId: data.id },
      data: { status: "DELETED" },
    });
  }

  // Profile setup

  /**
   * Completes user onboarding by creating the appropriate role profile and
   * updating the User.role in the database.
   *
   * - RECRUITER: creates RecruiterProfile with free-trial credits.
   * - CANDIDATE: creates CandidateProfile with practice credits.
   *
   * The entire operation is wrapped in a transaction to ensure consistency.
   * Throws 409 if the user already has a profile for the requested role.
   */
  async setupUserProfile(
    clerkId: string,
    role: "RECRUITER" | "CANDIDATE",
    extraData: Record<string, unknown>,
  ) {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        recruiterProfile: true,
        candidateProfile: true,
      },
    });

    if (!user) {
      throw new ApiError(
        404,
        "User account not found. Ensure the Clerk webhook has been processed.",
      );
    }

    if (role === "RECRUITER") {
      if (user.recruiterProfile) {
        throw new ApiError(
          409,
          "A recruiter profile already exists for this account",
        );
      }

      const companyName = (extraData.companyName as string | undefined)?.trim();
      if (!companyName || companyName.length < 2) {
        throw new ApiError(
          400,
          "A valid company name is required for recruiter registration",
        );
      }

      return prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { role: "RECRUITER" },
        });

        await tx.recruiterProfile.create({
          data: {
            userId: user.id,
            companyName,
            interviewCredits: 0,
            freeTrialUsed: false,
            freeTrialCredits: 5,
          },
        });

        return tx.user.findUniqueOrThrow({
          where: { id: user.id },
          include: {
            recruiterProfile: true,
            candidateProfile: true,
          },
        });
      });
    } else {
      // CANDIDATE
      if (user.candidateProfile) {
        throw new ApiError(
          409,
          "A candidate profile already exists for this account",
        );
      }

      return prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { role: "CANDIDATE" },
        });

        await tx.candidateProfile.create({
          data: {
            userId: user.id,
            practiceCredits: 2,
          },
        });

        return tx.user.findUniqueOrThrow({
          where: { id: user.id },
          include: {
            recruiterProfile: true,
            candidateProfile: true,
          },
        });
      });
    }
  }

  // Current-user lookup

  /**
   * Returns the full user record with the applicable profile relation included.
   */
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        recruiterProfile: true,
        candidateProfile: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user;
  }
}

export const authService = new AuthService();

import { prisma } from "../database/client.js";
import { ApiError } from "../utils/ApiError.js";
import { clerkClient } from "../config/clerk.js";
import { logger } from "../utils/logger.js";
import { emailService } from "./email/EmailService.js";

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

    // Send welcome email to new user (non-blocking)
    const alreadySent = (data.public_metadata as any)?.welcomeEmailSent;
    if (!alreadySent) {
      try {
        const userName = [data.first_name, data.last_name].filter(Boolean).join(" ") || undefined;
        await emailService.sendWelcomeEmail({
          userEmail: primaryEmail,
          userName,
        });

        await clerkClient.users.updateUserMetadata(data.id, {
          publicMetadata: {
            ...(data.public_metadata || {}),
            welcomeEmailSent: true,
          },
        });

        logger.info("[AuthService] Welcome email sent successfully on user.created", {
          clerkId: data.id,
          email: primaryEmail,
        });
      } catch (emailErr) {
        logger.error("[AuthService] Failed to send welcome email on user.created", {
          clerkId: data.id,
          email: primaryEmail,
          error: emailErr,
        });
      }
    }
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

      const updatedUser = await prisma.$transaction(async (tx) => {
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

      // Synchronize role to Clerk publicMetadata so Next.js middleware has immediate access
      try {
        await clerkClient.users.updateUserMetadata(clerkId, {
          publicMetadata: { role: "RECRUITER" },
        });
      } catch (clerkErr) {
        logger.error("Failed to sync role to Clerk publicMetadata", {
          clerkId,
          role: "RECRUITER",
          error: clerkErr,
        });
      }

      // Ensure welcome email is sent if not already delivered
      try {
        const clerkUser = await clerkClient.users.getUser(clerkId).catch(() => null);
        const welcomeSent = (clerkUser?.publicMetadata as any)?.welcomeEmailSent;
        if (!welcomeSent && user.email) {
          const userName = [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined;
          await emailService.sendWelcomeEmail({
            userEmail: user.email,
            userName,
          });
          await clerkClient.users.updateUserMetadata(clerkId, {
            publicMetadata: {
              ...(clerkUser?.publicMetadata || {}),
              welcomeEmailSent: true,
            },
          });
          logger.info("[AuthService] Welcome email sent on recruiter profile setup", {
            clerkId,
            email: user.email,
          });
        }
      } catch (welcomeErr) {
        logger.error("[AuthService] Failed to send welcome email during recruiter profile setup", {
          clerkId,
          error: welcomeErr,
        });
      }

      return updatedUser;
    } else {
      // CANDIDATE
      const resumeUrl = (extraData.resumeUrl as string | undefined) || null;
      const resumeFileName = (extraData.resumeFileName as string | undefined) || null;
      const currentDesignation = (extraData.currentDesignation as string | undefined) || null;
      const experience = typeof extraData.experience === "number" ? extraData.experience : null;
      const deviceFingerprint = (extraData.deviceFingerprint as string | undefined)?.trim() || null;

      // STRICTURE: Block new signup / account switching if this device fingerprint is already used by another account
      if (deviceFingerprint) {
        const existingDeviceProfile = await prisma.candidateProfile.findFirst({
          where: {
            deviceFingerprint,
            userId: { not: user.id },
          },
          include: {
            user: { select: { email: true } },
          },
        });

        if (existingDeviceProfile) {
          logger.warn("[AuthService] Signup blocked: device already registered to another account", {
            clerkId,
            userId: user.id,
            attemptedEmail: user.email,
            deviceFingerprint,
            existingAccountEmail: existingDeviceProfile.user?.email,
          });

          throw new ApiError(
            403,
            "This device is already associated with an existing Sensei account. Multiple accounts or account switching is not permitted on the same device.",
          );
        }
      }

      if (user.candidateProfile) {
        // If candidate profile already exists, update fields and sync role idempotently
        const updatedUser = await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: user.id },
            data: { role: "CANDIDATE" },
          });

          await tx.candidateProfile.update({
            where: { id: user.candidateProfile!.id },
            data: {
              ...(resumeUrl ? { resumeUrl, resumeFileName, resumeUploadedAt: new Date() } : {}),
              ...(currentDesignation ? { currentDesignation } : {}),
              ...(experience !== null ? { experience } : {}),
              ...(deviceFingerprint ? { deviceFingerprint } : {}),
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

        try {
          await clerkClient.users.updateUserMetadata(clerkId, {
            publicMetadata: { role: "CANDIDATE" },
          });
        } catch (clerkErr) {
          logger.error("Failed to sync role to Clerk publicMetadata", {
            clerkId,
            role: "CANDIDATE",
            error: clerkErr,
          });
        }

        return updatedUser;
      }

      const updatedUser = await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { role: "CANDIDATE" },
        });

        await tx.candidateProfile.create({
          data: {
            userId: user.id,
            practiceCredits: 2,
            resumeUrl,
            resumeFileName,
            resumeUploadedAt: resumeUrl ? new Date() : null,
            currentDesignation,
            experience,
            deviceFingerprint,
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

      // Synchronize role to Clerk publicMetadata so Next.js middleware has immediate access
      try {
        await clerkClient.users.updateUserMetadata(clerkId, {
          publicMetadata: { role: "CANDIDATE" },
        });
      } catch (clerkErr) {
        logger.error("Failed to sync role to Clerk publicMetadata", {
          clerkId,
          role: "CANDIDATE",
          error: clerkErr,
        });
      }

      // Ensure welcome email is sent if not already delivered
      try {
        const clerkUser = await clerkClient.users.getUser(clerkId).catch(() => null);
        const welcomeSent = (clerkUser?.publicMetadata as any)?.welcomeEmailSent;
        if (!welcomeSent && user.email) {
          const userName = [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined;
          await emailService.sendWelcomeEmail({
            userEmail: user.email,
            userName,
          });
          await clerkClient.users.updateUserMetadata(clerkId, {
            publicMetadata: {
              ...(clerkUser?.publicMetadata || {}),
              welcomeEmailSent: true,
            },
          });
          logger.info("[AuthService] Welcome email sent on profile setup", {
            clerkId,
            email: user.email,
          });
        }
      } catch (welcomeErr) {
        logger.error("[AuthService] Failed to send welcome email during profile setup", {
          clerkId,
          error: welcomeErr,
        });
      }

      return updatedUser;
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
        adminProfile: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user;
  }

  /**
   * Checks whether a device fingerprint is already bound to an existing candidate account.
   * If yes, blocks account switching and new signups.
   */
  async checkDeviceFingerprint(visitorId: string): Promise<{
    isRegistered: boolean;
    message?: string;
    maskedEmail?: string;
  }> {
    if (!visitorId || typeof visitorId !== "string") {
      return { isRegistered: false };
    }

    const trimmed = visitorId.trim();
    const existing = await prisma.candidateProfile.findFirst({
      where: { deviceFingerprint: trimmed },
      include: { user: { select: { email: true } } },
    });

    if (existing && existing.user?.email) {
      const email = existing.user.email;
      const [name, domain] = email.split("@");
      let maskedEmail = email;
      if (domain) {
        if (name.length <= 1) {
          maskedEmail = `${name}***@${domain}`;
        } else if (name.length === 2) {
          maskedEmail = `${name[0]}***@${domain}`;
        } else {
          maskedEmail = `${name[0]}***${name[name.length - 1]}@${domain}`;
        }
      }

      return {
        isRegistered: true,
        maskedEmail,
        message:
          "This device is already associated with an existing Sensei account. Creating multiple accounts or switching accounts is not permitted on the same device.",
      };
    }

    return { isRegistered: false };
  }
}

export const authService = new AuthService();

import crypto from "crypto";
import { prisma } from "../database/client.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { config } from "../config/index.js";
import {
  CANDIDATE_CREDIT_PACKS,
  RECRUITER_CREDIT_PACKS,
} from "./credits.service.js";
import { queueEmail } from "./queue/EmailJob.js";

export interface CreateCreditRequestDTO {
  userId: string;
  userRole: "CANDIDATE" | "RECRUITER";
  packageId: string;
  utrNumber: string;
}

export interface AdminCreditRequestsQuery {
  status?: "PENDING" | "APPROVED" | "REJECTED" | "ALL";
  page?: number;
  limit?: number;
  search?: string;
  role?: "CANDIDATE" | "RECRUITER" | "ALL";
}

export interface CreditPurchaseRequestRecord {
  id: string;
  userId: string;
  userRole: "CANDIDATE" | "RECRUITER";
  packageId: string;
  packageName: string;
  credits: number;
  amount: number | string;
  currency: string;
  utrNumber: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote?: string | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
  };
}

class CreditRequestService {
  /**
   * Returns current UPI QR payment configuration.
   */
  getQrConfig() {
    return {
      upiId: config.payment.upiId,
      upiName: config.payment.upiName,
      mode: config.payment.mode,
      isQrActive: true,
    };
  }

  /**
   * Creates a new pending credit purchase request submitted with a payment UTR number.
   */
  async createRequest(data: CreateCreditRequestDTO) {
    const { userId, userRole, packageId, utrNumber } = data;

    const cleanUtr = utrNumber ? utrNumber.trim() : "";
    if (!cleanUtr || cleanUtr.length < 6) {
      throw new ApiError(
        400,
        "Please enter a valid 12-digit UPI transaction reference / UTR number from your payment receipt.",
      );
    }

    // Verify user existence
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        recruiterProfile: true,
        candidateProfile: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "User profile not found");
    }

    // Resolve package details
    let credits = 0;
    let amount = 0;
    let packageName = "";

    if (userRole === "CANDIDATE") {
      const pack = CANDIDATE_CREDIT_PACKS.find((p) => p.id === packageId);
      if (!pack) {
        throw new ApiError(400, "Invalid candidate credit package selected");
      }
      credits = pack.credits;
      amount = pack.amountInr;
      packageName = pack.label;
    } else if (userRole === "RECRUITER") {
      const pack = RECRUITER_CREDIT_PACKS.find((p) => p.id === packageId);
      if (!pack) {
        throw new ApiError(400, "Invalid recruiter credit package selected");
      }
      credits = pack.credits;
      amount = pack.amountInr;
      packageName = pack.label;
    } else {
      throw new ApiError(400, "Invalid user role for credit purchase");
    }

    // Check if an approved request with this exact UTR already exists (prevent duplicate claims)
    const existingApproved = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "CreditPurchaseRequest"
      WHERE "utrNumber" = ${cleanUtr} AND "status" = 'APPROVED'
      LIMIT 1
    `;

    if (existingApproved.length > 0) {
      throw new ApiError(
        400,
        "This UTR / Transaction Reference number has already been verified and credited previously. If you believe this is an error, please reach out to support.",
      );
    }

    // Check if the user already has a pending request with this UTR
    const existingPending = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "CreditPurchaseRequest"
      WHERE "utrNumber" = ${cleanUtr} AND "userId" = ${userId} AND "status" = 'PENDING'
      LIMIT 1
    `;

    if (existingPending.length > 0) {
      throw new ApiError(
        400,
        "A credit request with this UTR number is already pending verification. Please allow time for the super admin to review it.",
      );
    }

    const id = crypto.randomUUID();

    await prisma.$executeRawUnsafe(
      `INSERT INTO "CreditPurchaseRequest" 
       ("id", "userId", "userRole", "packageId", "packageName", "credits", "amount", "currency", "utrNumber", "status", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
      id,
      userId,
      userRole,
      packageId,
      packageName,
      credits,
      amount,
      "INR",
      cleanUtr,
      "PENDING",
    );

    logger.info("[CreditRequestService] New credit request submitted", {
      requestId: id,
      userId,
      userRole,
      credits,
      amount,
      utr: cleanUtr,
    });

    return {
      id,
      userId,
      userRole,
      packageId,
      packageName,
      credits,
      amount,
      currency: "INR",
      utrNumber: cleanUtr,
      status: "PENDING",
      createdAt: new Date(),
    };
  }

  /**
   * Retrieves all credit purchase requests submitted by a specific user.
   */
  async getUserRequests(userId: string) {
    const requests = await prisma.$queryRaw<Array<CreditPurchaseRequestRecord>>`
      SELECT * FROM "CreditPurchaseRequest"
      WHERE "userId" = ${userId}
      ORDER BY "createdAt" DESC
    `;

    return requests;
  }

  /**
   * Retrieves paginated credit requests for Super Admin management.
   */
  async getAdminRequests(query: AdminCreditRequestsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const statusFilter = query.status && query.status !== "ALL" ? query.status : null;
    const roleFilter = query.role && query.role !== "ALL" ? query.role : null;
    const search = query.search ? query.search.trim().toLowerCase() : null;

    // Fetch requests with user details
    const requests = await prisma.$queryRaw<Array<any>>`
      SELECT 
        cr.*,
        u.email as "userEmail",
        u."firstName" as "userFirstName",
        u."lastName" as "userLastName",
        u.role as "actualRole"
      FROM "CreditPurchaseRequest" cr
      LEFT JOIN "User" u ON cr."userId" = u.id
      WHERE 
        (${statusFilter}::text IS NULL OR cr.status = ${statusFilter})
        AND (${roleFilter}::text IS NULL OR cr."userRole" = ${roleFilter})
        AND (${search}::text IS NULL OR 
             LOWER(cr."utrNumber") LIKE ${search ? `%${search}%` : "%"} OR
             LOWER(u.email) LIKE ${search ? `%${search}%` : "%"} OR
             LOWER(COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", '')) LIKE ${search ? `%${search}%` : "%"})
      ORDER BY 
        CASE WHEN cr.status = 'PENDING' THEN 0 ELSE 1 END,
        cr."createdAt" DESC
      LIMIT ${limit} OFFSET ${skip}
    `;

    // Fetch total count matching filter
    const totalCountRes = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint as count
      FROM "CreditPurchaseRequest" cr
      LEFT JOIN "User" u ON cr."userId" = u.id
      WHERE 
        (${statusFilter}::text IS NULL OR cr.status = ${statusFilter})
        AND (${roleFilter}::text IS NULL OR cr."userRole" = ${roleFilter})
        AND (${search}::text IS NULL OR 
             LOWER(cr."utrNumber") LIKE ${search ? `%${search}%` : "%"} OR
             LOWER(u.email) LIKE ${search ? `%${search}%` : "%"} OR
             LOWER(COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", '')) LIKE ${search ? `%${search}%` : "%"})
    `;
    const total = Number(totalCountRes[0]?.count || 0);

    // Fetch status metrics
    const statsRes = await prisma.$queryRaw<Array<{
      pending_count: bigint;
      approved_count: bigint;
      rejected_count: bigint;
      total_approved_amount: number | null;
      total_approved_credits: bigint | null;
    }>>`
      SELECT 
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END)::bigint as pending_count,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END)::bigint as approved_count,
        COUNT(CASE WHEN status = 'REJECTED' THEN 1 END)::bigint as rejected_count,
        SUM(CASE WHEN status = 'APPROVED' THEN amount ELSE 0 END) as total_approved_amount,
        SUM(CASE WHEN status = 'APPROVED' THEN credits ELSE 0 END)::bigint as total_approved_credits
      FROM "CreditPurchaseRequest"
    `;

    const stats = statsRes[0] || {
      pending_count: 0n,
      approved_count: 0n,
      rejected_count: 0n,
      total_approved_amount: 0,
      total_approved_credits: 0n,
    };

    const formattedRequests = requests.map((r) => ({
      id: r.id,
      userId: r.userId,
      userRole: r.userRole,
      packageId: r.packageId,
      packageName: r.packageName,
      credits: Number(r.credits),
      amount: Number(r.amount),
      currency: r.currency,
      utrNumber: r.utrNumber,
      status: r.status,
      adminNote: r.adminNote,
      approvedBy: r.approvedBy,
      approvedAt: r.approvedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      user: {
        id: r.userId,
        email: r.userEmail || "",
        firstName: r.userFirstName || null,
        lastName: r.userLastName || null,
        name: `${r.userFirstName || ""} ${r.userLastName || ""}`.trim() || r.userEmail,
        role: r.userRole,
      },
    }));

    return {
      requests: formattedRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      metrics: {
        pendingCount: Number(stats.pending_count || 0),
        approvedCount: Number(stats.approved_count || 0),
        rejectedCount: Number(stats.rejected_count || 0),
        totalApprovedAmount: Number(stats.total_approved_amount || 0),
        totalApprovedCredits: Number(stats.total_approved_credits || 0),
      },
    };
  }

  /**
   * Approves a pending credit purchase request and automatically credits the user account.
   */
  async approveRequest(requestId: string, adminUserId: string) {
    logger.info("[CreditRequestService] Approving credit request", {
      requestId,
      adminUserId,
    });

    const rows = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM "CreditPurchaseRequest" WHERE id = ${requestId} LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      throw new ApiError(404, "Credit purchase request not found");
    }

    const request = rows[0];

    if (request.status === "APPROVED") {
      logger.info("[CreditRequestService] Request already approved", { requestId });
      return { request, message: "Request already approved" };
    }

    if (request.status === "REJECTED") {
      throw new ApiError(
        400,
        "This request has previously been rejected. Create a new request if needed.",
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: request.userId },
      include: {
        candidateProfile: true,
        recruiterProfile: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "User account associated with this request not found");
    }

    const creditsToAdd = Number(request.credits);
    let newBalance = 0;

    // Atomic transaction: update request status + update user credit balance
    await prisma.$transaction(async (tx) => {
      // 1. Mark request as APPROVED
      await tx.$executeRawUnsafe(
        `UPDATE "CreditPurchaseRequest" 
         SET "status" = 'APPROVED', "approvedBy" = $1, "approvedAt" = NOW(), "updatedAt" = NOW()
         WHERE "id" = $2`,
        adminUserId,
        requestId,
      );

      // 2. Add credits to the appropriate profile
      if (request.userRole === "CANDIDATE") {
        if (!user.candidateProfile) {
          throw new ApiError(400, "User does not have an active CandidateProfile");
        }
        const updatedCandidate = await tx.candidateProfile.update({
          where: { id: user.candidateProfile.id },
          data: {
            practiceCredits: { increment: creditsToAdd },
          },
          select: { practiceCredits: true, practiceCreditsUsed: true },
        });
        newBalance = updatedCandidate.practiceCredits - updatedCandidate.practiceCreditsUsed;
      } else if (request.userRole === "RECRUITER") {
        if (!user.recruiterProfile) {
          throw new ApiError(400, "User does not have an active RecruiterProfile");
        }
        const updatedRecruiter = await tx.recruiterProfile.update({
          where: { id: user.recruiterProfile.id },
          data: {
            interviewCredits: { increment: creditsToAdd },
          },
          select: { interviewCredits: true },
        });
        newBalance = updatedRecruiter.interviewCredits;

        // Also record in Payment table for accounting & recruiter receipt
        await tx.payment.create({
          data: {
            recruiterId: user.recruiterProfile.id,
            type: "CREDIT_PURCHASE",
            amount: Number(request.amount),
            currency: "INR",
            status: "COMPLETED",
            creditsAdded: creditsToAdd,
            receiptNumber: `UTR-${request.utrNumber}`,
            razorpayPaymentId: `UPI-${request.utrNumber}`,
          },
        });
      }
    });

    logger.info("[CreditRequestService] Request approved and credits allotted successfully", {
      requestId,
      userId: user.id,
      userRole: request.userRole,
      creditsAdded: creditsToAdd,
      newBalance,
    });

    // Queue confirmation email (non-blocking)
    try {
      await queueEmail("payment-confirmation", {
        recruiterEmail: user.email,
        recruiterName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
        credits: creditsToAdd,
        amountPaid: Number(request.amount),
      });
    } catch (emailErr) {
      logger.warn("[CreditRequestService] Failed to queue confirmation email", emailErr);
    }

    return {
      success: true,
      requestId,
      status: "APPROVED",
      creditsAdded: creditsToAdd,
      newBalance,
      message: `Successfully approved request and credited ${creditsToAdd} credits to ${user.email}!`,
    };
  }

  /**
   * Rejects a pending credit purchase request.
   */
  async rejectRequest(requestId: string, adminUserId: string, note?: string) {
    logger.info("[CreditRequestService] Rejecting credit request", {
      requestId,
      adminUserId,
      note,
    });

    const rows = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM "CreditPurchaseRequest" WHERE id = ${requestId} LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      throw new ApiError(404, "Credit purchase request not found");
    }

    const request = rows[0];

    if (request.status !== "PENDING") {
      throw new ApiError(
        400,
        `Cannot reject request with status '${request.status}'`,
      );
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "CreditPurchaseRequest" 
       SET "status" = 'REJECTED', "adminNote" = $1, "approvedBy" = $2, "approvedAt" = NOW(), "updatedAt" = NOW()
       WHERE "id" = $3`,
      note || "Payment unverified or reference number mismatch",
      adminUserId,
      requestId,
    );

    logger.info("[CreditRequestService] Credit request rejected", { requestId });

    return {
      success: true,
      requestId,
      status: "REJECTED",
      adminNote: note,
      message: "Credit purchase request rejected successfully",
    };
  }
}

export const creditRequestService = new CreditRequestService();

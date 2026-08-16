import { config } from "../../config/index.js";
import { logger } from "../../utils/logger.js";
import { ApiError } from "../../utils/ApiError.js";

interface FingerprintResponse {
  visitorId: string;
  requestId: string;
  confidence: {
    score: number; // 0.0 to 1.0
  };
  ipAddress: string;
  browserDetails: {
    browserName: string;
    browserVersion: string;
    os: string;
    osVersion: string;
  };
}

export class FingerprintService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = config.fingerprint.apiKey;
    this.apiUrl = "https://api.fpjs.io";
  }

  // verifyFingerprint
  // Validates a visitor ID with FingerprintJS Pro API.
  //
  // Returns:
  // - isValid: whether the fingerprint is legitimate
  // - confidence: score from 0.0 (low) to 1.0 (high)
  // - riskLevel: 'low', 'medium', 'high'
  //
  // Throws 400 if the requestId is invalid or expired (10 min window).

  async verifyFingerprint(
    visitorId: string,
    requestId: string,
  ): Promise<{
    isValid: boolean;
    confidence: number;
    riskLevel: "low" | "medium" | "high";
    details: Partial<FingerprintResponse>;
  }> {
    try {
      // Call FingerprintJS Pro Server API
      const response = await fetch(`${this.apiUrl}/events/${requestId}`, {
        method: "GET",
        headers: {
          "Auth-API-Key": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new ApiError(400, "Invalid or expired fingerprint request");
        }
        throw new ApiError(502, "Fingerprint verification service unavailable");
      }

      const data = (await response.json()) as {
        products: { identification: FingerprintResponse };
      };
      const fpData = data.products.identification;

      // Verify visitor ID matches
      if (fpData.visitorId !== visitorId) {
        logger.warn("[FingerprintService] Visitor ID mismatch", {
          expected: visitorId,
          actual: fpData.visitorId,
        });
        throw new ApiError(400, "Fingerprint verification failed");
      }

      const confidence = fpData.confidence.score;

      // Determine risk level based on confidence score
      let riskLevel: "low" | "medium" | "high";
      if (confidence >= 0.9) riskLevel = "low";
      else if (confidence >= 0.7) riskLevel = "medium";
      else riskLevel = "high";

      logger.info("[FingerprintService] Fingerprint verified", {
        visitorId,
        confidence,
        riskLevel,
      });

      return {
        isValid: true,
        confidence,
        riskLevel,
        details: {
          ipAddress: fpData.ipAddress,
          browserDetails: fpData.browserDetails,
        },
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("[FingerprintService] Verification error", error);
      throw new ApiError(500, "Failed to verify device fingerprint");
    }
  }

  // checkForDuplicates
  // Utility method to check if a visitor ID is associated with multiple
  // candidate accounts. Called by candidateService.validateAndStoreFingerprint.
  //
  // This is a passive check — the actual enforcement logic lives in the
  // service layer to keep concerns separated.

  async checkForDuplicates(
    visitorId: string,
    excludeCandidateId?: string,
  ): Promise<{ count: number; riskLevel: "low" | "medium" | "high" }> {
    // This is a placeholder — the actual duplicate check is done in
    // candidateService using the database. This method could be extended
    // in the future to call FingerprintJS's visitor history API.

    logger.info("[FingerprintService] Duplicate check requested", {
      visitorId,
    });

    return {
      count: 0,
      riskLevel: "low",
    };
  }
}

export const fingerprintService = new FingerprintService();

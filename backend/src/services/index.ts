// Services Index - Central export for all services and their types

export { authService } from "./auth.service.js";
export type { ClerkUserData, ClerkEmailAddress } from "./auth.service.js";

export { userService } from "./users.service.js";

export { recruiterService } from "./recruiters.service.js";
export type { RecruiterProfileUpdate } from "./recruiters.service.js";

export { candidateService } from "./candidates.service.js";
export type { CandidateUpdateData } from "./candidates.service.js";

export { jobService } from "./jobs.service.js";

export { practiceService } from "./practice.service.js";

export { applicationService } from "./applications.service.js";

export { interviewService } from "./interviews.service.js";

export { creditsService } from "./credits.service.js";
export type { RecruiterBalance, CandidateBalance } from "./credits.service.js";

export { paymentsService } from "./payments.service.js";
export type {
  CreateOrderResult,
  VerifyPaymentDTO,
} from "./payments.service.js";

export { adminService } from "./admin.service.js";

export { screeningService } from "./screening.service.js";

// AI Services
export { aiEngine } from "./ai/AIEngine.js";

// Email Service
export { emailService } from "./email/EmailService.js";

// Storage Service
export { s3Service } from "./storage/S3Service.js";

// Fingerprint Service
export { fingerprintService } from "./fingerprint/FingerprintService.js";

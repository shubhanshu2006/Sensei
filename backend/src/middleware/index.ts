// Authentication
export { authenticateUser, optionalAuth } from "./auth.middleware.js";

// Authorization / RBAC
export {
  requireRole,
  requireRecruiterProfile,
  requireCandidateProfile,
  requireAdminProfile,
} from "./authorization.middleware.js";

// Request validation
export {
  validateBody,
  validateQuery,
  validateParams,
} from "./validation.middleware.js";

// Error handling
export { errorHandler, notFoundHandler } from "./error.middleware.js";

// Rate limiting
export {
  apiLimiter,
  authLimiter,
  interviewLimiter,
  uploadLimiter,
} from "./rate-limit.middleware.js";

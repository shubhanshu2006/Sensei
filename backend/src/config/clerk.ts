import { createClerkClient, verifyToken as clerkVerifyToken } from '@clerk/backend';
import { config } from './index.js';

// The underlying Clerk client for user management operations.
const _client = createClerkClient({ secretKey: config.clerk.secretKey });

/**
 * Clerk client wrapper that exposes a `verifyToken` method consistent
 * with the middleware contract, plus the full `createClerkClient` surface
 * for other operations (users, sessions, etc.).
 */
export const clerkClient = {
  ..._client,
  /**
   * Verifies a Clerk session JWT and returns its decoded payload.
   * `payload.sub` is the Clerk user ID (clerkId).
   */
  verifyToken: (token: string) =>
    clerkVerifyToken(token, { secretKey: config.clerk.secretKey }),
};

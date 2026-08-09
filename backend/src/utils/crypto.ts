import crypto from "crypto";

// Token generation
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Generate a session token prefixed with 'sess_'.
 * Uses 32 random bytes for the token portion.
 */
export function generateSessionToken(): string {
  return `sess_${generateToken(32)}`;
}

// HMAC helpers
export function hashHmac(
  secret: string | Buffer,
  payload: string | Buffer,
): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyHmac(
  secret: string | Buffer,
  payload: string | Buffer,
  signature: string,
): boolean {
  const expected = hashHmac(secret, payload);

  // Both buffers must be the same byte-length for timingSafeEqual.
  // If they differ in length (e.g. truncated signature) the comparison is
  // inherently unequal — compare against a same-length dummy to keep constant
  // time behaviour.
  const expectedBuf = Buffer.from(expected, "hex");
  const signatureBuf = Buffer.from(
    signature.padEnd(expected.length, "0"),
    "hex",
  );

  if (expectedBuf.length !== signatureBuf.length) {
    // Lengths still differ after padding — definitely not equal.
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

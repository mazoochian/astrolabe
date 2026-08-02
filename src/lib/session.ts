import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Hardcoded credentials for the demo login.
 * In a real app these would come from a database with hashed passwords.
 */
export const CREDENTIALS = {
  email: process.env.ASTROLABE_DEMO_EMAIL ?? "nadia@astrolabe.io",
  password: process.env.ASTROLABE_DEMO_PASSWORD ?? "astrolabe-demo-2026",
} as const;

export const SESSION_COOKIE_NAME = "astrolabe_session";

/**
 * A secret key used to sign session cookies.
 * In production this would come from an environment variable.
 */
const SECRET_KEY =
  process.env.ASTROLABE_SESSION_SECRET ?? "astrolabe-dev-secret-change-in-production";

/**
 * Creates a signed session token containing the user's email and an expiry timestamp.
 * Format: base64(payload).base64(hmac)
 */
export function createSessionToken(email: string, expiresAt: number): string {
  const payload = JSON.stringify({ email, expiresAt });
  const payloadB64 = Buffer.from(payload, "utf-8").toString("base64url");
  const signature = createHmac("sha256", SECRET_KEY).update(payloadB64).digest("base64url");
  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a signed session token and returns the decoded payload.
 * Returns null if the token is malformed, tampered with, or expired.
 */
export function verifySessionToken(token: string): { email: string; expiresAt: number } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return null;

  const expectedSignature = createHmac("sha256", SECRET_KEY).update(payloadB64).digest("base64url");

  const tokenSig = Buffer.from(signature);
  const expectedSig = Buffer.from(expectedSignature);

  if (tokenSig.length !== expectedSig.length) return null;
  if (!timingSafeEqual(tokenSig, expectedSig)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8")) as {
      email: string;
      expiresAt: number;
    };

    if (
      typeof payload.email !== "string" ||
      payload.email !== CREDENTIALS.email ||
      typeof payload.expiresAt !== "number" ||
      !Number.isFinite(payload.expiresAt) ||
      Date.now() > payload.expiresAt
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Validates the given email/password against the hardcoded credentials.
 * Uses timingSafeEqual to prevent timing attacks.
 */
export function validateCredentials(email: string, password: string): boolean {
  const digest = (value: string) => createHmac("sha256", SECRET_KEY).update(value).digest();
  const emailMatch = timingSafeEqual(digest(email), digest(CREDENTIALS.email));
  const passwordMatch = timingSafeEqual(digest(password), digest(CREDENTIALS.password));
  return emailMatch && passwordMatch;
}

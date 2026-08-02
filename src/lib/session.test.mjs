import assert from "node:assert/strict";
import test from "node:test";
import {
  CREDENTIALS,
  createSessionToken,
  validateCredentials,
  verifySessionToken,
} from "./session.ts";

test("accepts the configured demo credentials", () => {
  assert.equal(validateCredentials(CREDENTIALS.email, CREDENTIALS.password), true);
});

test("rejects incorrect credentials regardless of input length", () => {
  assert.equal(validateCredentials("x", "y"), false);
  assert.equal(validateCredentials(CREDENTIALS.email, `${CREDENTIALS.password}-wrong`), false);
});

test("creates and verifies an unexpired session", () => {
  const expiresAt = Date.now() + 60_000;
  const token = createSessionToken(CREDENTIALS.email, expiresAt);

  assert.deepEqual(verifySessionToken(token), {
    email: CREDENTIALS.email,
    expiresAt,
  });
});

test("rejects expired, tampered, malformed, and unknown-user sessions", () => {
  const validToken = createSessionToken(CREDENTIALS.email, Date.now() + 60_000);
  const [payload, signature] = validToken.split(".");

  assert.equal(verifySessionToken(createSessionToken(CREDENTIALS.email, Date.now() - 1)), null);
  assert.equal(verifySessionToken(`${payload}.${signature}x`), null);
  assert.equal(verifySessionToken("not-a-session"), null);
  assert.equal(verifySessionToken(createSessionToken("other@example.com", Date.now() + 60_000)), null);
});

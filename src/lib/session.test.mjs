import assert from "node:assert/strict";
import test from "node:test";
import { createSessionToken, verifySessionToken } from "./session.ts";

const user = { id: "user-1", email: "nadia@astrolabe.io" };

test("creates and verifies an unexpired session", () => {
  const expiresAt = Date.now() + 60_000;
  const token = createSessionToken(user.id, user.email, expiresAt);

  assert.deepEqual(verifySessionToken(token), {
    userId: user.id,
    email: user.email,
    expiresAt,
  });
});

test("rejects expired, tampered, malformed, and unknown-user sessions", () => {
  const validToken = createSessionToken(user.id, user.email, Date.now() + 60_000);
  const [payload, signature] = validToken.split(".");

  assert.equal(verifySessionToken(createSessionToken(user.id, user.email, Date.now() - 1)), null);
  assert.equal(verifySessionToken(`${payload}.${signature}x`), null);
  assert.equal(verifySessionToken("not-a-session"), null);
  assert.equal(verifySessionToken(createSessionToken("", user.email, Date.now() + 60_000)), null);
});

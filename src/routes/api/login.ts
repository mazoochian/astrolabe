import { getCookie, readBody, setCookie } from "vinxi/http";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  validateCredentials,
  verifySessionToken,
} from "~/lib/session";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export async function POST() {
  let body: { email?: unknown; password?: unknown };

  try {
    body = await readBody();
  } catch {
    return json({ error: "The request body must be valid JSON." }, 400);
  }

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return json({ error: "Email and password are required." }, 400);
  }

  if (email.length > 254 || password.length > 1024) {
    return json({ error: "Invalid email or password." }, 401);
  }

  if (!validateCredentials(email, password)) {
    return json({ error: "Invalid email or password." }, 401);
  }

  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const token = createSessionToken(email, expiresAt);

  setCookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });

  return json({ email, redirect: "/dashboard" });
}

export async function GET() {
  const token = getCookie(SESSION_COOKIE_NAME);

  if (!token) {
    return json({ authenticated: false }, 200);
  }

  const session = verifySessionToken(token);

  if (!session) {
    return json({ authenticated: false }, 200);
  }

  return json({ authenticated: true, email: session.email }, 200);
}

function json(data: unknown, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

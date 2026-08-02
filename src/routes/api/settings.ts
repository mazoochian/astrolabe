import { readBody, setCookie } from "vinxi/http";
import { getApiUser, json } from "~/lib/api-auth";
import { createSessionToken, SESSION_COOKIE_NAME } from "~/lib/session";
import { getUserStore } from "~/lib/user-store";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;
const ttlOptions = ["Auto", "5 min", "1 hour", "4 hours"];

export function GET() {
  const user = getApiUser();
  return user ? json({ user }) : json({ error: "Unauthorized." }, 401);
}

export async function PATCH() {
  const user = getApiUser();
  if (!user) return json({ error: "Unauthorized." }, 401);

  let body: Record<string, unknown>;
  try {
    const value = await readBody<unknown>();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    body = value as Record<string, unknown>;
  } catch {
    return json({ error: "The request body must be valid JSON." }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  const theme = body.theme;
  const defaultTtl = body.defaultTtl;
  if (
    !email.includes("@") ||
    email.length > 254 ||
    !displayName ||
    displayName.length > 100 ||
    (theme !== "light" && theme !== "dark") ||
    typeof defaultTtl !== "string" ||
    !ttlOptions.includes(defaultTtl) ||
    typeof body.proxyByDefault !== "boolean"
  ) {
    return json({ error: "Invalid account settings." }, 400);
  }

  try {
    const updated = getUserStore().updateUser(user.id, {
      email,
      displayName,
      theme,
      defaultTtl,
      proxyByDefault: body.proxyByDefault,
    });
    if (!updated) return json({ error: "Account not found." }, 404);

    const expiresAt = Date.now() + SESSION_DURATION_MS;
    setCookie(SESSION_COOKIE_NAME, createSessionToken(updated.id, updated.email, expiresAt), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(expiresAt),
    });
    return json({ user: updated });
  } catch {
    return json({ error: "That email address is already in use." }, 409);
  }
}

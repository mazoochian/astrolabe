import { getCookie } from "vinxi/http";
import { getUserFromSession } from "~/lib/auth";
import { SESSION_COOKIE_NAME } from "~/lib/session";

export function getApiUser() {
  const token = getCookie(SESSION_COOKIE_NAME);
  return token ? getUserFromSession(token) : null;
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

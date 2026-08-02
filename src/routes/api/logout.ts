import { deleteCookie } from "vinxi/http";
import { SESSION_COOKIE_NAME } from "~/lib/session";

export async function POST() {
  deleteCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return json({ redirect: "/" }, 200);
}

function json(data: unknown, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

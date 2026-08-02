import { readBody } from "vinxi/http";
import { getApiUser, json } from "~/lib/api-auth";
import { getControlPlaneStore } from "~/lib/control-plane-store";
import { memberRoles, type Member } from "~/lib/domain";

export function GET() {
  const user = getApiUser();
  if (!user) return json({ error: "Unauthorized." }, 401);
  const store = getControlPlaneStore();
  return json({ members: store.listMembers(user.id), tokens: store.listTokens(user.id) });
}

export async function POST() {
  const user = getApiUser();
  if (!user) return json({ error: "Unauthorized." }, 401);
  const body = await safeBody();
  if (!body) return json({ error: "The request body must be valid JSON." }, 400);
  const store = getControlPlaneStore();

  if (body.kind === "token") return json({ token: store.createToken(user.id) }, 201);
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const role = body.role;
  const scope = typeof body.scope === "string" ? body.scope.trim() : "";
  if (
    body.kind !== "member" ||
    !email.includes("@") ||
    !scope ||
    typeof role !== "string" ||
    !memberRoles.includes(role as Member["role"])
  ) {
    return json({ error: "A valid email, role, and scope are required." }, 400);
  }
  try {
    return json({ member: store.createMember(user.id, email, role as Member["role"], scope) }, 201);
  } catch {
    return json({ error: "That member already exists." }, 409);
  }
}

export async function DELETE() {
  const user = getApiUser();
  if (!user) return json({ error: "Unauthorized." }, 401);
  const body = await safeBody();
  const id = typeof body?.id === "string" ? body.id : "";
  const store = getControlPlaneStore();
  const deleted =
    body?.kind === "member"
      ? store.deleteMember(user.id, id)
      : body?.kind === "token"
        ? store.deleteToken(user.id, id)
        : false;
  return deleted
    ? new Response(null, { status: 204 })
    : json({ error: "Access entry not found." }, 404);
}

async function safeBody(): Promise<Record<string, unknown> | null> {
  try {
    const value = await readBody<unknown>();
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

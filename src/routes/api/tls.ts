import { getQuery, readBody } from "vinxi/http";
import { getApiUser, json } from "~/lib/api-auth";
import { getControlPlaneStore } from "~/lib/control-plane-store";

export function GET() {
  const user = getApiUser();
  if (!user) return json({ error: "Unauthorized." }, 401);
  const zoneId = getQuery().zoneId;
  if (typeof zoneId !== "string" || !zoneId) return json({ error: "zoneId is required." }, 400);
  return json({ certificates: getControlPlaneStore().listCertificates(user.id, zoneId) });
}

export async function POST() {
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

  const zoneId = typeof body.zoneId === "string" ? body.zoneId : "";
  const hosts = typeof body.hosts === "string" ? body.hosts.trim() : "";
  if (!zoneId || !hosts || hosts.length > 2048) {
    return json({ error: "A valid zoneId and hostname are required." }, 400);
  }

  const certificate = getControlPlaneStore().createCertificate(user.id, zoneId, hosts);
  return certificate ? json({ certificate }, 201) : json({ error: "Zone not found." }, 404);
}

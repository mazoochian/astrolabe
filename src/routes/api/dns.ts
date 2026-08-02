import { getQuery, readBody } from "vinxi/http";
import { getApiUser, json } from "~/lib/api-auth";
import { getControlPlaneStore } from "~/lib/control-plane-store";
import { dnsRecordTypes, type DnsRecordInput } from "~/lib/domain";

export function GET() {
  const user = getApiUser();
  if (!user) return json({ error: "Unauthorized." }, 401);

  const zoneId = getQuery().zoneId;
  if (typeof zoneId !== "string" || !zoneId) return json({ error: "zoneId is required." }, 400);

  return json({ records: getControlPlaneStore().listRecords(user.id, zoneId) });
}

export async function POST() {
  return writeRecord("create");
}

export async function PATCH() {
  return writeRecord("update");
}

export async function DELETE() {
  const user = getApiUser();
  if (!user) return json({ error: "Unauthorized." }, 401);

  const body = await safeBody();
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return json({ error: "id is required." }, 400);

  return getControlPlaneStore().deleteRecord(user.id, id)
    ? new Response(null, { status: 204 })
    : json({ error: "DNS record not found." }, 404);
}

async function writeRecord(mode: "create" | "update") {
  const user = getApiUser();
  if (!user) return json({ error: "Unauthorized." }, 401);

  const body = await safeBody();
  if (!body) return json({ error: "The request body must be valid JSON." }, 400);
  const input = parseRecord(body);
  if (!input) return json({ error: "Invalid DNS record." }, 400);

  const store = getControlPlaneStore();
  const record =
    mode === "create"
      ? store.createRecord(user.id, typeof body.zoneId === "string" ? body.zoneId : "", input)
      : store.updateRecord(user.id, typeof body.id === "string" ? body.id : "", input);

  return record
    ? json({ record }, mode === "create" ? 201 : 200)
    : json({ error: mode === "create" ? "Zone not found." : "DNS record not found." }, 404);
}

async function safeBody(): Promise<Record<string, unknown> | null> {
  try {
    const body = await readBody<unknown>();
    return body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function parseRecord(body: Record<string, unknown>): DnsRecordInput | null {
  const type = body.type;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const ttl = typeof body.ttl === "string" ? body.ttl.trim() : "";
  if (
    typeof type !== "string" ||
    !dnsRecordTypes.includes(type as DnsRecordInput["type"]) ||
    !name ||
    !content ||
    !ttl ||
    typeof body.proxied !== "boolean" ||
    name.length > 253 ||
    content.length > 2048 ||
    ttl.length > 32
  ) {
    return null;
  }
  return { type: type as DnsRecordInput["type"], name, content, ttl, proxied: body.proxied };
}

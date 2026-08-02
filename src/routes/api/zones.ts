import { getApiUser, json } from "~/lib/api-auth";
import { getControlPlaneStore } from "~/lib/control-plane-store";

export function GET() {
  const user = getApiUser();
  if (!user) return json({ error: "Unauthorized." }, 401);

  return json({ zones: getControlPlaneStore().listZones(user.id) });
}

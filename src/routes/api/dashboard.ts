import { getQuery } from "vinxi/http";
import { getApiUser, json } from "~/lib/api-auth";
import { getControlPlaneStore } from "~/lib/control-plane-store";
import { fetchCoreDnsMetrics } from "~/lib/coredns-metrics";

export async function GET() {
  const user = getApiUser();
  if (!user) return json({ error: "Unauthorized." }, 401);
  const zoneId = getQuery().zoneId;
  const zone = getControlPlaneStore()
    .listZones(user.id)
    .find((item) => item.id === zoneId);
  if (!zone) return json({ error: "Zone not found." }, 404);

  const metricsUrl = process.env.COREDNS_METRICS_URL;
  if (!metricsUrl) return json({ source: "unconfigured", zone, metrics: null });

  try {
    return json({
      source: "coredns",
      zone,
      metrics: await fetchCoreDnsMetrics(metricsUrl, zone.name),
    });
  } catch (error) {
    return json(
      {
        source: "unavailable",
        zone,
        metrics: null,
        error: error instanceof Error ? error.message : "CoreDNS metrics are unavailable.",
      },
      502,
    );
  }
}

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

  const prometheusUrl = process.env.PROMETHEUS_URL;
  if (!prometheusUrl) return json({ source: "unconfigured", zone, metrics: null });

  try {
    return json({
      source: "prometheus",
      zone,
      metrics: await fetchCoreDnsMetrics(prometheusUrl, zone.name),
    });
  } catch (error) {
    return json(
      {
        source: "unavailable",
        zone,
        metrics: null,
        error: error instanceof Error ? error.message : "Prometheus metrics are unavailable.",
      },
      502,
    );
  }
}

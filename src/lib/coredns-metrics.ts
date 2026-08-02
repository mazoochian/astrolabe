export type CoreDnsMetrics = {
  requests: number;
  cacheHits: number;
  meanLatencyMs: number;
  responses: Record<string, number>;
  queryTypes: Record<string, number>;
};

type Sample = { name: string; labels: Record<string, string>; value: number };

export function parseCoreDnsMetrics(text: string, zone: string): CoreDnsMetrics {
  const normalizedZone = zone.endsWith(".") ? zone : `${zone}.`;
  const samples = text
    .split(/\r?\n/)
    .map(parseSample)
    .filter((sample): sample is Sample => sample !== null)
    .filter(
      (sample) =>
        !sample.labels.zone || sample.labels.zone === normalizedZone || sample.labels.zone === zone,
    );

  const sum = (name: string) =>
    samples
      .filter((sample) => sample.name === name)
      .reduce((total, sample) => total + sample.value, 0);
  const requests = sum("coredns_dns_requests_total");
  const cacheHits = samples
    .filter((sample) => sample.name === "coredns_cache_hits_total")
    .filter(
      (sample) =>
        !sample.labels.zones ||
        sample.labels.zones === normalizedZone ||
        sample.labels.zones === zone,
    )
    .reduce((total, sample) => total + sample.value, 0);
  const durationSum = sum("coredns_dns_request_duration_seconds_sum");
  const durationCount = sum("coredns_dns_request_duration_seconds_count");

  return {
    requests,
    cacheHits,
    meanLatencyMs: durationCount ? (durationSum / durationCount) * 1000 : 0,
    responses: group(samples, "coredns_dns_responses_total", "rcode"),
    queryTypes: group(samples, "coredns_dns_requests_total", "type"),
  };
}

export async function fetchCoreDnsMetrics(url: string, zone: string): Promise<CoreDnsMetrics> {
  const endpoint = new URL(url);
  if (!["http:", "https:"].includes(endpoint.protocol))
    throw new Error("CoreDNS metrics URL must use HTTP or HTTPS.");
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(3000) });
  if (!response.ok) throw new Error(`CoreDNS metrics request failed with ${response.status}.`);
  return parseCoreDnsMetrics(await response.text(), zone);
}

function group(samples: Sample[], metric: string, label: string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const sample of samples) {
    if (sample.name !== metric || !sample.labels[label]) continue;
    result[sample.labels[label]] = (result[sample.labels[label]] ?? 0) + sample.value;
  }
  return result;
}

function parseSample(line: string): Sample | null {
  if (!line || line.startsWith("#")) return null;
  const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{([^}]*)\})?\s+([^\s]+)(?:\s+\d+)?$/);
  if (!match) return null;
  const value = Number(match[3]);
  if (!Number.isFinite(value)) return null;
  const labels: Record<string, string> = {};
  for (const label of match[2]?.matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)="((?:\\.|[^"])*)"/g) ?? []) {
    labels[label[1]] = label[2].replace(/\\([\\"n])/g, (_, escaped: string) =>
      escaped === "n" ? "\n" : escaped,
    );
  }
  return { name: match[1], labels, value };
}

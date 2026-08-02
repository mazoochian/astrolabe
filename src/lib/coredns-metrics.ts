export type TrafficPoint = { t: string; requests: number; cached: number };

export type CoreDnsMetrics = {
  requests: number;
  cacheHits: number;
  meanLatencyMs: number;
  responses: Record<string, number>;
  queryTypes: Record<string, number>;
  traffic: TrafficPoint[];
};

type PrometheusSample = { metric: Record<string, string>; value: [number, string] };
type PrometheusSeries = { metric: Record<string, string>; values: [number, string][] };
type PrometheusResult = {
  status: string;
  error?: string;
  data?: { resultType: string; result: PrometheusSample[] | PrometheusSeries[] };
};

export function buildCoreDnsQueries(zone: string) {
  const label = escapePrometheusLabel(zone.endsWith(".") ? zone : `${zone}.`);
  const requests = `coredns_dns_requests_total{zone="${label}"}`;
  const cacheHits = `coredns_cache_hits_total{zones="${label}"}`;
  const duration = `coredns_dns_request_duration_seconds`;

  return {
    requests: `sum(increase(${requests}[24h]))`,
    cacheHits: `sum(increase(${cacheHits}[24h]))`,
    latency: `1000 * sum(rate(${duration}_sum{zone="${label}"}[5m])) / clamp_min(sum(rate(${duration}_count{zone="${label}"}[5m])), 1)`,
    responses: `sum by (rcode) (increase(coredns_dns_responses_total{zone="${label}"}[24h]))`,
    queryTypes: `sum by (type) (increase(${requests}[24h]))`,
    requestRate: `sum(rate(${requests}[5m]))`,
    cacheRate: `sum(rate(${cacheHits}[5m]))`,
  };
}

export async function fetchCoreDnsMetrics(
  prometheusUrl: string,
  zone: string,
  now = Date.now(),
): Promise<CoreDnsMetrics> {
  const queries = buildCoreDnsQueries(zone);
  const end = Math.floor(now / 1000);
  const start = end - 24 * 60 * 60;
  const [requests, cacheHits, latency, responses, queryTypes, requestRate, cacheRate] =
    await Promise.all([
      instantQuery(prometheusUrl, queries.requests, end),
      instantQuery(prometheusUrl, queries.cacheHits, end),
      instantQuery(prometheusUrl, queries.latency, end),
      instantQuery(prometheusUrl, queries.responses, end),
      instantQuery(prometheusUrl, queries.queryTypes, end),
      rangeQuery(prometheusUrl, queries.requestRate, start, end),
      rangeQuery(prometheusUrl, queries.cacheRate, start, end),
    ]);

  return {
    requests: scalar(requests),
    cacheHits: scalar(cacheHits),
    meanLatencyMs: scalar(latency),
    responses: grouped(responses, "rcode"),
    queryTypes: grouped(queryTypes, "type"),
    traffic: mergeTraffic(requestRate, cacheRate),
  };
}

export function parsePrometheusResponse(payload: unknown, expectedType: "vector" | "matrix") {
  const response = payload as PrometheusResult;
  if (response?.status !== "success" || response.data?.resultType !== expectedType) {
    throw new Error(response?.error || `Prometheus returned an invalid ${expectedType} response.`);
  }
  return response.data.result;
}

function escapePrometheusLabel(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"');
}

async function instantQuery(baseUrl: string, query: string, time: number) {
  const payload = await prometheusRequest(baseUrl, "query", { query, time: String(time) });
  return parsePrometheusResponse(payload, "vector") as PrometheusSample[];
}

async function rangeQuery(baseUrl: string, query: string, start: number, end: number) {
  const payload = await prometheusRequest(baseUrl, "query_range", {
    query,
    start: String(start),
    end: String(end),
    step: "3h",
  });
  return parsePrometheusResponse(payload, "matrix") as PrometheusSeries[];
}

async function prometheusRequest(
  baseUrl: string,
  endpoint: string,
  parameters: Record<string, string>,
) {
  const url = new URL(baseUrl);
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("Prometheus URL must use HTTP or HTTPS.");
  url.pathname = `${url.pathname.replace(/\/$/, "")}/api/v1/${endpoint}`;
  url.search = new URLSearchParams(parameters).toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
  if (!response.ok) throw new Error(`Prometheus request failed with ${response.status}.`);
  return response.json();
}

function scalar(samples: PrometheusSample[]): number {
  return finiteNumber(samples[0]?.value[1]);
}

function grouped(samples: PrometheusSample[], label: string): Record<string, number> {
  return Object.fromEntries(
    samples
      .filter((sample) => sample.metric[label])
      .map((sample) => [sample.metric[label], finiteNumber(sample.value[1])]),
  );
}

function mergeTraffic(requestSeries: PrometheusSeries[], cacheSeries: PrometheusSeries[]) {
  const cached = new Map(
    (cacheSeries[0]?.values ?? []).map(([timestamp, value]) => [timestamp, finiteNumber(value)]),
  );
  return (requestSeries[0]?.values ?? []).map(([timestamp, value]) => ({
    t: new Date(timestamp * 1000).toLocaleTimeString("en", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }),
    requests: finiteNumber(value),
    cached: cached.get(timestamp) ?? 0,
  }));
}

function finiteNumber(value: string | undefined): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

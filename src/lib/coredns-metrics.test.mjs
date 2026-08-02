import assert from "node:assert/strict";
import test from "node:test";
import { URL } from "node:url";
import {
  buildCoreDnsQueries,
  fetchCoreDnsMetrics,
  parsePrometheusResponse,
} from "./coredns-metrics.ts";

test("builds zone-scoped CoreDNS PromQL queries", () => {
  const queries = buildCoreDnsQueries('example"zone');
  assert.match(queries.requests, /zone="example\\"zone\."/);
  assert.match(queries.cacheHits, /zones="example\\"zone\."/);
  assert.match(queries.responses, /sum by \(rcode\)/);
  assert.match(queries.requestRate, /rate\(.+\[5m\]\)/);
});

test("accepts a successful Prometheus vector response", () => {
  const result = [{ metric: { rcode: "NOERROR" }, value: [1, "42"] }];
  assert.deepEqual(
    parsePrometheusResponse(
      { status: "success", data: { resultType: "vector", result } },
      "vector",
    ),
    result,
  );
});

test("rejects errors and unexpected Prometheus result types", () => {
  assert.throws(
    () => parsePrometheusResponse({ status: "error", error: "bad query" }, "vector"),
    /bad query/,
  );
  assert.throws(
    () =>
      parsePrometheusResponse(
        { status: "success", data: { resultType: "matrix", result: [] } },
        "vector",
      ),
    /invalid vector response/,
  );
});

test("assembles instant and historical Prometheus results for the dashboard", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => (globalThis.fetch = originalFetch));
  globalThis.fetch = async (url) => {
    const endpoint = new URL(url);
    const query = endpoint.searchParams.get("query");
    const isRange = endpoint.pathname.endsWith("query_range");
    let result;
    if (isRange) {
      const values = query.includes("cache_hits") ? [[1_700_000_000, "3"]] : [[1_700_000_000, "5"]];
      result = [{ metric: {}, values }];
    } else if (query.includes("by (rcode)")) {
      result = [{ metric: { rcode: "NOERROR" }, value: [1_700_000_000, "90"] }];
    } else if (query.includes("by (type)")) {
      result = [{ metric: { type: "A" }, value: [1_700_000_000, "75"] }];
    } else {
      const value = query.includes("cache_hits") ? "60" : query.startsWith("1000") ? "12.5" : "100";
      result = [{ metric: {}, value: [1_700_000_000, value] }];
    }
    return {
      ok: true,
      json: async () => ({
        status: "success",
        data: { resultType: isRange ? "matrix" : "vector", result },
      }),
    };
  };

  assert.deepEqual(
    await fetchCoreDnsMetrics("http://prometheus:9090", "example.com", 1_700_000_000_000),
    {
      requests: 100,
      cacheHits: 60,
      meanLatencyMs: 12.5,
      responses: { NOERROR: 90 },
      queryTypes: { A: 75 },
      traffic: [{ t: "22:13", requests: 5, cached: 3 }],
    },
  );
});

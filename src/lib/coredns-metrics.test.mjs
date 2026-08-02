import assert from "node:assert/strict";
import test from "node:test";
import { parseCoreDnsMetrics } from "./coredns-metrics.ts";

const fixture = `
# HELP coredns_dns_requests_total Counter of DNS requests made per zone.
coredns_dns_requests_total{server="dns://:53",zone="astrolabe.io.",type="A"} 120
coredns_dns_requests_total{server="dns://:53",zone="astrolabe.io.",type="AAAA"} 30
coredns_dns_requests_total{server="dns://:53",zone="other.io.",type="A"} 999
coredns_dns_responses_total{server="dns://:53",zone="astrolabe.io.",rcode="NOERROR",plugin="file"} 140
coredns_dns_responses_total{server="dns://:53",zone="astrolabe.io.",rcode="NXDOMAIN",plugin="file"} 10
coredns_dns_request_duration_seconds_sum{server="dns://:53",zone="astrolabe.io.",type="A"} 3
coredns_dns_request_duration_seconds_count{server="dns://:53",zone="astrolabe.io.",type="A"} 150
coredns_cache_hits_total{server="dns://:53",zones="astrolabe.io.",type="success"} 90
`;

test("aggregates CoreDNS Prometheus metrics for one zone", () => {
  assert.deepEqual(parseCoreDnsMetrics(fixture, "astrolabe.io"), {
    requests: 150,
    cacheHits: 90,
    meanLatencyMs: 20,
    responses: { NOERROR: 140, NXDOMAIN: 10 },
    queryTypes: { A: 120, AAAA: 30 },
  });
});

test("returns zeroed aggregates when a zone has no samples", () => {
  assert.deepEqual(parseCoreDnsMetrics(fixture, "missing.io"), {
    requests: 0,
    cacheHits: 0,
    meanLatencyMs: 0,
    responses: {},
    queryTypes: {},
  });
});

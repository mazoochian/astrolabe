import { Title } from "@solidjs/meta";
import { Activity, ArrowUpRight, Globe2, ShieldCheck, Timer, Zap } from "lucide-solid";
import { For } from "solid-js";
import { LatencyChart, ResponseMixChart, TrafficChart } from "~/components/charts";
import { PageHeader } from "~/components/page-header";
import { Card } from "~/components/ui/card";
import { latencySeries, responseMix, trafficSeries } from "~/lib/mock-data";
import { cn } from "~/lib/utils";

const chartTone = ["var(--chart-2)", "var(--chart-1)", "var(--chart-4)", "var(--chart-5)"];

const stats = [
  {
    label: "Requests · 24h",
    value: "1.42 M",
    delta: "+8.4%",
    icon: Activity,
    tone: "text-primary",
  },
  { label: "Cached", value: "78.6%", delta: "+2.1%", icon: Zap, tone: "text-accent" },
  { label: "Median latency", value: "33 ms", delta: "-6 ms", icon: Timer, tone: "text-info" },
  {
    label: "Threats blocked",
    value: "4 812",
    delta: "+310",
    icon: ShieldCheck,
    tone: "text-warning",
  },
] as const;

const recentActivity = [
  { who: "Ito Mbeki", what: "Updated A record for www", when: "6 min ago" },
  { who: "System", what: "Renewed universal certificate", when: "2 h ago" },
  { who: "terraform-prod", what: "Created CNAME docs", when: "5 h ago" },
  { who: "Priya Raman", what: "Enabled TLS 1.3 only", when: "Yesterday" },
] as const;

export default function DashboardPage() {
  return (
    <>
      <Title>Zone Overview — Astrolabe DNS</Title>

      <PageHeader
        title="astrolabe.io"
        subtitle="Everything looks healthy — last propagation 6 minutes ago."
        action={
          <div class="neo-sm flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
            <Globe2 class="size-4 text-success" />
            All 312 edge locations serving
          </div>
        }
      />

      <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <For each={stats}>
          {(s) => (
            <Card class="p-5">
              <div class="flex items-start justify-between">
                <span class={cn("neo-inset grid size-9 place-items-center", s.tone)}>
                  <s.icon class="size-4" />
                </span>
                <span class="flex items-center gap-1 text-xs text-success">
                  <ArrowUpRight class="size-3" />
                  {s.delta}
                </span>
              </div>
              <p class="mt-5 text-2xl font-semibold">{s.value}</p>
              <p class="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </Card>
          )}
        </For>
      </div>

      <div class="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold">Request volume</h2>
              <p class="text-xs text-muted-foreground">Total vs cached, last 24 hours</p>
            </div>
            <div class="flex gap-3 text-xs text-muted-foreground">
              <span class="flex items-center gap-1.5">
                <span class="size-2 rounded-full bg-chart-1" /> Total
              </span>
              <span class="flex items-center gap-1.5">
                <span class="size-2 rounded-full bg-chart-2" /> Cached
              </span>
            </div>
          </div>
          <div class="mt-6 h-64">
            <TrafficChart data={trafficSeries} />
          </div>
        </Card>

        <Card class="flex flex-col p-6">
          <h2 class="text-base font-semibold">Response mix</h2>
          <p class="text-xs text-muted-foreground">Share of status codes today</p>
          <div class="mt-2 h-48">
            <ResponseMixChart data={responseMix} />
          </div>
          <ul class="mt-3 flex flex-col gap-2">
            <For each={responseMix}>
              {(r, i) => (
                <li class="flex items-center justify-between text-xs">
                  <span class="flex items-center gap-2 text-muted-foreground">
                    <span class="size-2 rounded-full" style={{ background: chartTone[i()] }} />
                    {r.name}
                  </span>
                  <span class="font-medium">{r.value}%</span>
                </li>
              )}
            </For>
          </ul>
        </Card>
      </div>

      <div class="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Card class="p-6">
          <h2 class="text-base font-semibold">Resolver latency</h2>
          <p class="text-xs text-muted-foreground">p50 response time, last 7 days</p>
          <div class="mt-5 h-44">
            <LatencyChart data={latencySeries} />
          </div>
        </Card>

        <Card class="p-6">
          <h2 class="text-base font-semibold">Recent activity</h2>
          <p class="text-xs text-muted-foreground">Changes across this zone</p>
          <ul class="mt-5 flex flex-col gap-3">
            <For each={recentActivity}>
              {(a) => (
                <li class="neo-inset flex items-center justify-between px-4 py-3">
                  <div>
                    <p class="text-sm">{a.what}</p>
                    <p class="text-xs text-muted-foreground">{a.who}</p>
                  </div>
                  <span class="text-xs text-muted-foreground">{a.when}</span>
                </li>
              )}
            </For>
          </ul>
        </Card>
      </div>
    </>
  );
}

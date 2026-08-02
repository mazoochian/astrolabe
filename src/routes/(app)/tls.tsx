import { BadgeCheck, Lock, RefreshCw, ShieldCheck, Sparkles } from "lucide-solid";
import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import type { Certificate, Zone } from "~/lib/domain";
import { cn } from "~/lib/utils";

export default function TlsPage() {
  const [certs, setCerts] = createSignal<Certificate[]>([]);
  const [zone, setZone] = createSignal<Zone | null>(null);
  const [host, setHost] = createSignal("");
  const [minTls, setMinTls] = createSignal("1.2");
  const [loading, setLoading] = createSignal(true);
  const [issuing, setIssuing] = createSignal(false);
  const [error, setError] = createSignal("");
  const activeCount = createMemo(() => certs().filter((cert) => cert.status === "Active").length);

  onMount(async () => {
    try {
      const zoneData = await request<{ zones: Zone[] }>("/api/zones");
      const activeZone = zoneData.zones[0];
      if (!activeZone) throw new Error("No TLS zone is available.");
      setZone(activeZone);
      const data = await request<{ certificates: Certificate[] }>(
        `/api/tls?zoneId=${encodeURIComponent(activeZone.id)}`,
      );
      setCerts(data.certificates);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load certificates.");
    } finally {
      setLoading(false);
    }
  });

  const issue = async () => {
    const activeZone = zone();
    if (!activeZone || !host().trim()) return;
    setError("");
    setIssuing(true);
    try {
      const data = await request<{ certificate: Certificate }>("/api/tls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoneId: activeZone.id, hosts: host().trim() }),
      });
      setCerts((certificates) => [data.certificate, ...certificates]);
      setHost("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to issue the certificate.");
    } finally {
      setIssuing(false);
    }
  };

  return (
    <>
      <PageHeader
        title="TLS / SSL"
        subtitle="Certificates are issued and renewed automatically, 30 days before expiry."
        action={
          <div class="neo-sm flex items-center gap-2 px-4 py-2 text-xs text-success">
            <BadgeCheck class="size-4" />
            Encryption mode: Full (strict)
          </div>
        }
      />

      <div class="grid gap-5 lg:grid-cols-3">
        <For
          each={[
            {
              icon: ShieldCheck,
              label: "Active certificates",
              value: String(activeCount()),
              tone: "text-success",
            },
            { icon: RefreshCw, label: "Auto-renewals this year", value: "11", tone: "text-info" },
            { icon: Lock, label: "HTTPS traffic", value: "99.4%", tone: "text-primary" },
          ]}
        >
          {(s) => (
            <Card class="flex items-center gap-4 p-5">
              <span class={cn("neo-inset grid size-10 place-items-center", s.tone)}>
                <s.icon class="size-4" />
              </span>
              <div>
                <p class="text-xl font-semibold">{s.value}</p>
                <p class="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </Card>
          )}
        </For>
      </div>

      <Show when={error()}>
        <div class="neo-inset rounded-xl px-4 py-3 text-sm text-destructive">{error()}</div>
      </Show>

      <Card class="p-6">
        <div class="flex items-center gap-2">
          <Sparkles class="size-4 text-accent" />
          <h2 class="text-base font-semibold">Request a new certificate</h2>
        </div>
        <p class="mt-1 text-xs text-muted-foreground">
          Astrolabe validates ownership over DNS and installs the certificate at the edge.
        </p>
        <div class="mt-5 flex flex-wrap gap-3">
          <div class="neo-inset min-w-64 flex-1 px-4 py-2.5">
            <Input
              value={host()}
              onInput={(e) => setHost(e.currentTarget.value)}
              placeholder="hostname, e.g. shop.astrolabe.io"
              disabled={issuing()}
            />
          </div>
          <Button onClick={issue} disabled={issuing() || !zone()}>
            {issuing() ? "Issuing…" : "Issue certificate"}
          </Button>
        </div>
      </Card>

      <Card class="overflow-hidden">
        <Show when={loading()}>
          <div class="py-8 text-center text-sm text-muted-foreground">Loading certificates…</div>
        </Show>
        <table class="w-full border-collapse">
          <thead>
            <tr class="text-left text-[0.7rem] uppercase tracking-widest text-muted-foreground">
              <th class="px-5 py-4 font-medium">Hosts</th>
              <th class="px-5 py-4 font-medium">Authority</th>
              <th class="px-5 py-4 font-medium">Type</th>
              <th class="px-5 py-4 font-medium">Status</th>
              <th class="px-5 py-4 font-medium">Expires</th>
            </tr>
          </thead>
          <tbody>
            <For each={certs()}>
              {(c) => (
                <tr class="border-t border-border/70 text-sm">
                  <td class="px-5 py-4 font-mono text-xs">{c.hosts}</td>
                  <td class="px-5 py-4 text-muted-foreground">{c.authority}</td>
                  <td class="px-5 py-4 text-muted-foreground">{c.type}</td>
                  <td class="px-5 py-4">
                    <span
                      class={cn(
                        "neo-inset inline-flex items-center gap-1.5 px-2.5 py-1 text-xs",
                        c.status === "Active" ? "text-success" : "text-warning",
                      )}
                    >
                      <span class="size-1.5 rounded-full bg-current" />
                      {c.status}
                    </span>
                  </td>
                  <td class="px-5 py-4 text-muted-foreground">{c.expires}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </Card>

      <Card class="flex flex-wrap items-center justify-between gap-5 p-6">
        <div>
          <h2 class="text-base font-semibold">Minimum TLS version</h2>
          <p class="mt-1 text-xs text-muted-foreground">
            Older clients will be rejected below this version.
          </p>
        </div>
        <div class="neo-inset flex gap-1 p-1">
          <For each={["1.0", "1.1", "1.2", "1.3"]}>
            {(v) => (
              <button
                onClick={() => setMinTls(v)}
                class={cn(
                  "rounded-lg px-4 py-2 text-xs transition-all",
                  minTls() === v ? "neo-sm text-primary" : "text-muted-foreground",
                )}
              >
                TLS {v}
              </button>
            )}
          </For>
        </div>
      </Card>
    </>
  );
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "The request failed.");
  return data;
}

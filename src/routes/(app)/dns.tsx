import { Check, Cloud, CloudOff, Pencil, Plus, Search, Trash2, X } from "lucide-solid";
import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { dnsRecordTypes, type DnsRecord, type DnsRecordInput, type Zone } from "~/lib/domain";
import { cn } from "~/lib/utils";

export default function DnsPage() {
  const [records, setRecords] = createSignal<DnsRecord[]>([]);
  const [zone, setZone] = createSignal<Zone | null>(null);
  const [editing, setEditing] = createSignal<string | null>(null);
  const [draft, setDraft] = createSignal<DnsRecord | null>(null);
  const [query, setQuery] = createSignal("");
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal("");

  onMount(async () => {
    try {
      const zoneData = await request<{ zones: Zone[] }>("/api/zones");
      const activeZone = zoneData.zones[0];
      if (!activeZone) throw new Error("No DNS zone is available.");
      setZone(activeZone);
      const recordData = await request<{ records: DnsRecord[] }>(
        `/api/dns?zoneId=${encodeURIComponent(activeZone.id)}`,
      );
      setRecords(recordData.records);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load DNS records.");
    } finally {
      setLoading(false);
    }
  });

  const visible = createMemo(() =>
    records().filter(
      (r) =>
        r.name.toLowerCase().includes(query().toLowerCase()) ||
        r.content.toLowerCase().includes(query().toLowerCase()),
    ),
  );

  const startEdit = (r: DnsRecord) => {
    setEditing(r.id);
    setDraft({ ...r });
  };

  const save = async () => {
    const record = draft();
    if (!record) return;
    setError("");
    try {
      const data = await request<{ record: DnsRecord }>("/api/dns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      setRecords((items) => items.map((item) => (item.id === record.id ? data.record : item)));
      setEditing(null);
      setDraft(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save the DNS record.");
    }
  };

  const addRecord = async () => {
    const activeZone = zone();
    if (!activeZone) return;
    const input: DnsRecordInput = {
      type: "A",
      name: "new",
      content: "203.0.113.10",
      ttl: "Auto",
      proxied: true,
    };
    setError("");
    try {
      const data = await request<{ record: DnsRecord }>("/api/dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoneId: activeZone.id, ...input }),
      });
      setRecords((items) => [data.record, ...items]);
      startEdit(data.record);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create the DNS record.");
    }
  };

  const deleteRecord = async (id: string) => {
    setError("");
    try {
      await request("/api/dns", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setRecords((items) => items.filter((item) => item.id !== id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete the DNS record.");
    }
  };

  const cell = "px-4 py-3 text-sm";

  return (
    <>
      <PageHeader
        title="DNS records"
        subtitle={`${records().length} records${zone() ? ` for ${zone()!.name}` : ""} · propagation typically under 30 seconds`}
        action={
          <Button onClick={addRecord}>
            <Plus class="size-4" />
            Add record
          </Button>
        }
      />

      <Show when={error()}>
        <div class="neo-inset rounded-xl px-4 py-3 text-sm text-destructive">{error()}</div>
      </Show>

      <Show when={loading()}>
        <div class="py-8 text-center text-sm text-muted-foreground">Loading DNS records…</div>
      </Show>

      <div class="neo-inset flex items-center gap-3 px-4 py-2.5">
        <Search class="size-4 text-muted-foreground" />
        <Input
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
          placeholder="Filter by name or content"
        />
      </div>

      <Card class="overflow-hidden">
        <table class="w-full border-collapse">
          <thead>
            <tr class="text-left text-[0.7rem] uppercase tracking-widest text-muted-foreground">
              <th class="px-4 py-4 font-medium">Type</th>
              <th class="px-4 py-4 font-medium">Name</th>
              <th class="px-4 py-4 font-medium">Content</th>
              <th class="px-4 py-4 font-medium">Proxy</th>
              <th class="px-4 py-4 font-medium">TTL</th>
              <th class="px-4 py-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <For each={visible()}>
              {(r) => {
                const isEditing = editing() === r.id && draft();
                return (
                  <tr class="border-t border-border/70">
                    <td class={cell}>
                      {isEditing ? (
                        <select
                          value={draft()!.type}
                          onChange={(e) =>
                            setDraft({
                              ...draft()!,
                              type: e.currentTarget.value as DnsRecord["type"],
                            })
                          }
                          class="neo-inset bg-transparent px-2 py-1.5 text-xs outline-none"
                        >
                          <For each={dnsRecordTypes}>{(t) => <option value={t}>{t}</option>}</For>
                        </select>
                      ) : (
                        <span class="neo-inset inline-block px-2.5 py-1 text-xs font-medium text-primary">
                          {r.type}
                        </span>
                      )}
                    </td>
                    <td class={cell}>
                      {isEditing ? (
                        <Input
                          value={draft()!.name}
                          onInput={(e) => setDraft({ ...draft()!, name: e.currentTarget.value })}
                          class="neo-inset w-28 px-2 py-1.5"
                        />
                      ) : (
                        r.name
                      )}
                    </td>
                    <td class={cn(cell, "max-w-xs truncate font-mono text-xs")}>
                      {isEditing ? (
                        <Input
                          value={draft()!.content}
                          onInput={(e) => setDraft({ ...draft()!, content: e.currentTarget.value })}
                          class="neo-inset px-2 py-1.5 font-mono text-xs"
                        />
                      ) : (
                        r.content
                      )}
                    </td>
                    <td class={cell}>
                      <button
                        disabled={!isEditing}
                        onClick={() =>
                          isEditing && setDraft({ ...draft()!, proxied: !draft()!.proxied })
                        }
                        class={cn(
                          "flex items-center gap-1.5 text-xs",
                          (isEditing ? draft()!.proxied : r.proxied)
                            ? "text-warning"
                            : "text-muted-foreground",
                        )}
                      >
                        {(isEditing ? draft()!.proxied : r.proxied) ? (
                          <Cloud class="size-4" />
                        ) : (
                          <CloudOff class="size-4" />
                        )}
                        {(isEditing ? draft()!.proxied : r.proxied) ? "Proxied" : "DNS only"}
                      </button>
                    </td>
                    <td class={cn(cell, "text-muted-foreground")}>
                      {isEditing ? (
                        <Input
                          value={draft()!.ttl}
                          onInput={(e) => setDraft({ ...draft()!, ttl: e.currentTarget.value })}
                          class="neo-inset w-20 px-2 py-1.5"
                        />
                      ) : (
                        r.ttl
                      )}
                    </td>
                    <td class={cn(cell, "text-right")}>
                      <div class="flex justify-end gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              variant="icon"
                              size="icon-sm"
                              onClick={save}
                              class="text-success"
                              aria-label="Save record"
                            >
                              <Check class="size-4" />
                            </Button>
                            <Button
                              variant="icon"
                              size="icon-sm"
                              onClick={() => {
                                setEditing(null);
                                setDraft(null);
                              }}
                              class="text-muted-foreground"
                              aria-label="Cancel edit"
                            >
                              <X class="size-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="icon"
                              size="icon-sm"
                              onClick={() => startEdit(r)}
                              class="text-muted-foreground"
                              aria-label="Edit record"
                            >
                              <Pencil class="size-4" />
                            </Button>
                            <Button
                              variant="icon"
                              size="icon-sm"
                              onClick={() => deleteRecord(r.id)}
                              class="text-destructive"
                              aria-label="Delete record"
                            >
                              <Trash2 class="size-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }}
            </For>
          </tbody>
        </table>
      </Card>

      <Card class="flex flex-wrap items-center justify-between gap-4 p-5 text-sm">
        <div>
          <p class="font-medium">Nameservers</p>
          <p class="text-xs text-muted-foreground">
            Point your registrar at these to activate the zone.
          </p>
        </div>
        <div class="flex gap-3 font-mono text-xs">
          <span class="neo-inset px-3 py-2">vega.ns.astrolabe.io</span>
          <span class="neo-inset px-3 py-2">rigel.ns.astrolabe.io</span>
        </div>
      </Card>
    </>
  );
}

async function request<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (response.status === 204) return undefined as T;

  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "The request failed.");
  return data;
}

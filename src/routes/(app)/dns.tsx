import { Check, Cloud, CloudOff, Pencil, Plus, Search, Trash2, X } from "lucide-solid";
import { createMemo, createSignal, For } from "solid-js";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { dnsRecordTypes, initialRecords, type DnsRecord } from "~/lib/mock-data";
import { cn } from "~/lib/utils";

export default function DnsPage() {
  const [records, setRecords] = createSignal<DnsRecord[]>(initialRecords);
  const [editing, setEditing] = createSignal<string | null>(null);
  const [draft, setDraft] = createSignal<DnsRecord | null>(null);
  const [query, setQuery] = createSignal("");

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

  const save = () => {
    if (!draft()) return;
    setRecords((rs) => rs.map((r) => (r.id === draft()!.id ? draft()! : r)));
    setEditing(null);
    setDraft(null);
  };

  const addRecord = () => {
    const r: DnsRecord = {
      id: crypto.randomUUID(),
      type: "A",
      name: "new",
      content: "203.0.113.10",
      ttl: "Auto",
      proxied: true,
    };
    setRecords((rs) => [r, ...rs]);
    startEdit(r);
  };

  const cell = "px-4 py-3 text-sm";

  return (
    <>
      <PageHeader
        title="DNS records"
        subtitle={`${records().length} records · propagation typically under 30 seconds`}
        action={
          <Button onClick={addRecord}>
            <Plus class="size-4" />
            Add record
          </Button>
        }
      />

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
                              onClick={() => setRecords((rs) => rs.filter((x) => x.id !== r.id))}
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

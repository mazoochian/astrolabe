import { KeyRound, Mail, Plus, ShieldHalf, Trash2, UserPlus } from "lucide-solid";
import { createSignal, For, onMount, Show } from "solid-js";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { memberRoles as roles, type ApiToken, type Member } from "~/lib/domain";
import { cn } from "~/lib/utils";

const tabs = ["members", "tokens"] as const;

export default function AccessPage() {
  const [tab, setTab] = createSignal<(typeof tabs)[number]>("members");
  const [team, setTeam] = createSignal<Member[]>([]);
  const [keys, setKeys] = createSignal<ApiToken[]>([]);
  const [email, setEmail] = createSignal("");
  const [role, setRole] = createSignal<(typeof roles)[number]>(roles[1]);
  const [error, setError] = createSignal("");

  onMount(async () => {
    try {
      const data = await request<{ members: Member[]; tokens: ApiToken[] }>("/api/access");
      setTeam(data.members);
      setKeys(data.tokens);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load access entries.");
    }
  });

  const invite = async () => {
    if (!email().trim()) return;
    try {
      const data = await request<{ member: Member }>("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "member",
          email: email(),
          role: role(),
          scope: "astrolabe.io",
        }),
      });
      setTeam((members) => [...members, data.member]);
      setEmail("");
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to invite the member.");
    }
  };

  const createToken = async () => {
    try {
      const data = await request<{ token: ApiToken }>("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "token" }),
      });
      setKeys((tokens) => [data.token, ...tokens]);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create the token.");
    }
  };

  const remove = async (kind: "member" | "token", id: string) => {
    try {
      await request("/api/access", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id }),
      });
      if (kind === "member") {
        setTeam((items) => items.filter((item) => item.id !== id));
      } else {
        setKeys((items) => items.filter((item) => item.id !== id));
      }
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove the access entry.");
    }
  };

  return (
    <>
      <PageHeader
        title="Access management"
        subtitle="Grant zone-scoped roles to people, or scoped tokens to machines."
        action={
          <div class="neo-inset flex gap-1 p-1">
            <For each={tabs}>
              {(t) => (
                <button
                  onClick={() => setTab(t)}
                  class={cn(
                    "rounded-lg px-4 py-2 text-xs capitalize transition-all",
                    tab() === t ? "neo-sm text-primary" : "text-muted-foreground",
                  )}
                >
                  {t}
                </button>
              )}
            </For>
          </div>
        }
      />

      <Show when={error()}>
        <div class="neo-inset rounded-xl px-4 py-3 text-sm text-destructive">{error()}</div>
      </Show>

      <Show
        when={tab() === "members"}
        fallback={
          <>
            <Card class="flex flex-wrap items-center justify-between gap-4 p-6">
              <div class="flex items-center gap-3">
                <span class="neo-inset grid size-10 place-items-center text-accent">
                  <KeyRound class="size-4" />
                </span>
                <div>
                  <h2 class="text-base font-semibold">API tokens</h2>
                  <p class="text-xs text-muted-foreground">
                    Tokens inherit only the permissions you select — never your account role.
                  </p>
                </div>
              </div>
              <Button onClick={createToken}>
                <Plus class="size-4" />
                Create token
              </Button>
            </Card>

            <Card class="overflow-hidden">
              <table class="w-full border-collapse">
                <thead>
                  <tr class="text-left text-[0.7rem] uppercase tracking-widest text-muted-foreground">
                    <th class="px-5 py-4 font-medium">Name</th>
                    <th class="px-5 py-4 font-medium">Permissions</th>
                    <th class="px-5 py-4 font-medium">Last used</th>
                    <th class="px-5 py-4 font-medium">Expires</th>
                    <th class="px-5 py-4 text-right font-medium">Revoke</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={keys()}>
                    {(t) => (
                      <tr class="border-t border-border/70 text-sm">
                        <td class="px-5 py-4 font-mono text-xs">{t.name}</td>
                        <td class="px-5 py-4 text-muted-foreground">{t.permissions}</td>
                        <td class="px-5 py-4 text-muted-foreground">{t.lastUsed}</td>
                        <td class="px-5 py-4 text-muted-foreground">{t.expires}</td>
                        <td class="px-5 py-4 text-right">
                          <Button
                            variant="icon"
                            size="icon-sm"
                            onClick={() => remove("token", t.id)}
                            aria-label={`Revoke ${t.name}`}
                            class="text-destructive"
                          >
                            <Trash2 class="size-4" />
                          </Button>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </Card>
          </>
        }
      >
        <Card class="p-6">
          <div class="flex items-center gap-2">
            <UserPlus class="size-4 text-accent" />
            <h2 class="text-base font-semibold">Invite to astrolabe.io</h2>
          </div>
          <div class="mt-5 flex flex-wrap gap-3">
            <div class="neo-inset flex min-w-64 flex-1 items-center gap-2 px-4 py-2.5">
              <Mail class="size-4 text-muted-foreground" />
              <Input
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                placeholder="teammate@company.com"
              />
            </div>
            <select
              value={role()}
              onChange={(e) => setRole(e.currentTarget.value as (typeof roles)[number])}
              class="neo-inset bg-transparent px-4 py-2.5 text-sm outline-none"
            >
              <For each={roles}>{(r) => <option value={r}>{r}</option>}</For>
            </select>
            <Button onClick={invite}>
              <Plus class="size-4" />
              Invite
            </Button>
          </div>
        </Card>

        <Card class="overflow-hidden">
          <table class="w-full border-collapse">
            <thead>
              <tr class="text-left text-[0.7rem] uppercase tracking-widest text-muted-foreground">
                <th class="px-5 py-4 font-medium">Member</th>
                <th class="px-5 py-4 font-medium">Role</th>
                <th class="px-5 py-4 font-medium">Zone scope</th>
                <th class="px-5 py-4 text-right font-medium">Remove</th>
              </tr>
            </thead>
            <tbody>
              <For each={team()}>
                {(m) => (
                  <tr class="border-t border-border/70 text-sm">
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-3">
                        <span class="neo-inset grid size-9 place-items-center text-xs font-medium uppercase text-primary">
                          {m.name.slice(0, 2)}
                        </span>
                        <div>
                          <p class="font-medium">{m.name}</p>
                          <p class="text-xs text-muted-foreground">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-5 py-4">
                      <span class="neo-inset inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-info">
                        <ShieldHalf class="size-3" />
                        {m.role}
                      </span>
                    </td>
                    <td class="px-5 py-4 text-muted-foreground">{m.scope}</td>
                    <td class="px-5 py-4 text-right">
                      <Button
                        variant="icon"
                        size="icon-sm"
                        onClick={() => remove("member", m.id)}
                        aria-label={`Remove ${m.name}`}
                        class="text-destructive"
                      >
                        <Trash2 class="size-4" />
                      </Button>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Card>
      </Show>
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

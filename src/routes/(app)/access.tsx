import { KeyRound, Mail, Plus, ShieldHalf, Trash2, UserPlus } from "lucide-solid";
import { createSignal, For, Show } from "solid-js";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { members, tokens, type Member, type Token } from "~/lib/mock-data";
import { cn } from "~/lib/utils";

const roles = ["Super Administrator", "DNS Editor", "SSL Manager", "Read Only"] as const;
const tabs = ["members", "tokens"] as const;

export default function AccessPage() {
  const [tab, setTab] = createSignal<(typeof tabs)[number]>("members");
  const [team, setTeam] = createSignal<Member[]>(members);
  const [keys, setKeys] = createSignal<Token[]>(tokens);
  const [email, setEmail] = createSignal("");
  const [role, setRole] = createSignal<(typeof roles)[number]>(roles[1]);

  const invite = () => {
    if (!email().trim()) return;
    setTeam((t) => [
      ...t,
      {
        id: crypto.randomUUID(),
        name: email().split("@")[0],
        email: email().trim(),
        role: role(),
        scope: "astrolabe.io",
      },
    ]);
    setEmail("");
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
              <Button
                onClick={() =>
                  setKeys((k) => [
                    {
                      id: crypto.randomUUID(),
                      name: `token-${k.length + 1}`,
                      permissions: "Zone:Read",
                      lastUsed: "Never",
                      expires: "90 days",
                    },
                    ...k,
                  ])
                }
              >
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
                            onClick={() => setKeys((k) => k.filter((x) => x.id !== t.id))}
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
                        onClick={() => setTeam((t) => t.filter((x) => x.id !== m.id))}
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

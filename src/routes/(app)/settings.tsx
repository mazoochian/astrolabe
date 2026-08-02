import { Mail, Moon, Save, Sun, User } from "lucide-solid";
import { createSignal, For, onMount, Show } from "solid-js";
import { PageHeader } from "~/components/page-header";
import { useTheme } from "~/components/theme-provider";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import type { User as AccountUser } from "~/lib/user-store";
import { cn } from "~/lib/utils";

const themes = ["light", "dark"] as const;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [user, setUser] = createSignal<AccountUser | null>(null);
  const [displayName, setDisplayName] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [defaultTtl, setDefaultTtl] = createSignal("Auto");
  const [proxyByDefault, setProxyByDefault] = createSignal(true);
  const [saving, setSaving] = createSignal(false);
  const [message, setMessage] = createSignal("");

  onMount(async () => {
    try {
      const data = await request<{ user: AccountUser }>("/api/settings");
      setUser(data.user);
      setDisplayName(data.user.displayName);
      setEmail(data.user.email);
      setDefaultTtl(data.user.defaultTtl);
      setProxyByDefault(data.user.proxyByDefault);
      setTheme(data.user.theme);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to load account settings.");
    }
  });

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const data = await request<{ user: AccountUser }>("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName(),
          email: email(),
          theme: theme(),
          defaultTtl: defaultTtl(),
          proxyByDefault: proxyByDefault(),
        }),
      });
      setUser(data.user);
      setMessage("Settings saved.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to save account settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your account, appearance, and API access." />

      <Show when={message()}>
        <div class="neo-inset rounded-xl px-4 py-3 text-sm text-muted-foreground">{message()}</div>
      </Show>

      <Card class="space-y-6 p-6">
        <div>
          <h2 class="text-base font-semibold">Appearance</h2>
          <p class="mt-1 text-xs text-muted-foreground">Choose your preferred color scheme.</p>
          <div class="neo-inset mt-4 flex gap-1 p-1">
            <For each={themes}>
              {(t) => (
                <button
                  onClick={() => setTheme(t)}
                  class={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm transition-all",
                    theme() === t ? "neo-sm text-primary" : "text-muted-foreground",
                  )}
                >
                  {t === "dark" ? <Moon class="size-4" /> : <Sun class="size-4" />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              )}
            </For>
          </div>
        </div>

        <div class="border-t border-border/70 pt-6">
          <h2 class="text-base font-semibold">Account</h2>
          <p class="mt-1 text-xs text-muted-foreground">Update your profile information.</p>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <label class="neo-inset flex items-center gap-3 px-4 py-3">
              <User class="size-4 text-muted-foreground" />
              <Input
                value={displayName()}
                onInput={(event) => setDisplayName(event.currentTarget.value)}
                placeholder="Display name"
                disabled={!user()}
              />
            </label>
            <label class="neo-inset flex items-center gap-3 px-4 py-3">
              <Mail class="size-4 text-muted-foreground" />
              <Input
                type="email"
                value={email()}
                onInput={(event) => setEmail(event.currentTarget.value)}
                placeholder="Email address"
                disabled={!user()}
              />
            </label>
          </div>
        </div>

        <div class="border-t border-border/70 pt-6">
          <h2 class="text-base font-semibold">Zone Settings</h2>
          <p class="mt-1 text-xs text-muted-foreground">Configure defaults for new zones.</p>
          <div class="mt-4 space-y-3">
            <label class="neo-inset flex items-center justify-between px-4 py-3">
              <span class="text-sm">Default TTL: Auto</span>
              <select
                value={defaultTtl()}
                onChange={(event) => setDefaultTtl(event.currentTarget.value)}
                class="neo-pressable bg-transparent px-3 py-1.5 text-sm outline-none"
              >
                <For each={["Auto", "5 min", "1 hour", "4 hours"]}>
                  {(ttl) => <option>{ttl}</option>}
                </For>
              </select>
            </label>
            <label class="neo-inset flex items-center justify-between px-4 py-3">
              <span class="text-sm">Proxy new records by default</span>
              <input
                type="checkbox"
                checked={proxyByDefault()}
                onChange={(event) => setProxyByDefault(event.currentTarget.checked)}
                class="accent-primary"
              />
            </label>
          </div>
        </div>

        <div class="flex justify-end border-t border-border/70 pt-6">
          <Button onClick={save} disabled={!user() || saving()}>
            <Save class="size-4" />
            {saving() ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "The request failed.");
  return data;
}

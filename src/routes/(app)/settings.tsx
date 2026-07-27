import { KeyRound, Mail, Moon, Sun, User } from "lucide-solid";
import { createSignal, For } from "solid-js";
import { PageHeader } from "~/components/page-header";
import { useTheme } from "~/components/theme-provider";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

const themes = ["light", "dark"] as const;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [apiKey, setApiKey] = createSignal("");

  return (
    <div class="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your account, appearance, and API access." />

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
          <h2 class="text-base font-semibold">API Keys</h2>
          <p class="mt-1 text-xs text-muted-foreground">
            Manage programmatic access to your account.
          </p>
          <div class="mt-4 flex flex-wrap gap-3">
            <div class="neo-inset flex min-w-64 flex-1 items-center gap-2 px-4 py-2.5">
              <KeyRound class="size-4 text-muted-foreground" />
              <Input
                value={apiKey()}
                onInput={(e) => setApiKey(e.currentTarget.value)}
                placeholder="sk_live_••••••••••••••••"
                class="font-mono"
                readOnly
              />
            </div>
            <Button>Generate new key</Button>
          </div>
        </div>

        <div class="border-t border-border/70 pt-6">
          <h2 class="text-base font-semibold">Account</h2>
          <p class="mt-1 text-xs text-muted-foreground">Update your profile information.</p>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div class="neo-inset flex items-center gap-3 px-4 py-3">
              <User class="size-4 text-muted-foreground" />
              <div>
                <p class="text-xs text-muted-foreground">Display name</p>
                <p class="font-medium">Nadia Farrell</p>
              </div>
            </div>
            <div class="neo-inset flex items-center gap-3 px-4 py-3">
              <Mail class="size-4 text-muted-foreground" />
              <div>
                <p class="text-xs text-muted-foreground">Email</p>
                <p class="font-medium">nadia@astrolabe.io</p>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-border/70 pt-6">
          <h2 class="text-base font-semibold">Zone Settings</h2>
          <p class="mt-1 text-xs text-muted-foreground">Configure defaults for new zones.</p>
          <div class="mt-4 space-y-3">
            <label class="neo-inset flex items-center justify-between px-4 py-3">
              <span class="text-sm">Default TTL: Auto</span>
              <select class="neo-pressable bg-transparent px-3 py-1.5 text-sm outline-none">
                <option>Auto</option>
                <option>5 min</option>
                <option>1 hour</option>
                <option>4 hours</option>
              </select>
            </label>
            <label class="neo-inset flex items-center justify-between px-4 py-3">
              <span class="text-sm">Proxy new records by default</span>
              <input type="checkbox" checked class="accent-primary" />
            </label>
          </div>
        </div>
      </Card>
    </div>
  );
}

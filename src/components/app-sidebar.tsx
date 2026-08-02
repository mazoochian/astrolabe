import { A, useLocation, useNavigate } from "@solidjs/router";
import {
  Compass,
  LayoutDashboard,
  LogOut,
  Moon,
  Network,
  Settings,
  ShieldCheck,
  Sun,
  Users,
} from "lucide-solid";
import { createSignal, For, onMount, Show } from "solid-js";
import { useTheme } from "~/components/theme-provider";
import type { Zone } from "~/lib/domain";
import type { User as AccountUser } from "~/lib/user-store";
import { cn } from "~/lib/utils";

const items = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "DNS", url: "/dns", icon: Network },
  { title: "TLS / SSL", url: "/tls", icon: ShieldCheck },
  { title: "Access", url: "/access", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
] as const;

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme, toggle } = useTheme();
  const [activeZone, setActiveZone] = createSignal<Zone | null>(null);
  const [user, setUser] = createSignal<AccountUser | null>(null);

  onMount(async () => {
    try {
      const [zonesResponse, settingsResponse] = await Promise.all([
        fetch("/api/zones"),
        fetch("/api/settings"),
      ]);
      if (zonesResponse.ok) {
        const data = (await zonesResponse.json()) as { zones: Zone[] };
        setActiveZone(data.zones[0] ?? null);
      }
      if (settingsResponse.ok) {
        const data = (await settingsResponse.json()) as { user: AccountUser };
        setUser(data.user);
        setTheme(data.user.theme);
      }
    } catch {
      // The application shell remains usable while the zone request is retried on navigation.
    }
  });

  const signOut = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      navigate("/", { replace: true });
    }
  };

  return (
    <aside class="sticky top-0 flex h-screen w-[16.5rem] shrink-0 flex-col gap-6 bg-sidebar p-5">
      <A href="/dashboard" class="flex items-center gap-3 px-1 pt-1">
        <span class="neo-sm grid size-10 place-items-center text-primary">
          <Compass class="size-5" />
        </span>
        <span class="flex flex-col leading-tight">
          <span class="font-display text-base font-semibold">Astrolabe</span>
          <span class="text-xs text-muted-foreground">DNS Control</span>
        </span>
      </A>

      <div class="neo-inset px-4 py-3">
        <p class="text-[0.65rem] uppercase tracking-widest text-muted-foreground">Active zone</p>
        <Show
          when={activeZone()}
          fallback={<p class="mt-1 text-sm text-muted-foreground">Loading…</p>}
        >
          {(zone) => (
            <p class="mt-1 flex items-center gap-2 text-sm font-medium">
              <span
                class={cn(
                  "size-1.5 rounded-full",
                  zone().status === "Active" ? "bg-success" : "bg-warning",
                )}
              />
              {zone().name}
            </p>
          )}
        </Show>
      </div>

      <nav class="flex flex-1 flex-col gap-2">
        <For each={items}>
          {(item) => {
            const active = () => location.pathname === item.url;
            return (
              <A
                href={item.url}
                class={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all",
                  active()
                    ? "neo-sm font-medium text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon class="size-4.5" />
                {item.title}
              </A>
            );
          }}
        </For>
      </nav>

      <div class="neo-sm flex flex-col gap-3 p-3">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-full bg-accent" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{user()?.displayName ?? "Loading…"}</p>
            <p class="truncate text-xs text-muted-foreground">{user()?.role ?? ""}</p>
          </div>
          <button
            onClick={signOut}
            aria-label="Sign out"
            class="neo-pressable grid size-8 place-items-center rounded-lg text-muted-foreground"
          >
            <LogOut class="size-4" />
          </button>
        </div>
        <button
          onClick={toggle}
          class="neo-inset flex items-center justify-between px-3 py-2 text-xs text-muted-foreground"
        >
          <span class="flex items-center gap-2">
            {theme() === "dark" ? <Moon class="size-3.5" /> : <Sun class="size-3.5" />}
            {theme() === "dark" ? "Dark" : "Light"} theme
          </span>
          <span class="relative h-4 w-8 rounded-full bg-secondary">
            <span
              class={cn(
                "absolute top-0.5 size-3 rounded-full bg-primary transition-all",
                theme() === "dark" ? "left-4.5" : "left-0.5",
              )}
            />
          </span>
        </button>
      </div>
    </aside>
  );
}

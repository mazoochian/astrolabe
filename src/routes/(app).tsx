import type { RouteSectionProps } from "@solidjs/router";
import { useNavigate } from "@solidjs/router";
import { createSignal, onMount, Show } from "solid-js";
import { AppSidebar } from "~/components/app-sidebar";

export default function AppLayout(props: RouteSectionProps) {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = createSignal(false);

  onMount(async () => {
    try {
      const response = await fetch("/api/login", {
        headers: { Accept: "application/json" },
      });
      const session = (await response.json()) as { authenticated?: boolean };

      if (response.ok && session.authenticated) {
        setAuthenticated(true);
        return;
      }
    } catch {
      // A failed session check is treated as unauthenticated.
    }

    navigate("/", { replace: true });
  });

  return (
    <Show
      when={authenticated()}
      fallback={<div class="flex min-h-screen items-center justify-center bg-background" />}
    >
      <div class="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main class="halo min-h-screen flex-1 px-8 py-8">
          <div class="mx-auto flex w-full max-w-6xl flex-col gap-7">{props.children}</div>
        </main>
      </div>
    </Show>
  );
}

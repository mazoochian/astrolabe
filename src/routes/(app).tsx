import {
  createAsync,
  query,
  redirect,
  type RouteDefinition,
  type RouteSectionProps,
} from "@solidjs/router";
import { Show } from "solid-js";
import { AppSidebar } from "~/components/app-sidebar";

const requireSession = query(async () => {
  "use server";

  const { getCookie } = await import("vinxi/http");
  const { SESSION_COOKIE_NAME, verifySessionToken } = await import("~/lib/session");
  const token = getCookie(SESSION_COOKIE_NAME);
  const session = token ? verifySessionToken(token) : null;

  if (!session) {
    throw redirect("/");
  }

  return { email: session.email };
}, "authenticated-session");

export const route = {
  preload: () => requireSession(),
} satisfies RouteDefinition;

export default function AppLayout(props: RouteSectionProps) {
  const session = createAsync(() => requireSession(), { deferStream: true });

  return (
    <Show
      when={session()}
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

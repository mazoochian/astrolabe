import type { RouteSectionProps } from "@solidjs/router";
import { AppSidebar } from "~/components/app-sidebar";

export default function AppLayout(props: RouteSectionProps) {
  return (
    <div class="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main class="halo min-h-screen flex-1 px-8 py-8">
        <div class="mx-auto flex w-full max-w-6xl flex-col gap-7">{props.children}</div>
      </main>
    </div>
  );
}

import type { JSX } from "solid-js";

export function PageHeader(props: { title: string; subtitle: string; action?: JSX.Element }) {
  return (
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">{props.title}</h1>
        <p class="mt-1 text-sm text-muted-foreground">{props.subtitle}</p>
      </div>
      {props.action}
    </header>
  );
}

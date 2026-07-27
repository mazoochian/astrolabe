import { splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/utils";

/**
 * Bare text field — no box of its own. Every input in this app sits inside a
 * `neo-inset` container (either the input's own `class`, or a wrapping div
 * when it's paired with a leading icon), so styling the inset here would
 * double up.
 */
export function Input(props: JSX.InputHTMLAttributes<HTMLInputElement>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <input
      class={cn(
        "w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        local.class,
      )}
      {...rest}
    />
  );
}

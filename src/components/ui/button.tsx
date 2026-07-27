import { splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/utils";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "icon";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm";
}

const baseStyles =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const variants = {
  default: "neo-pressable bg-primary text-primary-foreground hover:bg-primary/90",
  destructive: "neo-pressable bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline:
    "neo-pressable border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
  secondary: "neo-pressable bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
  // bare neo-pressable elevation, no fill — for colored icon-only row actions (edit/delete/save/…)
  icon: "neo-pressable",
};

const sizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-lg px-3 text-xs",
  lg: "h-11 rounded-xl px-8 text-base",
  icon: "h-10 w-10",
  "icon-sm": "h-8 w-8 rounded-lg",
};

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ["class", "variant", "size", "children"]);

  return (
    <button
      class={cn(
        baseStyles,
        variants[local.variant ?? "default"],
        sizes[local.size ?? "default"],
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </button>
  );
}

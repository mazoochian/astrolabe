import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { ArrowRight, Compass } from "lucide-solid";
import { createSignal, onMount, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = createSignal("nadia@astrolabe.io");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  onMount(async () => {
    try {
      const response = await fetch("/api/login", {
        headers: { Accept: "application/json" },
      });
      const session = (await response.json()) as { authenticated?: boolean };
      if (response.ok && session.authenticated) {
        navigate("/dashboard", { replace: true });
      }
    } catch {
      // Keep showing the login form when the session check is unavailable.
    }
  });

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email(), password: password() }),
      });

      const data = (await res.json()) as { error?: string; redirect?: string };

      if (!res.ok) {
        setError(data.error ?? "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      navigate(data.redirect ?? "/dashboard", { replace: true });
    } catch {
      setError("A network error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div class="halo flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Title>Sign in — Astrolabe</Title>

      <Card class="w-full max-w-md p-9">
        <div class="flex items-center gap-3">
          <span class="neo-sm grid size-11 place-items-center text-primary">
            <Compass class="size-5" />
          </span>
          <div>
            <h1 class="text-xl font-semibold">Astrolabe</h1>
            <p class="text-xs text-muted-foreground">DNS & edge control plane</p>
          </div>
        </div>

        <h2 class="mt-8 text-lg font-medium">Welcome back</h2>
        <p class="mt-1 text-sm text-muted-foreground">Sign in to continue to your zones.</p>

        <form class="mt-7 flex flex-col gap-4" onSubmit={handleSubmit}>
          <Show when={error()}>
            <div class="neo-inset flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-destructive">
              {error()}
            </div>
          </Show>

          <label class="flex flex-col gap-2 text-sm">
            <span class="text-muted-foreground">Email</span>
            <Input
              type="email"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              class="neo-inset px-4 py-2.5"
              placeholder="you@company.com"
              disabled={loading()}
            />
          </label>
          <label class="flex flex-col gap-2 text-sm">
            <span class="text-muted-foreground">Password</span>
            <Input
              type="password"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              class="neo-inset px-4 py-2.5"
              placeholder="••••••••"
              disabled={loading()}
            />
          </label>

          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <label class="flex items-center gap-2">
              <input type="checkbox" checked class="accent-primary" />
              Keep me signed in
            </label>
            <span class="text-primary">Forgot password?</span>
          </div>

          <Button type="submit" size="lg" class="mt-2" disabled={loading()}>
            {loading() ? "Signing in…" : "Sign in"}
            {!loading() && <ArrowRight class="size-4" />}
          </Button>
        </form>

        <p class="mt-6 text-center text-xs text-muted-foreground">
          Protected by hardware key and TOTP two-factor.
        </p>
      </Card>
    </div>
  );
}

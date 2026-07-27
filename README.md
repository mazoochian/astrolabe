# Astrolabe

A DNS & edge control-plane dashboard — zones, DNS records, TLS certificates, team access, and settings. Built with [SolidStart](https://start.solidjs.com/) (SolidJS SSR) and Tailwind CSS v4, using a neomorphic design system.

This is a from-scratch SolidJS remake of a React/Loveable prototype ([nebula-domain-guard](https://github.com/mazoochian/nebula-domain-guard)) — same product concept, idiomatic Solid architecture underneath. All data is mocked client-side; there's no backend or real authentication.

## Prerequisites

- Node.js 20+ (developed against Node 22)
- npm

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Starts the dev server at [http://localhost:3000](http://localhost:3000) with hot module reloading.

## Production build

```bash
npm run build
npm run start
```

`build` outputs a server bundle to `.output/`; `start` runs that build with a Node server (Nitro `node-server` preset).

## Linting & formatting

```bash
npm run lint     # ESLint (flat config, solid + typescript-eslint rules)
npm run format    # Prettier, writes in place
```

## Project structure

```
src/
  app.tsx                Router root: MetaProvider, ThemeProvider, FileRoutes
  entry-client.tsx        Client hydration entry
  entry-server.tsx        SSR document shell
  styles.css               Tailwind v4 theme tokens + neomorphic design utilities
  routes/
    index.tsx              Login screen (/)
    (app).tsx               Shared shell layout (sidebar + content) for the routes below
    (app)/
      dashboard.tsx          Zone overview (/dashboard)
      dns.tsx                 DNS records (/dns)
      tls.tsx                 TLS / SSL certificates (/tls)
      access.tsx              Team members & API tokens (/access)
      settings.tsx            Account & appearance settings (/settings)
  components/
    app-sidebar.tsx         Nav, active zone, theme toggle
    page-header.tsx          Page title/subtitle/action bar
    theme-provider.tsx       Light/dark theme context (single source of truth)
    charts.tsx                Hand-rolled SVG charts (traffic, response mix, latency)
    ui/                      Shared primitives: Button, Card, Input
  lib/
    mock-data.ts             All mock data + types (zones, DNS records, certs, members, tokens)
    utils.ts                  `cn()` class-merging helper
```

Routes under `(app)/` are grouped by [SolidStart's route-group convention](https://docs.solidjs.com/solid-router/reference/data-apis/route-definition) — the `(app)` folder name doesn't appear in the URL, and `(app).tsx` supplies the shared sidebar layout via `props.children`.

## Notes

- The login screen doesn't check credentials — submitting the form navigates straight to `/dashboard`.
- Theme preference persists to `localStorage` under the `astrolabe-theme` key.

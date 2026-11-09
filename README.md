# PPA Assessment Runner — Trainer UI

React web app for trainers to run automated coding assessments and review results. Trainers sign in, pick a test account and an LLM model, start a run, watch its progress, and review submission reports and history.

## Features

- **Trainer login** — all routes are gated behind authentication.
- **Dashboard** — overview of recent runs and status.
- **New Run** — choose a test account (saved or custom), a model ranked by real success rate from run history, retry settings, and an optional note. Shows data-backed run-time estimates.
- **Run detail** — live progress, a stop/cancel control, and a clear submission-confirmed/failed report.
- **History** — filterable list of past runs.
- Error boundary, code-split routes, toast notifications.

## Tech stack

- React 19 + TypeScript, built with Vite
- React Router, TanStack Query for server state
- Tailwind CSS 4 with shadcn/ui components (Base UI primitives)
- Lucide icons, Sonner toasts, Geist font

## Getting started

Requires Node.js 20+ and the backend running on port 8000 (see the backend README).

```bash
npm install
npm run dev        # http://127.0.0.1:5173 — /api is proxied to the backend
```

### Other scripts

```bash
npm run build      # type-check and production build to dist/
npm run preview    # serve the production build locally
npm run lint       # oxlint
```

## Deployment

- `vercel.json` rewrites SPA routes to `index.html` and proxies `/api/*` to the hosted backend.
- The backend can also serve the built `dist/` folder directly, giving a single-process deployment.

## Project layout

```
src/
  pages/          Login, Dashboard, NewRun, RunDetail, History
  components/     Layout, status badges, error boundary, shadcn UI primitives
  lib/            API client, auth context, query hooks, utilities
```

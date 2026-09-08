# Internship Search Bot

Student-focused internship discovery dashboard with a daily feed, saved opportunities, application tracking, and profile matching.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server in local demo mode
- `pnpm --filter @workspace/internship-command-center run dev` — run the Vite frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required production env: `DATABASE_URL` — Postgres connection string
- Frontend production env: `PORT` and `BASE_PATH`
- Local demo mode uses starter data and does not replace production database provisioning.
- Windows quick start (all services + public tunnel): double-click `launch-hidden.vbs` in this folder
  (or run `wscript.exe launch-hidden.vbs`). It starts everything detached in hidden windows that
  survive closing the terminal/VS Code:
  - `start-api.cmd` — API server in demo mode on port 8080 (logs to `../api.log`)
  - `start-web.cmd` — serves the built frontend via `vite preview` on port 19384, proxies `/api` to port 8080 (logs to `../web.log`)
  - `build-web.cmd` — rebuilds the frontend bundle into `artifacts/internship-command-center/dist/public` (run after changing `src/`)
  - `start-tunnel.cmd` — public URL via localtunnel: https://internship-command-center.loca.lt (logs to `../tunnel.log`)
  - `start-all.cmd` — same three services but in visible minimized windows (console-attached).
  - Requires pnpm (`npm install -g pnpm@10`) and Node 20+.
  - To stop everything: kill node.exe processes (Task Manager) or `taskkill /IM node.exe /F`.
  - Note: localtunnel free tier rate-limits rapid requests (occasional 400/502); reload the page.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

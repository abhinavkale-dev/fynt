# apps/web

**Next.js frontend, tRPC API layer, and workflow builder UI.**

This is the main product app. If you are changing anything user-facing, this is where you start.


## What lives here

- App Router pages and API routes
- Workflow canvas and node editor
- tRPC server routes consumed by the UI
- Template catalog and preflight logic
- Live execution streaming hooks and WebSocket client
- Auth setup via better-auth


## Folder map

```
app/
  (auth)/               Sign in and sign up pages
  home/                 Authenticated product pages
    workflows/          Workflow editor and run view
    executions/         Execution history
    credentials/        Credential management
    templates/          Template browser
  api/
    auth/[...all]/      better-auth route handler
    trpc/[trpc]/        tRPC HTTP bridge
    executions/[runId]/
      ws-token/         Issues WebSocket stream tokens
      stream/           Legacy SSE route (returns 410)
  layout.tsx
  page.tsx              Landing page

components/
  workflows/            Workflow builder (canvas, nodes, config panels, drawer)
  templates/            Template preflight modal
  landing-page/         Marketing site sections
  layout/               App shell and sidebar navigation
  ui/                   Shared Radix UI primitives

server/
  routers/
    workflow.ts         Workflow CRUD and execution mutations
    execution.ts        Execution list and detail queries
    credentials.ts      Credential CRUD and platform validation
  trpc.ts               tRPC server entry

lib/
  templates/            Catalog data, typing, and instantiation logic
  executions/           Socket client and hooks for live run updates
  reactflow/            Node and edge type registration
  nodeUI.ts             Node metadata for UI rendering and menus
  auth.ts               Auth setup used by server routes
  prisma.ts             Prisma client instance
```


## How data flows

### Workflow execution

1. User clicks run in the UI under `app/home/workflows/`.
2. Frontend calls a tRPC mutation in `server/routers/workflow.ts`.
3. Web validates auth, ownership, and limits, then creates a `WorkflowRun`.
4. Run is enqueued to BullMQ via shared queue utilities.
5. UI requests a token from `/api/executions/[runId]/ws-token`.
6. UI connects to the realtime WebSocket and renders live node and run updates.

### Template path

1. Template metadata is defined in `lib/templates/catalog-data/`.
2. `lib/templates/catalog.ts` and `lib/templates/instantiate.ts` build runtime workflow JSON.
3. `components/templates/TemplatePreflightModal.tsx` checks required credentials before creating the workflow.


## Common edit tasks

| Task | Files to touch |
|------|---------------|
| Add or change a node UI | `components/workflows/nodes/`, `components/workflows/config/`, `lib/nodeUI.ts` |
| Add or change a template | `lib/templates/catalog-data/`, `lib/templates/instantiate.ts` |
| Change credential behavior | `server/routers/credentials.ts` |
| Change execution streaming | `lib/executions/executionSocketClient.ts`, `lib/executions/useExecutionSocket.ts` |


## Run modes

### Mode A: web-only deploy

Use this when you only want to show the frontend.

- Deploy `apps/web` only.
- You do not need to run `apps/worker` or `apps/realtime`.
- Workflow execution automation is not active end-to-end in this mode.

### Mode B: full self-host

Use this when you want real executions, cron, webhooks, and live node updates.

- Deploy `apps/web`, `apps/worker`, and `apps/realtime`.
- Provision PostgreSQL and Redis.

## Docker full stack

For one-command local self-host, use root compose:

```sh
cp .env.docker.example .env.docker
# fill required secrets
docker compose up --build
```

This starts `web`, `worker`, `realtime`, `postgres`, and `redis` together.
By default, Postgres is exposed on host port `55432` to avoid `5432` collisions; override with `FYNT_POSTGRES_PORT`.

Useful commands:

```sh
docker compose logs -f web worker realtime bootstrap
docker compose down
docker compose down -v
```

Notes:
- Docker full stack runs in `FYNT_RUNTIME_MODE=full` with automation enabled.
- Web-only mode is separate and does not require worker/realtime.
- For Docker runtime, use `.env.docker` at repo root (no `apps/web/.env` required).

## Commands

```bash
# From repo root
pnpm --filter @fynt/web dev
pnpm --filter @fynt/web build
pnpm --filter @fynt/web start
pnpm --filter @fynt/web check-types
pnpm --filter @fynt/web lint
```

## Environment variables

Required for any deploy:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection for Prisma |
| `ENCRYPTION_KEY` | Encrypt and decrypt stored credentials. Must match worker in full mode |
| `BETTER_AUTH_SECRET` | Auth signing secret |
| `BETTER_AUTH_URL` | Auth base URL |
| `FYNT_RUNTIME_MODE` | Runtime behavior for server routes (`web-only` or `full`) |
| `NEXT_PUBLIC_FYNT_RUNTIME_MODE` | Runtime behavior for execute UX in browser (`web-only` or `full`) |

Used in full self-host mode:

| Variable | Purpose |
|----------|---------|
| `REDIS_URL` | Preferred Redis connection string (supports Upstash) |
| `REDIS_HOST` + `REDIS_PORT` | Redis host/port if not using `REDIS_URL` |
| `NEXT_PUBLIC_EXECUTION_WS_URL` | Browser WebSocket URL for realtime run events |
| `EXECUTION_WS_URL` | Server-side WebSocket base URL used by ws-token route |
| `EXECUTION_STREAM_SIGNING_SECRET` | Optional dedicated stream token signing secret |
| `REALTIME_PORT` | Fallback port used when WS URL is not explicitly set |

Optional:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Client-side auth URL |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL shown in webhook config |
| `NGROK_URL` | Trusted origin for local tunnel during development |

### Production automation switch

Set `FYNT_RUNTIME_MODE=web-only` and `NEXT_PUBLIC_FYNT_RUNTIME_MODE=web-only` to run production web-only mode:

- Workflow editor remains fully usable.
- Execute actions in UI show the existing blocked-execution dialog.
- Execute mutation, webhook route, and ws-token route are blocked server-side.

For full production execution mode, set:

```sh
FYNT_RUNTIME_MODE=full
NEXT_PUBLIC_FYNT_RUNTIME_MODE=full
FYNT_ENABLE_AUTOMATION_IN_PRODUCTION=true
```

## Troubleshooting

**`/home/credentials` fails during build**
Verify the DB is reachable and platform enums match the Prisma schema.

**Run starts but live updates do not appear**
Verify realtime is deployed and reachable, and verify `NEXT_PUBLIC_EXECUTION_WS_URL` and `EXECUTION_WS_URL`.

**Webhooks return 503 in production**
For web-only mode this is expected.  
For full mode, set `FYNT_RUNTIME_MODE=full` plus `FYNT_ENABLE_AUTOMATION_IN_PRODUCTION=true`.

# apps/realtime

**WebSocket relay server that streams live workflow execution events to the browser.**

This service does not run workflow logic. It only forwards events.

Use this service only in full self-host mode. For web-only frontend deployment, you can skip this app.


## What lives here

- HTTP server with a `/health` endpoint
- WebSocket upgrade handler at `/ws/executions`
- Token verification using a shared signing secret
- Redis Pub/Sub subscription per connected run
- Ping/pong heartbeat, idle timeout, and token expiry handling


## Folder map

```
src/
  index.ts    Full server implementation (HTTP + WebSocket + Redis relay)
  ws.d.ts     Local type helper for the ws module

dist/         Compiled JS output
```


## Connection lifecycle

1. Browser requests a token from web route `/api/executions/[runId]/ws-token`.
2. Browser connects to `ws://<host>/ws/executions?token=...`.
3. Realtime verifies the token using the shared signing secret.
4. Realtime subscribes to `workflow-run:<runId>` in Redis Pub/Sub.
5. Each Redis message is forwarded directly to the socket client.
6. Realtime closes the socket when:
   - The workflow reaches a terminal state (`Success` or `Failure`)
   - The token expires (5-minute TTL)
   - The idle timeout fires (2 minutes without activity)
   - The heartbeat fails (25-second ping interval)


## Common edit tasks

| Task | Files to touch |
|------|---------------|
| Change socket route, host binding, or close policy | `src/index.ts` |
| Change token format or verification | `packages/shared/src/runtime/executionStreamToken.ts`, then `src/index.ts` |
| Change event payload shape | Publisher side in worker and consumer side in web (realtime is a passthrough) |


## Commands

```bash
# From repo root
pnpm --filter @fynt/realtime dev
pnpm --filter @fynt/realtime build
pnpm --filter @fynt/realtime start

# Health check
curl http://localhost:3101/health
```


## Environment variables

Required (set in root `.env`):

| Variable | Purpose |
|----------|---------|
| `BETTER_AUTH_SECRET` | Fallback signing secret if dedicated secret is not set |
| `REDIS_URL` or `UPSTASH_REDIS_URL` | Preferred Redis connection string |
| `REDIS_HOST` + `REDIS_PORT` | Redis host/port fallback if URL is not set |

Optional:

| Variable | Default | Purpose |
|----------|---------|---------|
| `EXECUTION_STREAM_SIGNING_SECRET` | falls back to `BETTER_AUTH_SECRET` | Dedicated WebSocket token signing secret |
| `REALTIME_HOST` | `0.0.0.0` | Server bind address |
| `REALTIME_PORT` | `3101` | Server port |


## Troubleshooting

**`Missing execution stream signing secret`**
Set `EXECUTION_STREAM_SIGNING_SECRET` or `BETTER_AUTH_SECRET` in your environment.

**`EADDRINUSE ... 3101`**
Another process is already bound to that port. Change `REALTIME_PORT` or stop the existing process.

**Socket connects but no live updates appear**
Verify the worker is publishing to `workflow-run:<runId>`. Verify realtime can connect to Redis. Verify the token `runId` matches the run being viewed.

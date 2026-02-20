# apps/worker

**BullMQ job processor and cron scheduler that executes workflow DAGs.**

If a workflow run is failing at runtime, this is the source of truth.

Use this service only in full self-host mode. For web-only frontend deployment, you can skip this app.


## What lives here

- BullMQ worker that consumes jobs from the `workflow-runs` queue
- DAG executor that runs nodes in dependency-aware batches
- Credential resolver that decrypts stored keys in memory only
- Cron scheduler that fires due workflows every 60 seconds
- All node executor implementations (AI, integrations, logic, utilities)


## Folder map

```
src/
  index.ts              Worker startup, env loading, graceful shutdown
  worker.ts             BullMQ worker registration and concurrency settings
  scheduler.ts          Cron tick loop and Redis dedupe logic

  engine/
    executor.ts         Workflow execution planner and batch runner
    nodeExecutor.ts     Per-node dispatch and execution wrappers
    graphUtils.ts       Graph traversal and reachability helpers
    lockManager.ts      Run locking utilities
    credentialResolver.ts Decrypt and resolve credentials per node
    types/              Runtime node contracts and Zod validation schemas

  executors/
    trigger/            Manual, webhook, and cron trigger behavior
    ai/                 OpenAI, Anthropic, Gemini execution paths
    request/            HTTP, GitHub, and Notion node executors
    communication/      Slack and Discord delivery with message formatting
    flow/               Transform, condition, filter, delay, and log

dist/                   Compiled JS output
```


## How execution works

1. A job arrives in BullMQ queue `workflow-runs`.
2. Worker fetches workflow definition and run context from Postgres.
3. Engine validates the graph and computes the first batch of executable nodes.
4. Nodes run in dependency-aware batches.
5. Each node result is persisted as a `NodeRun` record.
6. Terminal run status is persisted to `WorkflowRun`.
7. Events are published to Redis Pub/Sub for realtime UI consumers.

**Conditional routing:** `conditionNode` picks route labels. Downstream edges are filtered by the selected route. Branches not selected become skipped or unreachable.


## Cron scheduler

Runs every 60 seconds:

1. DB health check.
2. Discover due `cronTrigger` nodes.
3. Write dedupe key `fg:cron:bucket:<workflow>:<node>:<bucket>` to Redis.
4. Reserve run with plan and concurrency checks.
5. Enqueue to the same BullMQ execution path as manual runs.


## Common edit tasks

| Task | Files to touch |
|------|---------------|
| Add a new node type | `engine/types/node-types.ts`, `engine/types/schemas.ts`, `executors/**`, `engine/nodeExecutor.ts` |
| Change AI input behavior | `executors/ai/aiExecutor.ts` |
| Change message formatting | `executors/communication/messageFormatting.ts`, `slackExecutor.ts`, `discordExecutor.ts` |
| Change cron timing or dedupe | `scheduler.ts` |


## Commands

```bash
# From repo root
pnpm --filter @fynt/worker dev
pnpm --filter @fynt/worker build
pnpm --filter @fynt/worker start
pnpm --filter @fynt/worker lint
```


## Environment variables

Required (set in root `.env`):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection |
| `ENCRYPTION_KEY` | Credential decryption key. Must match web. |
| `REDIS_URL` or `UPSTASH_REDIS_URL` | Preferred Redis connection string |
| `REDIS_HOST` + `REDIS_PORT` | Redis host/port if URL is not provided |

Optional:

| Variable | Default | Purpose |
|----------|---------|---------|
| `FYNT_ENABLE_AUTOMATION_IN_PRODUCTION` | `false` | Set `true` to allow cron and webhook source execution in production |
| `DELAY_NODE_MAX_MS` | 300000 | Max delay node sleep cap (5 min) |
| `CRON_DB_HEALTHCHECK_TIMEOUT_MS` | 5000 | DB health check timeout |
| `CRON_DB_HEALTHCHECK_RETRIES` | 2 | Health check retry attempts |
| `CRON_DB_HEALTHCHECK_RETRY_DELAY_MS` | 500 | Delay between retries |
| `CRON_DEDUPE_TTL_SECONDS` | 691200 | Cron dedupe window (8 days) |
| `RUN_RESERVATION_LOCK_TTL_SECONDS` | 10 | Run lock TTL |
| `RUN_RESERVATION_LOCK_WAIT_MS` | 1500 | Lock wait time |
| `RUN_RESERVATION_LOCK_RETRY_MS` | 40 | Lock retry interval |


## Troubleshooting

**`ENCRYPTION_KEY is required for worker credential decryption`**
Set the same 64-char hex key used by the web service.

**`[cron-scheduler] DB health check failed, skipping tick`**
Verify `DATABASE_URL` is correct. Check DB network connectivity.

**BullMQ connection errors**
Verify Redis config (`REDIS_URL` or `REDIS_HOST`/`REDIS_PORT`). Check Redis is running and reachable.

**`Prompt template uses undefined variables`**
Inspect upstream node output keys. Fix path mismatches between template references and actual output shapes.

**Cron or webhook-source runs do not execute in production**
By default automation sources are disabled in production. Set `FYNT_ENABLE_AUTOMATION_IN_PRODUCTION=true` to enable them.

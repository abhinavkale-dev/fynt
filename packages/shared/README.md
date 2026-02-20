# packages/shared

**Runtime utilities, node registry, and security helpers shared across web, worker, and realtime.**


## What lives here

- Node registry (single source of truth for all supported node types)
- Redis client factory and Pub/Sub helpers
- BullMQ queue definition
- Execution stream token signing and verification
- Run reservation lock utilities
- AES-256-GCM credential encryption and decryption
- SSRF protection for outbound HTTP requests
- Workflow graph parsing and validation


## Folder map

```
src/
  registry/
    nodeRegistry.ts       All node type definitions and metadata

  runtime/
    redis.ts              Redis client factory (standard + subscriber)
    queue.ts              BullMQ queue instance
    executionStreamToken.ts  JWT-style token sign/verify for WebSocket auth
    runReservationLock.ts    Redis-based run reservation locking

  security/
    crypto.ts             AES-256-GCM encrypt/decrypt for stored credentials
    ssrf.ts               SSRF check for outbound HTTP node requests

  core/
    parser.ts             Workflow JSON parser
    validation.ts         Workflow graph validation rules
```


## Key exports

| Export | Used by | Purpose |
|--------|---------|---------|
| `nodeRegistry` | web, worker | All node types, categories, and metadata |
| `redis` | web, worker, realtime | Shared Redis client |
| `createRedisSubscriber` | realtime | Pub/Sub subscriber connection |
| `withRedisFallback` | web, worker | Fallback wrapper when Redis is unavailable |
| `getRedisConnectionOptions` | web, worker, realtime | Shared Redis connection options (`REDIS_URL` or host/port) |
| `workflowQueue` | web, worker | BullMQ queue reference |
| `signExecutionStreamToken` | web | Issue WebSocket auth tokens |
| `verifyExecutionStreamToken` | realtime | Verify WebSocket auth tokens |
| `encryptJson` / `decryptJson` | web, worker | Credential encryption |
| `isSsrfSafeUrl` | worker | Validate outbound URLs in HTTP nodes |
| `isAutomationDisabledInProduction` | web, worker | Production guard for webhook/cron automation |


## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `REDIS_URL` | unset | Preferred Redis connection string |
| `UPSTASH_REDIS_URL` | unset | Alternative Redis URL alias |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `ENCRYPTION_KEY` | required | 64-char hex key (32 bytes) for AES-256-GCM |
| `RUN_RESERVATION_LOCK_TTL_SECONDS` | `10` | Lock TTL |
| `RUN_RESERVATION_LOCK_WAIT_MS` | `1500` | Max wait time to acquire lock |
| `RUN_RESERVATION_LOCK_RETRY_MS` | `40` | Retry interval while waiting |
| `FYNT_ENABLE_AUTOMATION_IN_PRODUCTION` | `false` | Enables webhook and cron automation in production |


## Notes

- `ENCRYPTION_KEY` must be identical across web and worker. Changing it after credentials are saved will make existing credentials unreadable.
- The SSRF check in `security/ssrf.ts` blocks requests to private IP ranges, loopback addresses, and link-local addresses. It is applied to all HTTP node outbound requests.

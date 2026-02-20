# packages/prisma

**PostgreSQL schema, Prisma client, and database migrations for Fynt.**


## What lives here

- Prisma schema defining all models
- Migration history
- Generated Prisma client exported as `@repo/prisma`
- Seed script for local development data


## Schema overview

| Model | Purpose |
|-------|---------|
| `User` | Account with plan, run limits, and concurrency settings |
| `Session` | better-auth session tokens |
| `Account` | OAuth provider accounts with token storage |
| `Workflow` | Node and edge graph stored as JSON, belongs to a user |
| `WorkflowRun` | A single execution instance with status and metadata |
| `NodeRun` | Per-node execution record with input, output, and timing |
| `Credentials` | AES-256-GCM encrypted API keys, belongs to a user |


## Folder map

```
schema.prisma         Data model and generator config
migrations/           Migration history (applied in order)
src/
  index.ts            Prisma client export
  seed.ts             Development seed script
```


## Commands

```bash
# Generate Prisma client after schema changes
pnpm db:generate

# Apply schema to DB without creating a migration file (dev only)
pnpm db:push

# Create and apply a new migration
pnpm --filter @repo/prisma exec prisma migrate dev --name your_migration_name

# Seed the database
pnpm db:seed
```


## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string. Set in root `.env`. |

Format: `postgresql://USER:PASSWORD@HOST:PORT/DBNAME`


## Notes

- The `ENCRYPTION_KEY` is not used here. Encryption and decryption of `Credentials` records happen in `packages/shared/src/security/crypto.ts` and are called by the web and worker services.
- Never edit migration files after they have been applied in production. Create a new migration instead.

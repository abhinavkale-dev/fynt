import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'packages/prisma/schema.prisma',
  migrations: {
    path: 'packages/prisma/migrations',
    seed: 'tsx packages/prisma/src/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})





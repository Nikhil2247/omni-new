// ============================================================================
// OMNICASSION V2.0 - PRISMA 7 CONFIGURATION
// ============================================================================
// This file configures how the Prisma CLI interacts with your database.
// Required for Prisma 7+ for migrations and introspection.
// ============================================================================

import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },
})

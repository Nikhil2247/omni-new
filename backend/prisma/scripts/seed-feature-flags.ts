// ============================================================================
// PRISMA SCRIPT - Seed Feature Flags Only
// ============================================================================
// Seeds feature flags without running the full seed
// Run: npx ts-node prisma/scripts/seed-feature-flags.ts
// ============================================================================

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { seedFeatureFlags } from '../seeds/feature-flags.seed'

// Initialize Prisma with adapter
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL
const isAccelerate = connectionString?.startsWith('prisma://')

const prisma = isAccelerate
  ? new PrismaClient({ log: ['info', 'warn', 'error'] })
  : new PrismaClient({
      adapter: new PrismaPg(new Pool({ connectionString })),
      log: ['info', 'warn', 'error'],
    })

// ============================================================================
// EXECUTE
// ============================================================================

async function main() {
  console.log('🚩 Seeding feature flags...\n')

  await seedFeatureFlags(prisma)

  console.log('\n✅ Feature flags seeding completed!')
}

main()
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('Prisma disconnected.')
  })

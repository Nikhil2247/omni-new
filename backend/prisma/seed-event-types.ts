/**
 * seed-event-types.ts
 * ─────────────────────────────────────────────────────────────────
 * Safe upsert-only script for event types.
 * Runs on live data — will NOT delete or modify any existing rows.
 * Uses `slug` as the unique key so re-runs are idempotent.
 *
 * Run:
 *   npx ts-node -r tsconfig-paths/register prisma/seed-event-types.ts
 * ─────────────────────────────────────────────────────────────────
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL!
const isAccelerate = connectionString?.startsWith('prisma://')

const prisma = isAccelerate
  ? new PrismaClient({ log: ['warn', 'error'] })
  : new PrismaClient({
      adapter: new PrismaPg(new Pool({ connectionString })),
      log: ['warn', 'error'],
    })

const EVENT_TYPES = [
  { slug: 'wedding',     name: 'Wedding',        description: 'Wedding celebration',           icon: 'heart',      sortOrder: 1 },
  { slug: 'engagement',  name: 'Engagement',      description: 'Engagement party',              icon: 'ring',       sortOrder: 2 },
  { slug: 'birthday',    name: 'Birthday',        description: 'Birthday celebration',          icon: 'cake',       sortOrder: 3 },
  { slug: 'corporate',   name: 'Corporate Event', description: 'Corporate events and gatherings', icon: 'briefcase', sortOrder: 4 },
  { slug: 'baby-shower', name: 'Baby Shower',     description: 'Baby shower celebration',       icon: 'baby',       sortOrder: 5 },
  { slug: 'anniversary', name: 'Anniversary',     description: 'Anniversary celebration',       icon: 'champagne',  sortOrder: 6 },
  { slug: 'reception',   name: 'Reception',       description: 'Reception party',               icon: 'glass',      sortOrder: 7 },
  { slug: 'mehendi',     name: 'Mehendi',         description: 'Mehendi / Henna ceremony',      icon: 'flower',     sortOrder: 8 },
  { slug: 'sangeet',     name: 'Sangeet',         description: 'Sangeet night',                 icon: 'music',      sortOrder: 9 },
  { slug: 'haldi',       name: 'Haldi',           description: 'Haldi ceremony',                icon: 'sun',        sortOrder: 10 },
]

async function main() {
  console.log('🌱  Seeding event types (upsert — safe for live data)...\n')

  let created = 0
  let updated = 0

  for (const et of EVENT_TYPES) {
    const existing = await prisma.eventType.findUnique({ where: { slug: et.slug } })

    if (existing) {
      // Only patch fields that have changed — never touch isActive if already set
      await prisma.eventType.update({
        where: { slug: et.slug },
        data: {
          name: et.name,
          description: et.description,
          icon: et.icon,
          sortOrder: et.sortOrder,
        },
      })
      console.log(`  ↺  Updated  : ${et.name} (${et.slug})`)
      updated++
    } else {
      await prisma.eventType.create({
        data: {
          ...et,
          isActive: true,
        },
      })
      console.log(`  ✚  Created  : ${et.name} (${et.slug})`)
      created++
    }
  }

  console.log(`\n✅  Done — ${created} created, ${updated} updated, ${EVENT_TYPES.length} total.`)
}

main()
  .catch((e) => {
    console.error('❌  Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

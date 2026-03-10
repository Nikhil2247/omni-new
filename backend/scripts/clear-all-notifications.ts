/**
 * Script to delete all notifications from the database.
 *
 * Usage:
 *   npx ts-node scripts/clear-all-notifications.ts --dry-run
 *   npx ts-node scripts/clear-all-notifications.ts --yes
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL
const isAccelerate = connectionString?.startsWith('prisma://')

const prisma = isAccelerate
  ? new PrismaClient({ log: ['info', 'warn', 'error'] })
  : new PrismaClient({
      adapter: new PrismaPg(new Pool({ connectionString })),
      log: ['info', 'warn', 'error'],
    })

async function clearAllNotifications() {
  const isDryRun = process.argv.includes('--dry-run')
  const isConfirmed = process.argv.includes('--yes')

  if (!isDryRun && !isConfirmed) {
    console.log('Refusing to delete notifications without confirmation.')
    console.log('Run with --yes to proceed, or --dry-run to preview the impact.')
    process.exit(1)
  }

  try {
    const total = await prisma.notification.count()

    if (isDryRun) {
      console.log(`[DRY RUN] Notifications that would be deleted: ${total}`)
      return
    }

    if (total === 0) {
      console.log('No notifications found. Nothing to delete.')
      return
    }

    const result = await prisma.notification.deleteMany({})
    console.log(`Deleted ${result.count} notifications.`)
  } catch (error) {
    console.error('Failed to clear notifications:', error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

void clearAllNotifications()

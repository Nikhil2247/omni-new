// ============================================================================
// PRISMA SCRIPT - Set Vendors to UNCLAIMED Status
// ============================================================================
// Sets all VendorProfile records to UNCLAIMED where:
// - userId IS NULL (no owner yet)
// - status is NOT already 'UNCLAIMED'
// Run: npx ts-node prisma/scripts/set-vendors-unclaimed.ts
// ============================================================================

import 'dotenv/config'
import { PrismaClient, VendorStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

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
// MAIN FUNCTION
// ============================================================================

async function setVendorsUnclaimed() {
  console.log('Starting: Set vendors to UNCLAIMED status...')

  try {
    // Find all VendorProfile records where userId is null and status is not UNCLAIMED
    const vendorsToUpdate = await prisma.vendorProfile.findMany({
      where: {
        userId: null,
        status: {
          not: VendorStatus.UNCLAIMED,
        },
      },
      select: {
        id: true,
        businessName: true,
        status: true,
      },
    })

    console.log(`Found ${vendorsToUpdate.length} vendor(s) to update`)

    if (vendorsToUpdate.length === 0) {
      console.log('No vendors need to be updated.')
      return
    }

    // Log the vendors that will be updated
    console.log('\nVendors to be updated:')
    for (const vendor of vendorsToUpdate) {
      console.log(`  - ${vendor.businessName} (ID: ${vendor.id}, Current Status: ${vendor.status})`)
    }

    // Update all matching records to UNCLAIMED status
    const result = await prisma.vendorProfile.updateMany({
      where: {
        userId: null,
        status: {
          not: VendorStatus.UNCLAIMED,
        },
      },
      data: {
        status: VendorStatus.UNCLAIMED,
      },
    })

    console.log(`\nSuccessfully updated ${result.count} vendor(s) to UNCLAIMED status`)
  } catch (error) {
    console.error('Error updating vendors:', error)
    throw error
  }
}

// ============================================================================
// EXECUTE
// ============================================================================

setVendorsUnclaimed()
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('\nPrisma disconnected. Script completed.')
  })

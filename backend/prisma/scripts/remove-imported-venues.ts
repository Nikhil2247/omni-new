// ============================================================================
// PRISMA SCRIPT - Remove Imported Venue Profiles
// ============================================================================
// Removes all vendor profiles with:
// - status: UNCLAIMED
// - planTier: PUBLIC
// - category: venue
// Run: npx ts-node prisma/scripts/remove-imported-venues.ts
// ============================================================================

import 'dotenv/config'
import { PrismaClient, VendorStatus, PlanTier } from '@prisma/client'
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

async function removeImportedVenues() {
  console.log('========================================')
  console.log('Remove Imported Venue Profiles')
  console.log('========================================\n')

  try {
    // Find the venue category
    const venueCategory = await prisma.category.findFirst({
      where: { slug: 'venue' },
    })

    if (!venueCategory) {
      console.log('Venue category not found')
      return
    }

    console.log(`Found venue category: ${venueCategory.name} (${venueCategory.id})\n`)

    // Find all unclaimed public vendors in venue category
    const vendors = await prisma.vendorProfile.findMany({
      where: {
        status: VendorStatus.UNCLAIMED,
        planTier: PlanTier.PUBLIC,
        categoryId: venueCategory.id,
      },
      select: {
        id: true,
        businessName: true,
        addressId: true,
      },
    })

    console.log(`Found ${vendors.length} venue(s) to delete\n`)

    if (vendors.length === 0) {
      console.log('No venues to delete.')
      return
    }

    // Delete in batches for better performance
    let deleted = 0
    let failed = 0

    for (const vendor of vendors) {
      try {
        await prisma.$transaction(async (tx) => {
          // Delete subscriptions first
          await tx.subscription.deleteMany({
            where: { vendorProfileId: vendor.id },
          })

          // Delete vendor profile
          await tx.vendorProfile.delete({
            where: { id: vendor.id },
          })

          // Delete address if exists
          if (vendor.addressId) {
            await tx.address.delete({
              where: { id: vendor.addressId },
            }).catch(() => {}) // Ignore if address is shared or doesn't exist
          }
        })

        console.log(`  - Deleted: ${vendor.businessName}`)
        deleted++
      } catch (error) {
        console.error(`  x Failed: ${vendor.businessName} - ${error}`)
        failed++
      }
    }

    console.log('\n========================================')
    console.log(`Successfully deleted: ${deleted} venue(s)`)
    if (failed > 0) {
      console.log(`Failed to delete: ${failed} venue(s)`)
    }
    console.log('========================================')

  } catch (error) {
    console.error('Error removing venues:', error)
    throw error
  }
}

removeImportedVenues()
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('\nPrisma disconnected. Script completed.')
  })

/**
 * Script to filter vendors - keeps only specific vendors and venue category vendors
 * Deletes all other vendors with their portfolios
 *
 * Run with: npx ts-node scripts/filter-vendors.ts
 * Or with dry-run: npx ts-node scripts/filter-vendors.ts --dry-run
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

// Vendors to keep by business name
const VENDORS_TO_KEEP = [
  'Ramola Catering',
  'Dev Tent Services',
  'Hari Chand Tent',
  'Shiva Catering',
  'Gourmet Catering',
  'Ramji Catering',
  'Rawat Portrait',
  'Vikas Tent',
  'Party Plan It',
  'Priya Uphadaya',
  'Mystique Gala',
  'GCB Chaat Service',
  'Maharaja DJ and Maharana Band',
  'Awaz Eklawaya',
  'Fresh Flower Decor',
  'Prince Flower Decorator',
  'DJ Ammy',
]

// Normalize vendor names for comparison (lowercase, trim whitespace)
const normalizeVendorName = (name: string): string => {
  return name.toLowerCase().trim()
}

const NORMALIZED_VENDORS_TO_KEEP = VENDORS_TO_KEEP.map(normalizeVendorName)

async function filterVendors() {
  const isDryRun = process.argv.includes('--dry-run')

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n')
  }

  try {
    console.log('📋 Starting vendor filter process...\n')

    // Step 1: Find the "venues" category
    const venuesCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: 'venues' },
          { name: { equals: 'Venues', mode: 'insensitive' } },
        ],
      },
    })

    if (venuesCategory) {
      console.log(`✅ Found venues category: "${venuesCategory.name}" (ID: ${venuesCategory.id})`)
    } else {
      console.log('⚠️ No venues category found - only keeping vendors by name')
    }

    // Step 2: Get all vendors
    const allVendors = await prisma.vendorProfile.findMany({
      include: {
        category: true,
        portfolios: {
          select: { id: true },
        },
      },
    })

    console.log(`\n📊 Total vendors in database: ${allVendors.length}`)

    // Step 3: Categorize vendors
    const vendorsToKeep: typeof allVendors = []
    const vendorsToDelete: typeof allVendors = []

    for (const vendor of allVendors) {
      const normalizedName = normalizeVendorName(vendor.businessName)
      const isInKeepList = NORMALIZED_VENDORS_TO_KEEP.includes(normalizedName)
      const isVenueVendor = venuesCategory && vendor.categoryId === venuesCategory.id

      if (isInKeepList || isVenueVendor) {
        vendorsToKeep.push(vendor)
      } else {
        vendorsToDelete.push(vendor)
      }
    }

    console.log(`\n✅ Vendors to KEEP: ${vendorsToKeep.length}`)
    console.log('─'.repeat(50))
    for (const v of vendorsToKeep) {
      const reason = venuesCategory && v.categoryId === venuesCategory.id
        ? '[VENUES]'
        : '[NAMED]'
      console.log(`   ${reason} ${v.businessName} (${v.category?.name || 'no category'})`)
    }

    console.log(`\n❌ Vendors to DELETE: ${vendorsToDelete.length}`)
    console.log('─'.repeat(50))
    for (const v of vendorsToDelete) {
      const portfolioCount = v.portfolios.length
      console.log(`   - ${v.businessName} (${v.category?.name || 'no category'}) - ${portfolioCount} portfolios`)
    }

    // Step 4: Delete vendors that are not in the keep list
    if (vendorsToDelete.length > 0) {
      if (!isDryRun) {
        console.log('\n🗑️ Deleting vendors...')

        const vendorIdsToDelete = vendorsToDelete.map(v => v.id)

        const deleteResult = await prisma.vendorProfile.deleteMany({
          where: {
            id: { in: vendorIdsToDelete },
          },
        })

        console.log(`   ✅ Deleted ${deleteResult.count} vendor profiles (with cascaded portfolios and media items)`)
      } else {
        console.log(`\n🗑️ Would delete ${vendorsToDelete.length} vendor profiles`)
      }
    } else {
      console.log('\n✅ No vendors to delete')
    }

    console.log('\n' + '═'.repeat(50))
    console.log('📊 SUMMARY')
    console.log('═'.repeat(50))
    console.log(`   Vendors kept: ${vendorsToKeep.length}`)
    console.log(`   Vendors deleted: ${isDryRun ? '(would delete) ' : ''}${vendorsToDelete.length}`)

    if (isDryRun) {
      console.log('\n⚠️ This was a DRY RUN. Run without --dry-run to apply changes.')
    }

    console.log('\n✅ Vendor filter completed!')

  } catch (error) {
    console.error('❌ Error during filter:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

filterVendors()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))

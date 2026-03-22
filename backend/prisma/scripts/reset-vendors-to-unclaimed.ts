// ============================================================================
// PRISMA SCRIPT - Reset Vendors to UNCLAIMED with PUBLIC Plan
// ============================================================================
// Resets vendors that have userId and ACTIVE status:
// 1. Sets status to UNCLAIMED
// 2. Clears userId (sets to null)
// 3. Cancels any existing subscriptions
// 4. Creates a PUBLIC plan subscription (for unclaimed vendors)
// Run: npx ts-node prisma/scripts/reset-vendors-to-unclaimed.ts
// ============================================================================

import 'dotenv/config'
import { PrismaClient, VendorStatus, SubscriptionStatus, BillingCycle } from '@prisma/client'
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

async function resetVendorsToUnclaimed() {
  console.log('Starting: Reset vendors to UNCLAIMED with PUBLIC plan...\n')

  try {
    // Step 1: Find the PUBLIC vendor plan
    const publicPlan = await prisma.subscriptionPlan.findUnique({
      where: { slug: 'vendor-public' },
      include: {
        prices: {
          where: {
            currency: 'INR',
            billingCycle: BillingCycle.MONTHLY,
          },
          take: 1,
        },
      },
    })

    if (!publicPlan) {
      console.error('ERROR: PUBLIC vendor plan (vendor-public) not found!')
      console.log('Please run the subscription plans seed first:')
      console.log('  npx ts-node prisma/seeds/subscription-plans.seed.ts')
      return
    }

    const publicPrice = publicPlan.prices[0]
    if (!publicPrice) {
      console.error('ERROR: PUBLIC plan price not found!')
      return
    }

    console.log(`Found PUBLIC plan: ${publicPlan.name} (ID: ${publicPlan.id})`)
    console.log(`Price ID: ${publicPrice.id}\n`)

    // Step 2: Find all vendors with userId AND status = ACTIVE
    const vendorsToReset = await prisma.vendorProfile.findMany({
      where: {
        userId: { not: null },
        status: VendorStatus.ACTIVE,
      },
      select: {
        id: true,
        businessName: true,
        status: true,
        userId: true,
      },
    })

    console.log(`Found ${vendorsToReset.length} vendor(s) to reset\n`)

    if (vendorsToReset.length === 0) {
      console.log('No vendors need to be reset.')
      return
    }

    // Log the vendors that will be reset
    console.log('Vendors to be reset:')
    for (const vendor of vendorsToReset) {
      console.log(`  - ${vendor.businessName} (ID: ${vendor.id}, UserID: ${vendor.userId})`)
    }
    console.log('')

    // Step 3: Process each vendor
    let successCount = 0
    let errorCount = 0

    for (const vendor of vendorsToReset) {
      try {
        await prisma.$transaction(async (tx) => {
          // 3a. Cancel any existing active subscriptions
          await tx.subscription.updateMany({
            where: {
              vendorProfileId: vendor.id,
              status: {
                in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE],
              },
            },
            data: {
              status: SubscriptionStatus.CANCELLED,
              cancelledAt: new Date(),
              currentPeriodEnd: new Date(),
            },
          })

          // 3b. Update vendor profile - set UNCLAIMED and clear userId
          await tx.vendorProfile.update({
            where: { id: vendor.id },
            data: {
              status: VendorStatus.UNCLAIMED,
              userId: null,
            },
          })

          // 3c. Create new PUBLIC subscription
          await tx.subscription.create({
            data: {
              vendorProfileId: vendor.id,
              planId: publicPlan.id,
              priceId: publicPrice.id,
              status: SubscriptionStatus.ACTIVE,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100 years (effectively forever)
              cancelAtPeriodEnd: false,
            },
          })
        })

        console.log(`  ✓ Reset: ${vendor.businessName}`)
        successCount++
      } catch (error) {
        console.error(`  ✗ Failed: ${vendor.businessName} - ${error}`)
        errorCount++
      }
    }

    console.log('\n========================================')
    console.log(`Successfully reset: ${successCount} vendor(s)`)
    if (errorCount > 0) {
      console.log(`Failed: ${errorCount} vendor(s)`)
    }
    console.log('========================================')
  } catch (error) {
    console.error('Error resetting vendors:', error)
    throw error
  }
}

// ============================================================================
// EXECUTE
// ============================================================================

resetVendorsToUnclaimed()
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('\nPrisma disconnected. Script completed.')
  })

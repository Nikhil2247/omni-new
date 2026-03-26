// ============================================================================
// Quick script to add missing Delhi venues that were skipped due to email duplicates
// Run: npx ts-node prisma/scripts/add-missing-delhi-venues.ts
// ============================================================================

import 'dotenv/config'
import { PrismaClient, VendorStatus, SubscriptionStatus, BillingCycle, PlanTier } from '@prisma/client'
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

// Missing vendors from the CSV that were skipped due to duplicate emails
const missingVenues = [
  {
    venueName: 'Crowne Plaza Rohini',
    description: 'IHG Hotel with elegant event spaces in Rohini. Capacity: 300-560 guests. Ideal for wedding, reception, engagement, sangeet, mehndi ceremonies.',
    location: 'Twin District Centre, Swarn Jayanti Park, Sector 10, Rohini',
    service: 'Wedding, Reception, Multiple Functions',
    city: 'New Delhi',
    email: 'crowneplaza.rohini@ihg.com', // Unique email
    phone: '+91 78384 26565',
    website: 'www.ihg.com',
  },
  {
    venueName: 'Tivoli Garden Resort',
    description: 'Spacious wedding venue on GT Karnal Road with elegant facilities. Part of Tivoli group known for quality service and beautiful settings.',
    location: 'GT Karnal Road',
    service: 'Wedding, Garden Events, Banquets',
    city: 'New Delhi',
    email: 'tivoligarden@thetivolihotels.com', // Unique email
    phone: '011-47479999',
    website: 'www.thetivolihotels.com',
  },
  {
    venueName: 'Omnia by Tivoli',
    description: 'Premium wedding venue in South Delhi by Tivoli group. Features sophisticated design and comprehensive wedding services with elegant facilities.',
    location: 'South Delhi',
    service: 'Wedding, Premium Events',
    city: 'New Delhi',
    email: 'omnia@thetivolihotels.com', // Unique email
    phone: '011-47479999',
    website: 'www.thetivolihotels.com',
  },
]

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function main() {
  console.log('Adding missing Delhi venues...\n')

  try {
    // Find Venues category
    const venuesCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: 'venues' },
          { name: { contains: 'Venue', mode: 'insensitive' } },
        ],
      },
    })

    if (!venuesCategory) {
      console.error('ERROR: Venues category not found!')
      return
    }

    console.log(`Using category: ${venuesCategory.name}\n`)

    // Find Delhi city
    const delhiState = await prisma.state.findFirst({
      where: { name: { contains: 'Delhi', mode: 'insensitive' } },
    })

    if (!delhiState) {
      console.error('ERROR: Delhi state not found!')
      return
    }

    const newDelhiCity = await prisma.city.findFirst({
      where: {
        name: { contains: 'New Delhi', mode: 'insensitive' },
        stateId: delhiState.id,
      },
    })

    if (!newDelhiCity) {
      console.error('ERROR: New Delhi city not found!')
      return
    }

    console.log(`Using city: ${newDelhiCity.name}\n`)

    // Find PUBLIC plan
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

    if (!publicPlan || !publicPlan.prices[0]) {
      console.error('ERROR: PUBLIC plan not found!')
      return
    }

    const publicPrice = publicPlan.prices[0]
    console.log(`Using plan: ${publicPlan.name}\n`)

    // Process each venue
    let successCount = 0
    let skippedCount = 0

    for (const venue of missingVenues) {
      const slug = generateSlug(venue.venueName)

      // Check if already exists
      const existing = await prisma.vendorProfile.findUnique({
        where: { slug },
      })

      if (existing) {
        console.log(`  - Skipped (exists): ${venue.venueName}`)
        skippedCount++
        continue
      }

      await prisma.$transaction(async (tx) => {
        // Create address
        const address = await tx.address.create({
          data: {
            addressLine1: venue.location,
            city: { connect: { id: newDelhiCity.id } },
            postalCode: '110000',
          },
        })

        // Create vendor profile
        const vendorProfile = await tx.vendorProfile.create({
          data: {
            businessName: venue.venueName,
            slug,
            description: venue.description,
            tagline: venue.service,
            categoryId: venuesCategory.id,
            addressId: address.id,
            contactEmail: venue.email,
            contactPhone: venue.phone,
            website: venue.website.startsWith('http') ? venue.website : `https://${venue.website}`,
            status: VendorStatus.UNCLAIMED,
            planTier: PlanTier.PUBLIC,
            userId: null,
            leadCount: 0,
            viewCount: 0,
            totalReviews: 0,
            adCredits: 0,
            searchBoost: 0,
          },
        })

        // Create subscription
        await tx.subscription.create({
          data: {
            vendorProfileId: vendorProfile.id,
            planId: publicPlan.id,
            priceId: publicPrice.id,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false,
          },
        })

        console.log(`  + Created: ${venue.venueName}`)
      })

      successCount++
    }

    console.log('\n========================================')
    console.log(`Successfully added: ${successCount} venue(s)`)
    console.log(`Skipped (already exist): ${skippedCount} venue(s)`)
    console.log('========================================')

  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

main()
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('\nDone.')
  })

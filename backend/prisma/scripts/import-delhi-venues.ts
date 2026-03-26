// ============================================================================
// PRISMA SCRIPT - Import Delhi Wedding Venues as UNCLAIMED with PUBLIC Plan
// ============================================================================
// Creates vendor profiles from spreadsheet data:
// 1. Creates vendor profiles with status = UNCLAIMED
// 2. Sets planTier = PUBLIC
// 3. Creates addresses for each venue
// 4. Creates PUBLIC plan subscription (for unclaimed vendors)
// Run: npx ts-node prisma/scripts/import-delhi-venues.ts
// ============================================================================

import 'dotenv/config'
import { PrismaClient, VendorStatus, SubscriptionStatus, BillingCycle, PlanTier } from '@prisma/client'
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
// VENUE DATA FROM SPREADSHEET
// ============================================================================

interface VenueData {
  sNo: number
  venueName: string
  description: string
  location: string
  service: string
  city: string
  email: string
  phone: string
  website: string
  coverImage: string
}

const delhiVenues: VenueData[] = [
  {
    sNo: 1,
    venueName: 'JW Marriott New Delhi Aerocity',
    description: 'Premium hospitality, elegant event venues, and world-class service',
    location: 'Aerocity, New Delhi',
    service: 'Weddings, Receptions, Corporate Events',
    city: 'New Delhi',
    email: 'events.newdelhi@marriott.com',
    phone: '+91 11 4521 2121',
    website: 'https://www.marriott.com/en-us/hotels/deljw-jw-marriott-hotel-new-delhi-aerocity/',
    coverImage: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
  },
  {
    sNo: 2,
    venueName: 'The Leela Palace New Delhi',
    description: 'Premium wedding packages with exclusive planning services',
    location: 'Diplomatic Enclave, Chanakyapuri',
    service: 'Weddings, Receptions, Destination Weddings',
    city: 'New Delhi',
    email: 'reservations@theleela.com',
    phone: '+91 11 3933 1234',
    website: 'https://www.theleela.com/the-leela-palace-new-delhi/',
    coverImage: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
  },
  {
    sNo: 3,
    venueName: 'The Tivoli New Delhi',
    description: 'Largest luxury wedding venue in South Delhi with 82,500 sq ft banquet space, capacity 200-2000 guests',
    location: 'Chattarpur, South Delhi',
    service: 'Weddings, Receptions, Banquets',
    city: 'New Delhi',
    email: 'info@thetivoli.in',
    phone: '+91 11 4664 4664',
    website: 'https://www.thetivoli.in/',
    coverImage: 'https://images.unsplash.com/photo-1505932794465-147d1f1b2c97?w=800',
  },
  {
    sNo: 4,
    venueName: 'Mallu Farms',
    description: "Winner of Users' Choice Awards 2024, lush lawns and elegant indoor spaces",
    location: 'Chattarpur, South Delhi',
    service: 'Weddings, Pre-wedding Events, Receptions',
    city: 'New Delhi',
    email: 'info@mallufarms.com',
    phone: '+91 98111 00000',
    website: 'https://www.mallufarms.com/',
    coverImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800',
  },
  {
    sNo: 5,
    venueName: 'ITC Maurya New Delhi',
    description: 'Iconic 5-star hotel offering grand ballrooms and exquisite catering for luxury weddings',
    location: 'Diplomatic Enclave, Chanakyapuri',
    service: 'Weddings, Receptions, Corporate Events',
    city: 'New Delhi',
    email: 'reservations.itcmaurya@itchotels.in',
    phone: '+91 11 2611 2233',
    website: 'https://www.itchotels.com/in/en/itcmaurya-new-delhi',
    coverImage: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800',
  },
  {
    sNo: 6,
    venueName: 'The Oberoi New Delhi',
    description: 'Elegant venue with panoramic views and world-class hospitality',
    location: 'Dr. Zakir Hussain Marg, New Delhi',
    service: 'Weddings, Intimate Celebrations, Receptions',
    city: 'New Delhi',
    email: 'reservations.newdelhi@oberoihotels.com',
    phone: '+91 11 2436 3030',
    website: 'https://www.oberoihotels.com/hotels-in-delhi/',
    coverImage: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800',
  },
  {
    sNo: 7,
    venueName: 'Taj Palace New Delhi',
    description: 'Palatial grandeur with sprawling lawns and opulent interiors',
    location: 'Sardar Patel Marg, Diplomatic Enclave',
    service: 'Weddings, Receptions, Royal Celebrations',
    city: 'New Delhi',
    email: 'tajpalace.delhi@tajhotels.com',
    phone: '+91 11 2611 0202',
    website: 'https://www.tajhotels.com/en-in/taj-palace-new-delhi/',
    coverImage: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800',
  },
  {
    sNo: 8,
    venueName: 'Radisson Blu Plaza Delhi Airport',
    description: 'Modern venue with multiple banquet halls near the airport',
    location: 'Mahipalpur, New Delhi',
    service: 'Weddings, Corporate Events, Conferences',
    city: 'New Delhi',
    email: 'reservations.newdelhi@radissonblu.com',
    phone: '+91 11 2677 9191',
    website: 'https://www.radissonhotels.com/en-us/hotels/radisson-blu-delhi-airport',
    coverImage: 'https://images.unsplash.com/photo-1549415507-66eb57f3f010?w=800',
  },
  {
    sNo: 9,
    venueName: 'Shangri-La Eros New Delhi',
    description: 'Luxurious setting with exceptional service and stunning event spaces',
    location: 'Connaught Place, New Delhi',
    service: 'Weddings, Receptions, Gala Events',
    city: 'New Delhi',
    email: 'newdelhi@shangri-la.com',
    phone: '+91 11 4119 1919',
    website: 'https://www.shangri-la.com/newdelhi/shangrila/',
    coverImage: 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=800',
  },
  {
    sNo: 10,
    venueName: 'The Lodhi New Delhi',
    description: 'Contemporary luxury with private plunge pools and serene gardens',
    location: 'Lodhi Road, New Delhi',
    service: 'Intimate Weddings, Boutique Celebrations',
    city: 'New Delhi',
    email: 'reservations.thelodhi@theleela.com',
    phone: '+91 11 4363 3333',
    website: 'https://www.theleela.com/the-lodhi-new-delhi/',
    coverImage: 'https://images.unsplash.com/photo-1529290130-4ca3753253ae?w=800',
  },
  {
    sNo: 11,
    venueName: 'Crowne Plaza New Delhi Okhla',
    description: 'Versatile event spaces with modern amenities and professional services',
    location: 'Okhla Phase I, New Delhi',
    service: 'Weddings, Corporate Events, Conferences',
    city: 'New Delhi',
    email: 'reservations@crowneplazaokhla.com',
    phone: '+91 11 4900 0000',
    website: 'https://www.ihg.com/crowneplaza/hotels/us/en/new-delhi/delcr/hoteldetail',
    coverImage: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800',
  },
  {
    sNo: 12,
    venueName: 'Hyatt Regency Delhi',
    description: 'Award-winning hospitality with spacious ballrooms and outdoor venues',
    location: 'Ring Road, New Delhi',
    service: 'Weddings, Receptions, Grand Celebrations',
    city: 'New Delhi',
    email: 'delhi.regency@hyatt.com',
    phone: '+91 11 2679 1234',
    website: 'https://www.hyatt.com/en-US/hotel/india/hyatt-regency-delhi/delhr',
    coverImage: 'https://images.unsplash.com/photo-1462539405390-d0bdb635c7d1?w=800',
  },
  {
    sNo: 13,
    venueName: 'Le Meridien New Delhi',
    description: 'Central location with sophisticated event spaces and culinary excellence',
    location: 'Windsor Place, Janpath',
    service: 'Weddings, Receptions, Corporate Events',
    city: 'New Delhi',
    email: 'reservations.lemnewdelhi@lemeridien.com',
    phone: '+91 11 2371 0101',
    website: 'https://www.marriott.com/en-us/hotels/delmd-le-meridien-new-delhi/',
    coverImage: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800',
  },
  {
    sNo: 14,
    venueName: 'Pride Plaza Hotel Aerocity',
    description: 'Modern banquet facilities with contemporary design and excellent connectivity',
    location: 'Aerocity, New Delhi',
    service: 'Weddings, Corporate Events, Celebrations',
    city: 'New Delhi',
    email: 'reservations.aerocity@pridehotel.com',
    phone: '+91 11 4610 0100',
    website: 'https://www.pridehotel.com/pride-plaza-hotel-aerocity-new-delhi/',
    coverImage: 'https://images.unsplash.com/photo-1544986581-efac024faf62?w=800',
  },
  {
    sNo: 15,
    venueName: 'Pullman New Delhi Aerocity',
    description: 'Contemporary luxury with pillar-less ballrooms and state-of-the-art facilities',
    location: 'Aerocity, New Delhi',
    service: 'Weddings, Receptions, Gala Events',
    city: 'New Delhi',
    email: 'H9646@accor.com',
    phone: '+91 11 4619 6969',
    website: 'https://www.pullman-newdelhi-aerocity.com/',
    coverImage: 'https://images.unsplash.com/photo-1522413452208-996ff3f3e740?w=800',
  },
  {
    sNo: 16,
    venueName: 'Roseate House New Delhi',
    description: 'Boutique luxury with intimate celebration spaces and personalized service',
    location: 'Aerocity, New Delhi',
    service: 'Intimate Weddings, Boutique Events',
    city: 'New Delhi',
    email: 'reservations@roseatehotels.com',
    phone: '+91 11 7155 8899',
    website: 'https://www.roseatehotels.com/newdelhi/roseatehouse/',
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
  },
  {
    sNo: 17,
    venueName: 'Andaz Delhi',
    description: 'Artistic and vibrant spaces with contemporary Indian design elements',
    location: 'Aerocity, New Delhi',
    service: 'Weddings, Modern Celebrations, Receptions',
    city: 'New Delhi',
    email: 'delhi.andaz@hyatt.com',
    phone: '+91 11 4903 1234',
    website: 'https://www.hyatt.com/en-US/hotel/india/andaz-delhi/delaz',
    coverImage: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800',
  },
  {
    sNo: 18,
    venueName: 'Jaypee Vasant Continental',
    description: 'Established venue with multiple banquet options and experienced event team',
    location: 'Vasant Vihar, New Delhi',
    service: 'Weddings, Receptions, Corporate Events',
    city: 'New Delhi',
    email: 'reservation.jvc@jaypeehotels.com',
    phone: '+91 11 2614 8800',
    website: 'https://www.jaypeehotels.com/hotel-jaypee-vasant-continental-delhi/',
    coverImage: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?w=800',
  },
  {
    sNo: 19,
    venueName: 'The Grand New Delhi',
    description: 'Majestic architecture with grand ballrooms and royal ambiance',
    location: 'Nelson Mandela Road, Vasant Kunj',
    service: 'Weddings, Royal Celebrations, Receptions',
    city: 'New Delhi',
    email: 'reservations@thegrandnewdelhi.com',
    phone: '+91 11 2677 1234',
    website: 'https://www.thegrandnewdelhi.com/',
    coverImage: 'https://images.unsplash.com/photo-1467987506553-8f3916508521?w=800',
  },
  {
    sNo: 20,
    venueName: 'The Suryaa New Delhi',
    description: 'Award-winning hotel with versatile event spaces and culinary expertise',
    location: 'New Friends Colony, New Delhi',
    service: 'Weddings, Receptions, Social Events',
    city: 'New Delhi',
    email: 'reservations@thesuryaa.com',
    phone: '+91 11 2683 5070',
    website: 'https://www.thesuryaa.com/',
    coverImage: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800',
  },
  {
    sNo: 21,
    venueName: 'Chattarpur Farms',
    description: 'Sprawling farmhouse venues with customizable outdoor and indoor spaces',
    location: 'Chattarpur, South Delhi',
    service: 'Weddings, Pre-wedding Events, Theme Parties',
    city: 'New Delhi',
    email: 'info@chattarpurfarms.com',
    phone: '+91 98100 00000',
    website: 'https://www.chattarpurfarms.com/',
    coverImage: 'https://images.unsplash.com/photo-1505932794465-147d1f1b2c97?w=800',
  },
  {
    sNo: 22,
    venueName: 'The Ashok Hotel',
    description: 'Government-owned heritage property with iconic architecture and vast grounds',
    location: '50-B Chanakyapuri, New Delhi',
    service: 'Weddings, State Functions, Grand Events',
    city: 'New Delhi',
    email: 'reservation@theashok.com',
    phone: '+91 11 2611 0101',
    website: 'https://www.theashok.com/',
    coverImage: 'https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?w=800',
  },
  {
    sNo: 23,
    venueName: 'Welcomhotel Dwarka',
    description: 'Modern ITC hotel with elegant banquet halls and signature dining',
    location: 'Dwarka, New Delhi',
    service: 'Weddings, Corporate Events, Celebrations',
    city: 'New Delhi',
    email: 'reservations.welcomhoteldwarka@itchotels.in',
    phone: '+91 11 4607 5151',
    website: 'https://www.itchotels.com/in/en/welcomhoteldwarka-new-delhi',
    coverImage: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
  },
  {
    sNo: 24,
    venueName: 'Eros Hotel Nehru Place',
    description: 'Business district venue with versatile spaces for all celebration sizes',
    location: 'Nehru Place, New Delhi',
    service: 'Weddings, Corporate Events, Conferences',
    city: 'New Delhi',
    email: 'reservations@eroshotelnehruplace.com',
    phone: '+91 11 4600 3000',
    website: 'https://www.eroshotelnehruplace.com/',
    coverImage: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800',
  },
  {
    sNo: 25,
    venueName: 'The Claridges New Delhi',
    description: 'Colonial heritage hotel with manicured lawns and timeless elegance',
    location: '12 Dr. APJ Abdul Kalam Road',
    service: 'Weddings, Garden Events, Heritage Celebrations',
    city: 'New Delhi',
    email: 'reservations@claridges.com',
    phone: '+91 11 3955 5000',
    website: 'https://www.claridges.com/',
    coverImage: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?w=800',
  },
]

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function importDelhiVenues() {
  console.log('Starting: Import Delhi Wedding Venues as UNCLAIMED with PUBLIC plan...\n')

  try {
    // Step 1: Find the Venues category
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
      console.log('Please ensure the Venues category exists in the database.')
      console.log('You can run the main seed first: npx prisma db seed')
      return
    }

    console.log(`Found Venues category: ${venuesCategory.name} (ID: ${venuesCategory.id})\n`)

    // Step 2: Find or create State and City for Delhi
    let delhiState = await prisma.state.findFirst({
      where: { name: { contains: 'Delhi', mode: 'insensitive' } },
    })

    if (!delhiState) {
      // Find India country first
      let india = await prisma.country.findFirst({
        where: { name: { contains: 'India', mode: 'insensitive' } },
      })

      if (!india) {
        india = await prisma.country.create({
          data: {
            name: 'India',
            code: 'IND',
            code2: 'IN',
            dialCode: '+91',
            currency: 'INR',
            isActive: true,
          },
        })
        console.log('Created country: India')
      }

      delhiState = await prisma.state.create({
        data: {
          name: 'Delhi',
          countryId: india.id,
          isActive: true,
        },
      })
      console.log('Created state: Delhi')
    }

    let newDelhiCity = await prisma.city.findFirst({
      where: {
        name: { contains: 'New Delhi', mode: 'insensitive' },
        stateId: delhiState.id,
      },
    })

    if (!newDelhiCity) {
      newDelhiCity = await prisma.city.create({
        data: {
          name: 'New Delhi',
          stateId: delhiState.id,
          isActive: true,
        },
      })
      console.log('Created city: New Delhi')
    }

    console.log(`Using city: ${newDelhiCity.name} (ID: ${newDelhiCity.id})\n`)

    // Step 3: Find the PUBLIC vendor plan
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

    // Step 3: Process each venue
    let successCount = 0
    let errorCount = 0
    let skippedCount = 0

    console.log('Processing venues...\n')

    for (const venue of delhiVenues) {
      const slug = generateSlug(venue.venueName)

      try {
        // Check if vendor already exists
        const existingVendor = await prisma.vendorProfile.findUnique({
          where: { slug },
        })

        if (existingVendor) {
          console.log(`  - Skipped (exists): ${venue.venueName}`)
          skippedCount++
          continue
        }

        await prisma.$transaction(async (tx) => {
          // Create address first
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
              website: venue.website,
              bannerImageUrl: venue.coverImage,
              profilePhotoUrl: venue.coverImage,
              status: VendorStatus.UNCLAIMED,
              planTier: PlanTier.PUBLIC,
              userId: null, // Unclaimed - no user linked
              leadCount: 0,
              viewCount: 0,
              totalReviews: 0,
              adCredits: 0,
              searchBoost: 0,
            },
          })

          // Create PUBLIC subscription
          await tx.subscription.create({
            data: {
              vendorProfileId: vendorProfile.id,
              planId: publicPlan.id,
              priceId: publicPrice.id,
              status: SubscriptionStatus.ACTIVE,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100 years (effectively forever)
              cancelAtPeriodEnd: false,
            },
          })

          console.log(`  + Created: ${venue.venueName}`)
        })

        successCount++
      } catch (error) {
        console.error(`  x Failed: ${venue.venueName} - ${error}`)
        errorCount++
      }
    }

    console.log('\n========================================')
    console.log(`Successfully imported: ${successCount} venue(s)`)
    if (skippedCount > 0) {
      console.log(`Skipped (already exist): ${skippedCount} venue(s)`)
    }
    if (errorCount > 0) {
      console.log(`Failed: ${errorCount} venue(s)`)
    }
    console.log('========================================')

    // Summary of created vendors
    const createdVendors = await prisma.vendorProfile.findMany({
      where: {
        status: VendorStatus.UNCLAIMED,
        categoryId: venuesCategory.id,
      },
      select: {
        businessName: true,
        slug: true,
        status: true,
        planTier: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })

    console.log('\nRecent UNCLAIMED venues in database:')
    for (const vendor of createdVendors) {
      console.log(`  - ${vendor.businessName} (${vendor.slug}) | Status: ${vendor.status} | Plan: ${vendor.planTier}`)
    }
  } catch (error) {
    console.error('Error importing venues:', error)
    throw error
  }
}

// ============================================================================
// EXECUTE
// ============================================================================

importDelhiVenues()
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('\nPrisma disconnected. Script completed.')
  })

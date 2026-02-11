// ============================================================================
// PRISMA SEED - Comprehensive Data Generator
// ============================================================================
// Generates realistic test data for development and testing
// Run: npm run seed or npx prisma db seed
// ============================================================================

import 'dotenv/config'
import {
  PrismaClient,
  UserStatus,
  VendorStatus,
  LeadStatus,
  LeadSource,
  EventStatus,
  RSVPStatus,
  NotificationType,
  NotificationChannel,
  PricingType,
  CatalogMediaType,
  EventVendorStatus,
  KYCStatus,
  DocumentType,
  DocumentStatus,
  VendorBadgeMetric,
  BlogStatus,
  PlanTier,
  FeatureLimitType,
  BillingCycle,
  SubscriptionStatus,
  DiscountType,
  CouponAppliesTo,
  CouponDuration,
  EventOrigin,
  ActiveEventStatus,
  TaskPriority,
  OperationalTaskStatus,
  RequirementStatus,
  AgreementStatus,
  WhatsAppMessageType,
  WhatsAppMessageStatus,
  WeddingEventType,
  PartnerInviteStatus,
  UploadStatus,
  PlanningMediaType,
} from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

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
// CLEANUP FUNCTION - Delete all data in correct order
// ============================================================================
async function cleanupDatabase() {
  console.log('🧹 Cleaning up database...')

  // Subscription schema
  await prisma.payment.deleteMany()
  await prisma.invoiceLineItem.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.usageRecord.deleteMany()
  await prisma.paymentMethod.deleteMany()
  await prisma.subscriptionStatusHistory.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.coupon.deleteMany()
  await prisma.planPrice.deleteMany()
  await prisma.planFeature.deleteMany()
  await prisma.subscriptionPlan.deleteMany()

  // Content schema
  await prisma.blogPostTag.deleteMany()
  await prisma.blogPost.deleteMany()
  await prisma.blogTag.deleteMany()
  await prisma.blogCategory.deleteMany()

  // Operations schema
  await prisma.taskAttachment.deleteMany()
  await prisma.operationalTask.deleteMany()
  await prisma.provisionalInvoice.deleteMany()
  await prisma.vendorAgreement.deleteMany()
  await prisma.requirementItem.deleteMany()
  await prisma.requirementSheet.deleteMany()
  await prisma.eventNote.deleteMany()
  await prisma.activeEvent.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.dispute.deleteMany()
  await prisma.kYCDocument.deleteMany()
  await prisma.vendorKYC.deleteMany()

  // Planning schema
  await prisma.whatsAppMessage.deleteMany()
  await prisma.whatsAppTemplate.deleteMany()
  await prisma.weddingPartner.deleteMany()
  await prisma.weddingIdentity.deleteMany()
  await prisma.vibeQuizSelection.deleteMany()
  await prisma.vibeQuizResult.deleteMany()
  await prisma.vibeQuizImage.deleteMany()
  await prisma.guestUpload.deleteMany()
  await prisma.eventMemory.deleteMany()
  await prisma.wishlistItem.deleteMany()
  await prisma.wishlist.deleteMany()
  await prisma.timeline.deleteMany()
  await prisma.budgetItem.deleteMany()
  await prisma.budget.deleteMany()
  await prisma.guest.deleteMany()
  await prisma.guestlist.deleteMany()
  await prisma.checklistItem.deleteMany()
  await prisma.checklist.deleteMany()
  await prisma.eventVendor.deleteMany()
  await prisma.event.deleteMany()
  await prisma.checklistTemplate.deleteMany()
  await prisma.eventType.deleteMany()

  // Interaction schema
  await prisma.message.deleteMany()
  await prisma.leadStatusHistory.deleteMany()
  await prisma.lead.deleteMany()

  // Catalog schema
  await prisma.vendorBadge.deleteMany()
  await prisma.vendorBadgeDefinition.deleteMany()
  await prisma.reviewMedia.deleteMany()
  await prisma.vendorReview.deleteMany()
  await prisma.pricingTier.deleteMany()
  await prisma.service.deleteMany()
  await prisma.mediaItem.deleteMany()
  await prisma.portfolio.deleteMany()
  await prisma.serviceArea.deleteMany()
  await prisma.vendorTag.deleteMany()
  await prisma.businessHour.deleteMany()
  await prisma.vendorProfile.deleteMany()
  await prisma.serviceType.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.category.deleteMany()

  // Public schema - Analytics
  await prisma.vendorMetrics.deleteMany()
  await prisma.userEngagement.deleteMany()
  await prisma.searchQuery.deleteMany()
  await prisma.profileView.deleteMany()
  await prisma.platformMetrics.deleteMany()

  // Public schema - Identity
  await prisma.notification.deleteMany()
  await prisma.loginActivity.deleteMany()
  await prisma.apiKey.deleteMany()
  await prisma.userSession.deleteMany()
  await prisma.userRoleAssignment.deleteMany()
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()

  // Location
  await prisma.address.deleteMany()
  await prisma.city.deleteMany()
  await prisma.state.deleteMany()
  await prisma.country.deleteMany()

  // System
  await prisma.featureFlag.deleteMany()
  await prisma.systemConfig.deleteMany()

  console.log('✅ Database cleaned')
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================
async function main() {
  console.log('🌱 Starting seed...')

  // Clean up first
  await cleanupDatabase()

  // ============================================================================
  // STEP 1: SYSTEM CONFIG & FEATURE FLAGS
  // ============================================================================
  console.log('⚙️  Creating system configuration...')

  await prisma.systemConfig.create({
    data: {
      maintenanceMode: false,
      registrationEnabled: true,
      allowVendorOnboarding: true,
      supportEmail: 'support@omnicassion.com',
    },
  })

  await prisma.featureFlag.createMany({
    data: [
      { key: 'VIBE_QUIZ_ENABLED', description: 'Enable visual onboarding quiz', enabled: true },
      { key: 'WEDDING_IDENTITY_ENABLED', description: 'Enable couple profiles', enabled: true },
      { key: 'WHATSAPP_INTEGRATION', description: 'Enable WhatsApp messaging', enabled: true },
      { key: 'AI_RECOMMENDATIONS', description: 'Enable AI-powered recommendations', enabled: false },
      { key: 'GUEST_UPLOADS', description: 'Enable guest photo uploads', enabled: true },
    ],
  })

  console.log('✅ System configuration created')

  // ============================================================================
  // STEP 2: LOCATION DATA
  // ============================================================================
  console.log('📍 Creating location data...')

  // Countries
  const usa = await prisma.country.create({
    data: { name: 'United States', code: 'USA', code2: 'US', dialCode: '+1', currency: 'USD', isActive: true },
  })

  const india = await prisma.country.create({
    data: { name: 'India', code: 'IND', code2: 'IN', dialCode: '+91', currency: 'INR', isActive: true },
  })

  const uk = await prisma.country.create({
    data: { name: 'United Kingdom', code: 'GBR', code2: 'GB', dialCode: '+44', currency: 'GBP', isActive: true },
  })

  // US States
  const california = await prisma.state.create({ data: { name: 'California', code: 'CA', countryId: usa.id } })
  const newYork = await prisma.state.create({ data: { name: 'New York', code: 'NY', countryId: usa.id } })
  const texas = await prisma.state.create({ data: { name: 'Texas', code: 'TX', countryId: usa.id } })
  const florida = await prisma.state.create({ data: { name: 'Florida', code: 'FL', countryId: usa.id } })

  // India States
  const maharashtra = await prisma.state.create({ data: { name: 'Maharashtra', code: 'MH', countryId: india.id } })
  const karnataka = await prisma.state.create({ data: { name: 'Karnataka', code: 'KA', countryId: india.id } })
  const delhi = await prisma.state.create({ data: { name: 'Delhi', code: 'DL', countryId: india.id } })

  // UK Countries
  const england = await prisma.state.create({ data: { name: 'England', code: 'ENG', countryId: uk.id } })

  // Cities - USA
  const losAngeles = await prisma.city.create({ data: { name: 'Los Angeles', stateId: california.id } })
  const sanFrancisco = await prisma.city.create({ data: { name: 'San Francisco', stateId: california.id } })
  const sanDiego = await prisma.city.create({ data: { name: 'San Diego', stateId: california.id } })
  const newYorkCity = await prisma.city.create({ data: { name: 'New York City', stateId: newYork.id } })
  const brooklyn = await prisma.city.create({ data: { name: 'Brooklyn', stateId: newYork.id } })
  const houston = await prisma.city.create({ data: { name: 'Houston', stateId: texas.id } })
  const austin = await prisma.city.create({ data: { name: 'Austin', stateId: texas.id } })
  const miami = await prisma.city.create({ data: { name: 'Miami', stateId: florida.id } })

  // Cities - India
  const mumbai = await prisma.city.create({ data: { name: 'Mumbai', stateId: maharashtra.id } })
  const pune = await prisma.city.create({ data: { name: 'Pune', stateId: maharashtra.id } })
  const bangalore = await prisma.city.create({ data: { name: 'Bangalore', stateId: karnataka.id } })
  const newDelhi = await prisma.city.create({ data: { name: 'New Delhi', stateId: delhi.id } })

  // Cities - UK
  const london = await prisma.city.create({ data: { name: 'London', stateId: england.id } })
  const manchester = await prisma.city.create({ data: { name: 'Manchester', stateId: england.id } })

  // Addresses
  const addresses = await Promise.all([
    prisma.address.create({ data: { addressLine1: '123 Sunset Boulevard', cityId: losAngeles.id, postalCode: '90028', latitude: 34.0986, longitude: -118.3276 } }),
    prisma.address.create({ data: { addressLine1: '456 Market Street', cityId: sanFrancisco.id, postalCode: '94102', latitude: 37.7879, longitude: -122.4075 } }),
    prisma.address.create({ data: { addressLine1: '789 Fifth Avenue', cityId: newYorkCity.id, postalCode: '10022', latitude: 40.7614, longitude: -73.9776 } }),
    prisma.address.create({ data: { addressLine1: '321 Ocean Drive', cityId: miami.id, postalCode: '33139', latitude: 25.7825, longitude: -80.1324 } }),
    prisma.address.create({ data: { addressLine1: '101 Congress Avenue', cityId: austin.id, postalCode: '78701', latitude: 30.2672, longitude: -97.7431 } }),
    prisma.address.create({ data: { addressLine1: '50 Marine Drive', cityId: mumbai.id, postalCode: '400002', latitude: 18.9435, longitude: 72.8235 } }),
    prisma.address.create({ data: { addressLine1: '100 MG Road', cityId: bangalore.id, postalCode: '560001', latitude: 12.9716, longitude: 77.5946 } }),
    prisma.address.create({ data: { addressLine1: '10 Downing Street', cityId: london.id, postalCode: 'SW1A 2AA', latitude: 51.5034, longitude: -0.1276 } }),
  ])

  console.log('✅ Location data created')

  // ============================================================================
  // STEP 3: ROLES
  // ============================================================================
  console.log('👥 Creating roles...')

  const adminRole = await prisma.role.create({
    data: { name: 'ADMIN_SYSTEM', displayName: 'System Administrator', description: 'Full system access', isSystem: true, level: 100 },
  })

  const generalAdminRole = await prisma.role.create({
    data: { name: 'ADMIN', displayName: 'Administrator', description: 'Full access except system administration', isSystem: true, level: 90 },
  })

  const operationalAdminRole = await prisma.role.create({
    data: { name: 'OPERATIONAL_ADMIN', displayName: 'Operations Admin', description: 'Operations team administrator', isSystem: true, level: 80 },
  })

  const operationalManagerRole = await prisma.role.create({
    data: { name: 'OPERATIONAL_MANAGER', displayName: 'Operations Manager', description: 'Manages assigned events and tasks', isSystem: true, level: 70, parentRoleId: operationalAdminRole.id },
  })

  const operationalAssistantRole = await prisma.role.create({
    data: { name: 'OPERATIONAL_ASSISTANT', displayName: 'Operations Assistant', description: 'Assists with event coordination', isSystem: true, level: 60, parentRoleId: operationalManagerRole.id },
  })

  const marketingRole = await prisma.role.create({
    data: { name: 'MARKETING_SERVICES_ADMIN', displayName: 'Marketing Admin', description: 'Marketing services administrator', isSystem: true, level: 70 },
  })

  const vendorRole = await prisma.role.create({
    data: { name: 'BUSINESS_ADMIN', displayName: 'Business Admin', description: 'Vendor/business admin account', isSystem: true, level: 50 },
  })

  const plannerRole = await prisma.role.create({
    data: { name: 'USER', displayName: 'User', description: 'End user/planner account', isSystem: true, level: 10 },
  })

  console.log('✅ Roles created')

  // ============================================================================
  // STEP 4: CATEGORIES & SERVICE TYPES
  // ============================================================================
  console.log('📂 Creating categories and service types...')

  const photography = await prisma.category.create({
    data: { name: 'Photography', slug: 'photography', description: 'Professional photography services', icon: 'camera', sortOrder: 1 },
  })

  const videography = await prisma.category.create({
    data: { name: 'Videography', slug: 'videography', description: 'Professional video services', icon: 'video', sortOrder: 2 },
  })

  const catering = await prisma.category.create({
    data: { name: 'Catering', slug: 'catering', description: 'Food and beverage services', icon: 'utensils', sortOrder: 3 },
  })

  const venues = await prisma.category.create({
    data: { name: 'Venues', slug: 'venues', description: 'Event venues and locations', icon: 'building', sortOrder: 4 },
  })

  const entertainment = await prisma.category.create({
    data: { name: 'Entertainment', slug: 'entertainment', description: 'Music and entertainment', icon: 'music', sortOrder: 5 },
  })

  const florist = await prisma.category.create({
    data: { name: 'Florist', slug: 'florist', description: 'Floral arrangements and decor', icon: 'flower', sortOrder: 6 },
  })

  const makeup = await prisma.category.create({
    data: { name: 'Makeup & Hair', slug: 'makeup-hair', description: 'Beauty and styling services', icon: 'sparkles', sortOrder: 7 },
  })

  const decor = await prisma.category.create({
    data: { name: 'Decor & Design', slug: 'decor-design', description: 'Event decoration and design', icon: 'palette', sortOrder: 8 },
  })

  // Service Types
  const serviceTypes = await Promise.all([
    // Photography
    prisma.serviceType.create({ data: { categoryId: photography.id, name: 'Wedding Photography', slug: 'wedding-photography' } }),
    prisma.serviceType.create({ data: { categoryId: photography.id, name: 'Pre-Wedding Shoot', slug: 'pre-wedding-shoot' } }),
    prisma.serviceType.create({ data: { categoryId: photography.id, name: 'Portrait Photography', slug: 'portrait-photography' } }),
    prisma.serviceType.create({ data: { categoryId: photography.id, name: 'Event Photography', slug: 'event-photography' } }),
    // Videography
    prisma.serviceType.create({ data: { categoryId: videography.id, name: 'Wedding Film', slug: 'wedding-film' } }),
    prisma.serviceType.create({ data: { categoryId: videography.id, name: 'Cinematic Video', slug: 'cinematic-video' } }),
    prisma.serviceType.create({ data: { categoryId: videography.id, name: 'Documentary Style', slug: 'documentary-style' } }),
    // Catering
    prisma.serviceType.create({ data: { categoryId: catering.id, name: 'Full Service Catering', slug: 'full-service-catering' } }),
    prisma.serviceType.create({ data: { categoryId: catering.id, name: 'Buffet Catering', slug: 'buffet-catering' } }),
    prisma.serviceType.create({ data: { categoryId: catering.id, name: 'Cocktail & Appetizers', slug: 'cocktail-appetizers' } }),
    // Venues
    prisma.serviceType.create({ data: { categoryId: venues.id, name: 'Banquet Hall', slug: 'banquet-hall' } }),
    prisma.serviceType.create({ data: { categoryId: venues.id, name: 'Outdoor Venue', slug: 'outdoor-venue' } }),
    prisma.serviceType.create({ data: { categoryId: venues.id, name: 'Beach Venue', slug: 'beach-venue' } }),
    prisma.serviceType.create({ data: { categoryId: venues.id, name: 'Garden Venue', slug: 'garden-venue' } }),
    // Entertainment
    prisma.serviceType.create({ data: { categoryId: entertainment.id, name: 'DJ Services', slug: 'dj-services' } }),
    prisma.serviceType.create({ data: { categoryId: entertainment.id, name: 'Live Band', slug: 'live-band' } }),
    prisma.serviceType.create({ data: { categoryId: entertainment.id, name: 'Classical Music', slug: 'classical-music' } }),
    // Florist
    prisma.serviceType.create({ data: { categoryId: florist.id, name: 'Wedding Bouquets', slug: 'wedding-bouquets' } }),
    prisma.serviceType.create({ data: { categoryId: florist.id, name: 'Venue Florals', slug: 'venue-florals' } }),
    // Makeup
    prisma.serviceType.create({ data: { categoryId: makeup.id, name: 'Bridal Makeup', slug: 'bridal-makeup' } }),
    prisma.serviceType.create({ data: { categoryId: makeup.id, name: 'Hair Styling', slug: 'hair-styling' } }),
    // Decor
    prisma.serviceType.create({ data: { categoryId: decor.id, name: 'Full Event Design', slug: 'full-event-design' } }),
    prisma.serviceType.create({ data: { categoryId: decor.id, name: 'Lighting Design', slug: 'lighting-design' } }),
  ])

  console.log('✅ Categories and service types created')

  // ============================================================================
  // STEP 5: TAGS
  // ============================================================================
  console.log('🏷️  Creating tags...')

  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'Wedding', slug: 'wedding' } }),
    prisma.tag.create({ data: { name: 'Corporate', slug: 'corporate' } }),
    prisma.tag.create({ data: { name: 'Birthday', slug: 'birthday' } }),
    prisma.tag.create({ data: { name: 'Luxury', slug: 'luxury' } }),
    prisma.tag.create({ data: { name: 'Budget-Friendly', slug: 'budget-friendly' } }),
    prisma.tag.create({ data: { name: 'Outdoor', slug: 'outdoor' } }),
    prisma.tag.create({ data: { name: 'Indoor', slug: 'indoor' } }),
    prisma.tag.create({ data: { name: 'Modern', slug: 'modern' } }),
    prisma.tag.create({ data: { name: 'Traditional', slug: 'traditional' } }),
    prisma.tag.create({ data: { name: 'Elegant', slug: 'elegant' } }),
    prisma.tag.create({ data: { name: 'Rustic', slug: 'rustic' } }),
    prisma.tag.create({ data: { name: 'Bohemian', slug: 'bohemian' } }),
    prisma.tag.create({ data: { name: 'Minimalist', slug: 'minimalist' } }),
    prisma.tag.create({ data: { name: 'Destination', slug: 'destination' } }),
    prisma.tag.create({ data: { name: 'Intimate', slug: 'intimate' } }),
  ])

  console.log('✅ Tags created')

  // ============================================================================
  // STEP 5.5: VENDOR BADGE DEFINITIONS
  // ============================================================================
  console.log('🏅 Creating vendor badge definitions...')

  await prisma.vendorBadgeDefinition.createMany({
    data: [
      {
        key: 'followers-10',
        name: 'Rising Favorite',
        description: 'Reached 10 followers',
        metric: VendorBadgeMetric.FOLLOWERS,
        threshold: 10,
        icon: 'users',
        color: 'emerald',
      },
      {
        key: 'followers-50',
        name: 'Community Choice',
        description: 'Reached 50 followers',
        metric: VendorBadgeMetric.FOLLOWERS,
        threshold: 50,
        icon: 'sparkles',
        color: 'amber',
      },
      {
        key: 'followers-100',
        name: 'Trending Vendor',
        description: 'Reached 100 followers',
        metric: VendorBadgeMetric.FOLLOWERS,
        threshold: 100,
        icon: 'award',
        color: 'sky',
      },
      {
        key: 'followers-250',
        name: 'Local Legend',
        description: 'Reached 250 followers',
        metric: VendorBadgeMetric.FOLLOWERS,
        threshold: 250,
        icon: 'star',
        color: 'indigo',
      },
      {
        key: 'followers-500',
        name: 'Top Pick',
        description: 'Reached 500 followers',
        metric: VendorBadgeMetric.FOLLOWERS,
        threshold: 500,
        icon: 'trophy',
        color: 'rose',
      },
      {
        key: 'followers-1000',
        name: 'Elite Vendor',
        description: 'Reached 1000 followers',
        metric: VendorBadgeMetric.FOLLOWERS,
        threshold: 1000,
        icon: 'crown',
        color: 'purple',
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Vendor badge definitions created')

  // ============================================================================
  // STEP 6: USERS
  // ============================================================================
  console.log('👤 Creating users...')

  const hashedPassword = await bcrypt.hash('Password123!', 10)

  // Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@omnicassion.com',
      passwordHash: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      hasCompletedOnboarding: true,
    },
  })
  await prisma.userRoleAssignment.create({ data: { userId: adminUser.id, roleId: adminRole.id } })

  // General Admin
  const generalAdmin = await prisma.user.create({
    data: {
      email: 'alex.admin@omnicassion.com',
      passwordHash: hashedPassword,
      firstName: 'Alex',
      lastName: 'Thompson',
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      hasCompletedOnboarding: true,
    },
  })
  await prisma.userRoleAssignment.create({ data: { userId: generalAdmin.id, roleId: generalAdminRole.id } })

  // Ops Admin
  const opsAdmin = await prisma.user.create({
    data: {
      email: 'ops.admin@omnicassion.com',
      passwordHash: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      hasCompletedOnboarding: true,
    },
  })
  await prisma.userRoleAssignment.create({ data: { userId: opsAdmin.id, roleId: operationalAdminRole.id } })

  // Ops Manager
  const opsManager = await prisma.user.create({
    data: {
      email: 'ops.manager@omnicassion.com',
      passwordHash: hashedPassword,
      firstName: 'Michael',
      lastName: 'Chen',
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      hasCompletedOnboarding: true,
    },
  })
  await prisma.userRoleAssignment.create({ data: { userId: opsManager.id, roleId: operationalManagerRole.id } })

  // Ops Assistant
  const opsAssistant = await prisma.user.create({
    data: {
      email: 'ops.assistant@omnicassion.com',
      passwordHash: hashedPassword,
      firstName: 'Emily',
      lastName: 'Davis',
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      hasCompletedOnboarding: true,
    },
  })
  await prisma.userRoleAssignment.create({ data: { userId: opsAssistant.id, roleId: operationalAssistantRole.id } })

  // Marketing Admin
  const marketingAdmin = await prisma.user.create({
    data: {
      email: 'marketing@omnicassion.com',
      passwordHash: hashedPassword,
      firstName: 'Jessica',
      lastName: 'Williams',
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      hasCompletedOnboarding: true,
    },
  })
  await prisma.userRoleAssignment.create({ data: { userId: marketingAdmin.id, roleId: marketingRole.id } })

  // Vendor Users (1000 vendors for performance testing)
  console.log('Creating 1000 vendor users...')
  
  const vendorUsers: any[] = []
  const batchSize = 100
  
  for (let batch = 0; batch < 10; batch++) {
    const batchUsers: any[] = []
    for (let i = 0; i < batchSize; i++) {
      const vendorNum = batch * batchSize + i + 1
      batchUsers.push(
        prisma.user.create({
          data: {
            email: `vendor${vendorNum}@example.com`,
            passwordHash: hashedPassword,
            firstName: `Vendor${vendorNum}`,
            lastName: `Business`,
            status: UserStatus.ACTIVE,
            emailVerified: true,
            emailVerifiedAt: new Date(),
            hasCompletedOnboarding: true,
          },
        })
      )
    }
    const createdUsers = await Promise.all(batchUsers)
    vendorUsers.push(...createdUsers)
    console.log(`  ✓ Created batch ${batch + 1}/10 (${(batch + 1) * 100} vendors)`)
  }

  for (const vendorUser of vendorUsers) {
    await prisma.userRoleAssignment.create({ data: { userId: vendorUser.id, roleId: vendorRole.id } })
  }

  // Planner Users (5 planners)
  const plannerUsers = await Promise.all([
    prisma.user.create({ data: { email: 'emma.planner@example.com', passwordHash: hashedPassword, firstName: 'Emma', lastName: 'Johnson', phone: '+1-555-0101', status: UserStatus.ACTIVE, emailVerified: true, emailVerifiedAt: new Date(), hasCompletedOnboarding: true } }),
    prisma.user.create({ data: { email: 'olivia.wedding@example.com', passwordHash: hashedPassword, firstName: 'Olivia', lastName: 'Davis', phone: '+1-555-0102', status: UserStatus.ACTIVE, emailVerified: true, emailVerifiedAt: new Date(), hasCompletedOnboarding: true } }),
    prisma.user.create({ data: { email: 'sophia.events@example.com', passwordHash: hashedPassword, firstName: 'Sophia', lastName: 'Miller', phone: '+1-555-0103', status: UserStatus.ACTIVE, emailVerified: true, emailVerifiedAt: new Date(), hasCompletedOnboarding: true } }),
    prisma.user.create({ data: { email: 'ava.planning@example.com', passwordHash: hashedPassword, firstName: 'Ava', lastName: 'Wilson', phone: '+1-555-0104', status: UserStatus.ACTIVE, emailVerified: true, emailVerifiedAt: new Date(), hasCompletedOnboarding: true } }),
    prisma.user.create({ data: { email: 'isabella.bride@example.com', passwordHash: hashedPassword, firstName: 'Isabella', lastName: 'Moore', phone: '+1-555-0105', status: UserStatus.ACTIVE, emailVerified: true, emailVerifiedAt: new Date(), hasCompletedOnboarding: false } }),
  ])

  for (const plannerUser of plannerUsers) {
    await prisma.userRoleAssignment.create({ data: { userId: plannerUser.id, roleId: plannerRole.id } })
  }

  console.log('✅ Users created')

  // ============================================================================
  // STEP 7: VENDOR PROFILES
  // ============================================================================
  console.log('🏪 Creating vendor profiles...')

  // Sample profile photo URLs for vendors
  const vendorProfilePhotos = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1571266028243-d220c6a66db9?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1532074205216-d0e1f4b87368?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1546961329-78bef0414d7c?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1557296387-5358ad7997bb?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1522556189639-b150ed9c4330?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1592124549776-a7f0cc973b24?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1541271696563-3be2f555fc4e?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1628157588553-5eeea00af15c?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1558222218-b7b54eede3f3?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1556157382-97eda2f9e2bf?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1598966739654-5e9e7cb71f32?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1592433024711-6be5a44a6e7c?w=400&h=400&fit=crop',
  ]

  const businessNames = [
    'Elite', 'Creative', 'Premium', 'Elegant', 'Modern', 'Classic', 'Luxury', 'Grand',
    'Perfect', 'Dream', 'Royal', 'Divine', 'Stunning', 'Beautiful', 'Magical', 'Enchanted',
  ]

  const businessTypes = [
    'Photography', 'Studio', 'Services', 'Events', 'Solutions', 'Creations', 'Productions',
    'Group', 'Co.', 'Collective', 'Design', 'Artistry', 'Ventures', 'Enterprises',
  ]

  const categories = [photography, videography, catering, venues, entertainment, florist, makeup, decor]
  
  // Create additional addresses for all vendors
  console.log('  Creating 1000 addresses for vendors...')
  const additionalAddresses: any[] = []
  const cities = [losAngeles, sanFrancisco, newYorkCity, miami, austin, brooklyn, sanDiego, houston]
  for (let i = 0; i < 1000; i++) {
    const cityIndex = i % cities.length
    additionalAddresses.push({
      addressLine1: `${100 + i} ${['Main', 'Oak', 'Elm', 'Maple', 'Pine', 'Cedar'][i % 6]} Street`,
      cityId: cities[cityIndex].id,
      postalCode: `${10000 + i}`,
      latitude: 34.0 + (Math.random() * 10),
      longitude: -118.0 + (Math.random() * 10),
    })
  }
  
  await prisma.address.createMany({ data: additionalAddresses })
  const allVendorAddresses = await prisma.address.findMany({ orderBy: { id: 'desc' }, take: 1000 })

  const vendorProfiles: any[] = []
  
  console.log('  Creating 1000 vendor profiles in batches...')
  for (let batch = 0; batch < 10; batch++) {
    const batchProfiles: any[] = []
    for (let i = 0; i < 100; i++) {
      const vendorNum = batch * 100 + i
      const category = categories[vendorNum % categories.length]
      const businessName = `${businessNames[vendorNum % businessNames.length]} ${businessTypes[vendorNum % businessTypes.length]} ${vendorNum + 1}`
      const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      
      batchProfiles.push(
        prisma.vendorProfile.create({
          data: {
            userId: vendorUsers[vendorNum].id,
            businessName,
            slug,
            categoryId: category.id,
            description: `Professional ${category.name.toLowerCase()} services with ${5 + (vendorNum % 15)}+ years of experience. Specializing in weddings, events, and special occasions.`,
            tagline: `Making Your ${category.name} Dreams Come True`,
            profilePhotoUrl: vendorProfilePhotos[vendorNum % vendorProfilePhotos.length],
            addressId: allVendorAddresses[vendorNum].id,
            serviceRadius: [25, 50, 75, 100, 150][vendorNum % 5],
            contactEmail: `contact${vendorNum + 1}@example.com`,
            contactPhone: `+1-555-${1000 + vendorNum}`,
            website: `https://${slug}.com`,
            status: vendorNum % 10 === 0 ? VendorStatus.PENDING_REVIEW : VendorStatus.ACTIVE,
            verifiedAt: vendorNum % 10 !== 0 ? new Date() : undefined,
            featuredUntil: vendorNum % 20 === 0 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
            viewCount: Math.floor(Math.random() * 5000),
            leadCount: Math.floor(Math.random() * 100),
          },
        })
      )
    }
    const createdProfiles = await Promise.all(batchProfiles)
    vendorProfiles.push(...createdProfiles)
    console.log(`  ✓ Created profile batch ${batch + 1}/10 (${(batch + 1) * 100} profiles)`)
  }

  console.log('✅ Vendor profiles created')

  // ============================================================================
  // STEP 8: BUSINESS HOURS
  // ============================================================================
  console.log('🕐 Creating business hours for 1000 vendors...')

  const allBusinessHours: any[] = []
  for (const vendorProfile of vendorProfiles) {
    for (let day = 0; day < 7; day++) {
      allBusinessHours.push({
        vendorProfileId: vendorProfile.id,
        dayOfWeek: day,
        openTime: day === 0 ? '10:00' : '09:00',
        closeTime: day === 0 ? '16:00' : '18:00',
        isClosed: false,
      })
    }
  }
  
  // Create in batches
  for (let i = 0; i < allBusinessHours.length; i += 1000) {
    await prisma.businessHour.createMany({
      data: allBusinessHours.slice(i, i + 1000)
    })
    console.log(`  ✓ Created business hours batch ${Math.floor(i / 1000) + 1}/${Math.ceil(allBusinessHours.length / 1000)}`)
  }

  console.log('✅ Business hours created')

  // ============================================================================
  // STEP 9: VENDOR TAGS
  // ============================================================================
  console.log('🏷️  Assigning tags to 1000 vendors...')

  const allVendorTags: any[] = []
  for (let i = 0; i < vendorProfiles.length; i++) {
    const vendor = vendorProfiles[i]
    // Assign 2-4 random tags per vendor
    const numTags = 2 + (i % 3)
    const startTagIndex = (i * 3) % tags.length
    for (let t = 0; t < numTags; t++) {
      allVendorTags.push({
        vendorProfileId: vendor.id,
        tagId: tags[(startTagIndex + t) % tags.length].id,
      })
    }
  }
  
  // Create in batches
  for (let i = 0; i < allVendorTags.length; i += 1000) {
    await prisma.vendorTag.createMany({
      data: allVendorTags.slice(i, i + 1000)
    })
    console.log(`  ✓ Created vendor tag batch ${Math.floor(i / 1000) + 1}/${Math.ceil(allVendorTags.length / 1000)}`)
  }

  console.log('✅ Vendor tags assigned')

  // ============================================================================
  // STEP 10: SERVICE AREAS
  // ============================================================================
  console.log('📍 Creating service areas for 1000 vendors...')

  const allServiceAreas: any[] = []
  for (let i = 0; i < vendorProfiles.length; i++) {
    const vendor = vendorProfiles[i]
    // Each vendor serves 2-4 cities
    const numCities = 2 + (i % 3)
    for (let c = 0; c < numCities; c++) {
      allServiceAreas.push({
        vendorProfileId: vendor.id,
        cityId: cities[(i + c) % cities.length].id,
        radiusMiles: [25, 50, 75, 100][(i + c) % 4],
        additionalFee: i % 3 === 0 ? Math.floor((i % 5) * 100) + 100 : null,
      })
    }
  }
  
  // Create in batches
  for (let i = 0; i < allServiceAreas.length; i += 1000) {
    await prisma.serviceArea.createMany({
      data: allServiceAreas.slice(i, i + 1000)
    })
    console.log(`  ✓ Created service area batch ${Math.floor(i / 1000) + 1}/${Math.ceil(allServiceAreas.length / 1000)}`)
  }

  console.log('✅ Service areas created')

  // ============================================================================
  // STEP 11: PORTFOLIOS & MEDIA (3000+ portfolios, 15000+ media items)
  // ============================================================================
  console.log('📸 Creating portfolios and media items for 1000 vendors...')

  const sampleImages = [
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800',
    'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800',
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800',
    'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=800',
    'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800',
    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
    'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800',
    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800',
    'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800',
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
    'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800',
    'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=800',
    'https://images.unsplash.com/photo-1510076857177-7470076d4098?w=800',
    'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800',
    'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    'https://images.unsplash.com/photo-1481115458193-d5a7a2d0f5b7?w=800',
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800',
    'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800',
    'https://images.unsplash.com/photo-1543599538-a6c4e9cf821e?w=800',
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800',
    'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800',
    'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=800',
    'https://images.unsplash.com/photo-1505236274241-e72f5da09f5f?w=800',
    'https://images.unsplash.com/photo-1474073705359-5da2a8270c64?w=800',
    'https://images.unsplash.com/photo-1524824267900-2fa9cbf7a506?w=800',
    'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=800',
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
    'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=800',
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
    'https://images.unsplash.com/photo-1523301343968-6a6ebf63c672?w=800',
    'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=800',
    'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=800',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
    'https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=800',
    'https://images.unsplash.com/photo-1484399172022-72a90b12e3c1?w=800',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
    'https://images.unsplash.com/photo-1445112098124-3e76dd67983c?w=800',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    'https://images.unsplash.com/photo-1508138221679-760a23a2285b?w=800',
    'https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800',
    'https://images.unsplash.com/photo-1469920783271-4ee08a7c1a11?w=800',
    'https://images.unsplash.com/photo-1483086431886-3590a88317fe?w=800',
    'https://images.unsplash.com/photo-1517315003714-a071486bd9ea?w=800',
    'https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=800',
    'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800',
    'https://images.unsplash.com/photo-1520650467-0b5bdb16d671?w=800',
    'https://images.unsplash.com/photo-1487260211189-670c54da558d?w=800',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
  ]

  console.log('  Creating portfolios in batches...')
  const allPortfolios: any[] = []
  
  for (let batch = 0; batch < 10; batch++) {
    const batchPortfolios: any[] = []
    for (let i = 0; i < 100; i++) {
      const vendorIdx = batch * 100 + i
      const vendor = vendorProfiles[vendorIdx]
      
      // Create 3 portfolios per vendor
      for (let p = 0; p < 3; p++) {
        const portfolioTitles = ['Featured Work', 'Recent Projects', 'Client Favorites']
        batchPortfolios.push(
          prisma.portfolio.create({
            data: {
              vendorProfileId: vendor.id,
              title: portfolioTitles[p],
              description: p === 0 ? 'Our best and most popular work' : p === 1 ? 'Recent projects from this year' : 'Top-rated by our clients',
              sortOrder: p,
              isFeatured: p === 0,
            },
          })
        )
      }
    }
    const createdPortfolios = await Promise.all(batchPortfolios)
    allPortfolios.push(...createdPortfolios)
    console.log(`  ✓ Created portfolio batch ${batch + 1}/10 (${(batch + 1) * 300} portfolios)`)
  }

  console.log('  Creating media items in batches...')
  const allMediaItems: any[] = []
  
  for (let i = 0; i < allPortfolios.length; i++) {
    const portfolio = allPortfolios[i]
    // Each portfolio gets 5 media items
    for (let m = 0; m < 5; m++) {
      const imageUrl = sampleImages[(i + m) % sampleImages.length]
      allMediaItems.push({
        portfolioId: portfolio.id,
        type: CatalogMediaType.IMAGE,
        url: imageUrl,
        thumbnailUrl: imageUrl.replace('w=800', 'w=400'),
        cdnUrl: imageUrl,
        altText: `Portfolio media ${m + 1}`,
        width: 800,
        height: 600,
        size: Math.floor((i + m) % 500000) + 100000,
        mimeType: 'image/jpeg',
        sortOrder: m,
        isApproved: true,
      })
    }
  }
  
  // Create media items in batches
  for (let i = 0; i < allMediaItems.length; i += 1000) {
    await prisma.mediaItem.createMany({
      data: allMediaItems.slice(i, i + 1000)
    })
    console.log(`  ✓ Created media batch ${Math.floor(i / 1000) + 1}/${Math.ceil(allMediaItems.length / 1000)} (${Math.min(i + 1000, allMediaItems.length)} items)`)
  }

  console.log('✅ Portfolios and media items created')

  // ============================================================================
  // STEP 12: SERVICES & PRICING TIERS
  // ============================================================================
  console.log('💰 Creating services and pricing tiers for 1000 vendors...')

  console.log('  Creating services in batches...')
  const allServices: any[] = []
  
  for (let batch = 0; batch < 10; batch++) {
    const batchServices: any[] = []
    for (let i = 0; i < 100; i++) {
      const vendorIdx = batch * 100 + i
      const vendor = vendorProfiles[vendorIdx]
      const relevantServiceTypes = serviceTypes.filter(st => st.categoryId === vendor.categoryId)

      for (let s = 0; s < Math.min(3, relevantServiceTypes.length); s++) {
        batchServices.push(
          prisma.service.create({
            data: {
              vendorProfileId: vendor.id,
              serviceTypeId: relevantServiceTypes[s]?.id,
              name: relevantServiceTypes[s]?.name || `Service ${s + 1}`,
              description: `Professional ${relevantServiceTypes[s]?.name || 'service'} package`,
              pricingType: PricingType.TIERED,
              currency: 'USD',
              startingPrice: 500 + (s * 200),
              maxPrice: 5000 + (s * 1000),
              isActive: true,
              sortOrder: s,
            },
          })
        )
      }
    }
    const createdServices = await Promise.all(batchServices)
    allServices.push(...createdServices)
    console.log(`  ✓ Created service batch ${batch + 1}/10 (${(batch + 1) * 300} services)`)
  }

  console.log('  Creating pricing tiers in batches...')
  const allPricingTiers: any[] = []
  
  for (const service of allServices) {
    const basePrice = service.startingPrice
    allPricingTiers.push(
      { serviceId: service.id, name: 'Basic', description: 'Essential package', price: basePrice, unit: 'per event', sortOrder: 0 },
      { serviceId: service.id, name: 'Standard', description: 'Most popular option', price: basePrice + 1000, unit: 'per event', sortOrder: 1 },
      { serviceId: service.id, name: 'Premium', description: 'Full coverage package', price: basePrice + 2500, unit: 'per event', sortOrder: 2 }
    )
  }
  
  // Create pricing tiers in batches
  for (let i = 0; i < allPricingTiers.length; i += 1000) {
    await prisma.pricingTier.createMany({
      data: allPricingTiers.slice(i, i + 1000)
    })
    console.log(`  ✓ Created pricing tier batch ${Math.floor(i / 1000) + 1}/${Math.ceil(allPricingTiers.length / 1000)}`)
  }

  console.log('✅ Services and pricing tiers created')

  // ============================================================================
  // STEP 13: EVENT TYPES & CHECKLIST TEMPLATES
  // ============================================================================
  console.log('📋 Creating event types and checklist templates...')

  const eventTypes = await Promise.all([
    prisma.eventType.create({ data: { name: 'Wedding', slug: 'wedding', description: 'Wedding celebration', icon: 'heart', sortOrder: 1 } }),
    prisma.eventType.create({ data: { name: 'Engagement', slug: 'engagement', description: 'Engagement party', icon: 'ring', sortOrder: 2 } }),
    prisma.eventType.create({ data: { name: 'Birthday', slug: 'birthday', description: 'Birthday celebration', icon: 'cake', sortOrder: 3 } }),
    prisma.eventType.create({ data: { name: 'Corporate Event', slug: 'corporate', description: 'Corporate events and gatherings', icon: 'briefcase', sortOrder: 4 } }),
    prisma.eventType.create({ data: { name: 'Baby Shower', slug: 'baby-shower', description: 'Baby shower celebration', icon: 'baby', sortOrder: 5 } }),
    prisma.eventType.create({ data: { name: 'Anniversary', slug: 'anniversary', description: 'Anniversary celebration', icon: 'champagne', sortOrder: 6 } }),
  ])

  // Checklist templates for wedding
  await prisma.checklistTemplate.create({
    data: {
      eventTypeId: eventTypes[0].id,
      name: '12 Month Wedding Checklist',
      description: 'Complete wedding planning checklist for a 12-month timeline',
      sortOrder: 0,
      items: JSON.stringify([
        { category: 'Planning', title: 'Set wedding date', monthsBefore: 12 },
        { category: 'Planning', title: 'Create budget', monthsBefore: 12 },
        { category: 'Venue', title: 'Book venue', monthsBefore: 10 },
        { category: 'Vendors', title: 'Book photographer', monthsBefore: 9 },
        { category: 'Vendors', title: 'Book caterer', monthsBefore: 8 },
        { category: 'Attire', title: 'Choose wedding dress', monthsBefore: 8 },
        { category: 'Vendors', title: 'Book florist', monthsBefore: 6 },
        { category: 'Guests', title: 'Send save the dates', monthsBefore: 6 },
        { category: 'Vendors', title: 'Book DJ/Band', monthsBefore: 5 },
        { category: 'Guests', title: 'Send invitations', monthsBefore: 3 },
        { category: 'Final', title: 'Final dress fitting', monthsBefore: 1 },
        { category: 'Final', title: 'Confirm all vendors', monthsBefore: 1 },
      ]),
    },
  })

  console.log('✅ Event types and checklist templates created')

  // ============================================================================
  // STEP 14: EVENTS WITH FULL PLANNING DATA
  // ============================================================================
  console.log('🎉 Creating events...')

  const events = await Promise.all([
    prisma.event.create({
      data: {
        userId: plannerUsers[0].id,
        eventTypeId: eventTypes[0].id,
        name: 'Emma & James Wedding',
        date: new Date('2025-06-15'),
        endDate: new Date('2025-06-15'),
        addressId: addresses[3].id,
        venueName: 'Grand Ballroom & Gardens',
        guestCount: 150,
        description: 'Our dream summer wedding',
        status: EventStatus.PLANNING,
      },
    }),
    prisma.event.create({
      data: {
        userId: plannerUsers[1].id,
        eventTypeId: eventTypes[0].id,
        name: 'Olivia & Daniel Wedding',
        date: new Date('2025-09-20'),
        endDate: new Date('2025-09-21'),
        addressId: addresses[0].id,
        venueName: 'Sunset Beach Resort',
        guestCount: 200,
        description: 'A beautiful fall wedding celebration',
        status: EventStatus.PLANNING,
      },
    }),
    prisma.event.create({
      data: {
        userId: plannerUsers[2].id,
        eventTypeId: eventTypes[2].id,
        name: 'Sophia\'s 30th Birthday',
        date: new Date('2025-04-10'),
        addressId: addresses[2].id,
        venueName: 'Sky Lounge NYC',
        guestCount: 75,
        description: 'Milestone birthday celebration',
        status: EventStatus.CONFIRMED,
      },
    }),
    prisma.event.create({
      data: {
        userId: plannerUsers[3].id,
        eventTypeId: eventTypes[1].id,
        name: 'Ava & Michael Engagement',
        date: new Date('2025-03-05'),
        addressId: addresses[4].id,
        venueName: 'Austin Garden Club',
        guestCount: 50,
        description: 'Intimate engagement party',
        status: EventStatus.PLANNING,
      },
    }),
  ])

  // Checklists
  for (const event of events) {
    const checklist = await prisma.checklist.create({
      data: { eventId: event.id, name: 'Main Planning Checklist', sortOrder: 0 },
    })

    await prisma.checklistItem.createMany({
      data: [
        { checklistId: checklist.id, title: 'Book venue', dueDate: new Date('2025-01-15'), isCompleted: true, completedAt: new Date('2025-01-10'), sortOrder: 0 },
        { checklistId: checklist.id, title: 'Choose vendors', dueDate: new Date('2025-02-01'), isCompleted: true, completedAt: new Date('2025-01-28'), sortOrder: 1 },
        { checklistId: checklist.id, title: 'Send invitations', dueDate: new Date('2025-03-01'), isCompleted: false, sortOrder: 2 },
        { checklistId: checklist.id, title: 'Final menu selection', dueDate: new Date('2025-04-01'), isCompleted: false, sortOrder: 3 },
        { checklistId: checklist.id, title: 'Final walkthrough', dueDate: new Date('2025-05-01'), isCompleted: false, sortOrder: 4 },
      ],
    })
  }

  // Guestlists
  for (const event of events) {
    const guestlist = await prisma.guestlist.create({ data: { eventId: event.id } })

    const guestNames = [
      ['Alice', 'Johnson'], ['Bob', 'Williams'], ['Carol', 'Brown'], ['David', 'Jones'],
      ['Eve', 'Garcia'], ['Frank', 'Miller'], ['Grace', 'Davis'], ['Henry', 'Martinez'],
    ]

    for (let i = 0; i < guestNames.length; i++) {
      await prisma.guest.create({
        data: {
          guestlistId: guestlist.id,
          firstName: guestNames[i][0],
          lastName: guestNames[i][1],
          email: `${guestNames[i][0].toLowerCase()}@example.com`,
          phone: `+1-555-020${i}`,
          rsvpStatus: i < 4 ? RSVPStatus.ATTENDING : i < 6 ? RSVPStatus.PENDING : RSVPStatus.MAYBE,
          plusOne: i % 3 === 0 ? 1 : 0,
          tableNumber: Math.floor(i / 4) + 1,
          dietaryReq: i % 4 === 0 ? 'Vegetarian' : null,
        },
      })
    }
  }

  // Budgets
  for (const event of events) {
    const budget = await prisma.budget.create({
      data: { eventId: event.id, totalBudget: 25000 + Math.floor(Math.random() * 25000) },
    })

    await prisma.budgetItem.createMany({
      data: [
        { budgetId: budget.id, category: 'Venue', name: 'Venue rental', estimatedCost: 8000, actualCost: 7500, isPaid: true },
        { budgetId: budget.id, category: 'Catering', name: 'Food & beverages', estimatedCost: 6000, actualCost: null, isPaid: false },
        { budgetId: budget.id, category: 'Photography', name: 'Photography package', estimatedCost: 3500, actualCost: 3500, isPaid: true },
        { budgetId: budget.id, category: 'Flowers', name: 'Floral arrangements', estimatedCost: 2000, actualCost: null, isPaid: false },
        { budgetId: budget.id, category: 'Music', name: 'DJ services', estimatedCost: 1500, actualCost: null, isPaid: false },
        { budgetId: budget.id, category: 'Decor', name: 'Decorations', estimatedCost: 2500, actualCost: null, isPaid: false },
      ],
    })
  }

  // Timelines
  for (const event of events.slice(0, 2)) {
    await prisma.timeline.create({
      data: {
        eventId: event.id,
        name: 'Wedding Day Timeline',
        date: event.date!,
        items: JSON.stringify([
          { time: '10:00 AM', title: 'Hair and Makeup', description: 'Bridal party preparation begins' },
          { time: '2:00 PM', title: 'First Look', description: 'Private moment between bride and groom' },
          { time: '3:00 PM', title: 'Photo Session', description: 'Wedding party photos' },
          { time: '4:00 PM', title: 'Guest Arrival', description: 'Guests begin arriving' },
          { time: '4:30 PM', title: 'Ceremony', description: 'Wedding ceremony begins' },
          { time: '5:30 PM', title: 'Cocktail Hour', description: 'Cocktails and appetizers' },
          { time: '7:00 PM', title: 'Reception', description: 'Dinner and dancing' },
          { time: '11:00 PM', title: 'Send Off', description: 'Grand exit' },
        ]),
      },
    })
  }

  // Event Vendors
  for (const event of events.slice(0, 2)) {
    await prisma.eventVendor.createMany({
      data: [
        { eventId: event.id, vendorProfileId: vendorProfiles[0].id, status: EventVendorStatus.BOOKED, contractAmount: 3500, depositPaid: 1000 },
        { eventId: event.id, vendorProfileId: vendorProfiles[2].id, status: EventVendorStatus.BOOKED, contractAmount: 6000, depositPaid: 2000 },
        { eventId: event.id, vendorProfileId: vendorProfiles[4].id, status: EventVendorStatus.SHORTLISTED },
      ],
    })
  }

  // Event Memories
  for (const event of events.slice(0, 2)) {
    await prisma.eventMemory.create({
      data: {
        eventId: event.id,
        qrCode: `EVENT-${event.id.slice(0, 8)}`,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=EVENT-${event.id.slice(0, 8)}`,
        isActive: true,
        allowUploads: true,
        requireApproval: false,
      },
    })
  }

  console.log('✅ Events with planning data created')

  // ============================================================================
  // STEP 15: LEADS & MESSAGES
  // ============================================================================
  console.log('📨 Creating leads and messages...')

  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        vendorProfileId: vendorProfiles[0].id,
        plannerId: plannerUsers[0].id,
        eventId: events[0].id,
        status: LeadStatus.QUALIFIED,
        source: LeadSource.INQUIRY,
        eventDate: events[0].date,
        eventType: 'Wedding',
        guestCount: 150,
        budget: 4000,
        initialMessage: 'Hi, I\'m planning my wedding for June 2025 and would love to discuss your photography packages.',
        respondedAt: new Date(),
      },
    }),
    prisma.lead.create({
      data: {
        vendorProfileId: vendorProfiles[2].id,
        plannerId: plannerUsers[1].id,
        eventId: events[1].id,
        status: LeadStatus.PROPOSAL_SENT,
        source: LeadSource.INQUIRY,
        eventDate: events[1].date,
        eventType: 'Wedding',
        guestCount: 200,
        budget: 8000,
        initialMessage: 'Looking for catering services for our fall wedding. Can you provide a custom menu?',
        respondedAt: new Date(),
      },
    }),
    prisma.lead.create({
      data: {
        vendorProfileId: vendorProfiles[3].id,
        plannerId: plannerUsers[2].id,
        status: LeadStatus.NEW,
        source: LeadSource.DIRECT_MESSAGE,
        eventDate: new Date('2025-04-10'),
        eventType: 'Birthday',
        guestCount: 75,
        budget: 5000,
        initialMessage: 'I\'d like to inquire about booking your venue for a birthday party.',
      },
    }),
  ])

  // Messages for leads
  for (const lead of leads.slice(0, 2)) {
    await prisma.message.createMany({
      data: [
        { leadId: lead.id, senderId: lead.plannerId, content: lead.initialMessage!, createdAt: new Date(Date.now() - 86400000 * 3) },
        { leadId: lead.id, senderId: vendorUsers[0].id, content: 'Thank you for your interest! I would love to discuss your wedding photography needs.', readAt: new Date(), createdAt: new Date(Date.now() - 86400000 * 2) },
        { leadId: lead.id, senderId: lead.plannerId, content: 'That sounds great! When are you available for a call?', createdAt: new Date(Date.now() - 86400000) },
      ],
    })
  }

  console.log('✅ Leads and messages created')

  // ============================================================================
  // STEP 16: WISHLISTS
  // ============================================================================
  console.log('❤️  Creating wishlists...')

  for (const planner of plannerUsers.slice(0, 3)) {
    const wishlist = await prisma.wishlist.create({
      data: {
        userId: planner.id,
        name: 'My Favorites',
        description: 'Vendors I\'m considering',
        isDefault: true,
      },
    })

    const vendorsToAdd = vendorProfiles.slice(0, Math.floor(Math.random() * 4) + 2)
    for (const vendor of vendorsToAdd) {
      await prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          vendorProfileId: vendor.id,
          notes: Math.random() > 0.5 ? 'Great reviews!' : null,
        },
      })
    }
  }

  console.log('✅ Wishlists created')

  // ============================================================================
  // STEP 17: VIBE QUIZ IMAGES
  // ============================================================================
  console.log('🎨 Creating vibe quiz images...')

  const vibeCategories = ['Decor', 'Venue', 'Flowers', 'Attire', 'Table Setting', 'Invitation']
  const vibeStyles = ['Royal', 'Boho', 'Modern', 'Rustic', 'Classic', 'Minimalist', 'Romantic', 'Tropical']

  const vibeImages = [
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600',
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600',
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600',
    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600',
    'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=600',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=600',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600',
    'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=600',
    'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600',
  ]

  for (let i = 0; i < 20; i++) {
    const category = vibeCategories[i % vibeCategories.length]
    const style = vibeStyles[i % vibeStyles.length]
    const imageUrl = vibeImages[i % vibeImages.length]

    await prisma.vibeQuizImage.create({
      data: {
        url: imageUrl,
        thumbnailUrl: imageUrl.replace('w=600', 'w=300'),
        category,
        style,
        tags: [style.toLowerCase(), category.toLowerCase(), 'wedding'],
        isActive: true,
        sortOrder: i,
      },
    })
  }

  // Create a vibe quiz result for one planner
  const vibeQuizImages = await prisma.vibeQuizImage.findMany({ take: 6 })
  const vibeResult = await prisma.vibeQuizResult.create({
    data: {
      userId: plannerUsers[0].id,
      topStyles: ['Modern', 'Minimalist', 'Elegant'],
      topColors: ['White', 'Gold', 'Blush'],
      topCategories: ['Decor', 'Flowers'],
    },
  })

  for (const image of vibeQuizImages) {
    await prisma.vibeQuizSelection.create({
      data: { resultId: vibeResult.id, imageId: image.id },
    })
  }

  console.log('✅ Vibe quiz images created')

  // ============================================================================
  // STEP 18: WHATSAPP TEMPLATES
  // ============================================================================
  console.log('📱 Creating WhatsApp templates...')

  await prisma.whatsAppTemplate.createMany({
    data: [
      { name: 'Wedding Invitation', type: WhatsAppMessageType.INVITE, content: 'Dear {guestName}, You are cordially invited to {coupleName}\'s wedding on {date} at {venue}. RSVP: {rsvpLink}', variables: ['guestName', 'coupleName', 'date', 'venue', 'rsvpLink'], isActive: true },
      { name: 'RSVP Reminder', type: WhatsAppMessageType.REMINDER, content: 'Hi {guestName}, This is a friendly reminder to RSVP for {coupleName}\'s wedding. Please respond by {deadline}: {rsvpLink}', variables: ['guestName', 'coupleName', 'deadline', 'rsvpLink'], isActive: true },
      { name: 'Thank You', type: WhatsAppMessageType.THANK_YOU, content: 'Dear {guestName}, Thank you for being part of our special day! We are so grateful for your presence and blessings. With love, {coupleName}', variables: ['guestName', 'coupleName'], isActive: true },
    ],
  })

  console.log('✅ WhatsApp templates created')

  // ============================================================================
  // STEP 19: KYC DATA
  // ============================================================================
  console.log('📄 Creating KYC data...')

  for (const vendorProfile of vendorProfiles.slice(0, 4)) {
    const kyc = await prisma.vendorKYC.create({
      data: {
        vendorProfileId: vendorProfile.id,
        legalName: vendorProfile.businessName,
        businessType: 'LLC',
        taxId: `EIN-${Math.floor(Math.random() * 900000000) + 100000000}`,
        status: KYCStatus.APPROVED,
        submittedAt: new Date(Date.now() - 86400000 * 30),
        approvedAt: new Date(Date.now() - 86400000 * 25),
      },
    })

    await prisma.kYCDocument.createMany({
      data: [
        { kycId: kyc.id, type: DocumentType.BUSINESS_LICENSE, url: 'https://example.com/docs/license.pdf', status: DocumentStatus.VERIFIED },
        { kycId: kyc.id, type: DocumentType.TAX_CERTIFICATE, url: 'https://example.com/docs/tax.pdf', status: DocumentStatus.VERIFIED },
      ],
    })
  }

  console.log('✅ KYC data created')

  // ============================================================================
  // STEP 20: OPERATIONS DATA
  // ============================================================================
  console.log('⚙️  Creating operations data...')

  // Active Events
  const activeEvent1 = await prisma.activeEvent.create({
    data: {
      origin: EventOrigin.DIGITAL_LEAD,
      clientName: 'Emma & James',
      clientPhone: '+1-555-0101',
      clientEmail: 'emma.planner@example.com',
      eventDate: new Date('2025-06-15'),
      eventType: 'Wedding',
      venueName: 'Grand Ballroom & Gardens',
      totalBudget: 50000,
      totalSpend: 15000,
      opsAdminId: opsAdmin.id,
      opsManagerId: opsManager.id,
      status: ActiveEventStatus.VENDOR_SOURCING,
    },
  })

  const activeEvent2 = await prisma.activeEvent.create({
    data: {
      origin: EventOrigin.DIRECT_BOOKING,
      clientName: 'Corporate Solutions Inc',
      clientPhone: '+1-555-0200',
      clientEmail: 'events@corpsolutions.com',
      eventDate: new Date('2025-05-20'),
      eventType: 'Corporate Event',
      venueName: 'Convention Center',
      totalBudget: 75000,
      totalSpend: 25000,
      opsAdminId: opsAdmin.id,
      opsManagerId: opsManager.id,
      status: ActiveEventStatus.REQUIREMENTS_SET,
    },
  })

  // Event Notes
  await prisma.eventNote.createMany({
    data: [
      { activeEventId: activeEvent1.id, authorId: opsAdmin.id, content: 'Client has confirmed venue. Need to finalize vendor list.', isInternal: true },
      { activeEventId: activeEvent1.id, authorId: opsManager.id, content: 'Photography and catering vendors contacted.', isInternal: true },
      { activeEventId: activeEvent2.id, authorId: opsAdmin.id, content: 'VIP corporate client. Ensure premium service.', isInternal: true },
    ],
  })

  // Requirement Sheets
  const reqSheet1 = await prisma.requirementSheet.create({
    data: {
      activeEventId: activeEvent1.id,
      notes: 'Wedding event requirements - June 2025',
      createdBy: opsManager.id,
    },
  })

  await prisma.requirementItem.createMany({
    data: [
      { requirementSheetId: reqSheet1.id, category: 'Photography', description: 'Wedding photographer - full day coverage', quantity: 1, estimatedBudget: 4000, status: RequirementStatus.VENDOR_SELECTED },
      { requirementSheetId: reqSheet1.id, category: 'Catering', description: 'Full service catering for 150 guests', quantity: 1, estimatedBudget: 8000, status: RequirementStatus.SOURCING },
      { requirementSheetId: reqSheet1.id, category: 'Entertainment', description: 'DJ for reception', quantity: 1, estimatedBudget: 1500, status: RequirementStatus.PENDING },
    ],
  })

  // Operational Tasks
  await prisma.operationalTask.createMany({
    data: [
      { activeEventId: activeEvent1.id, title: 'Confirm venue booking', description: 'Verify all venue details and confirm deposit', category: 'Venue', priority: TaskPriority.HIGH, dueDate: new Date('2025-01-30'), assignedToUserId: opsAssistant.id, assignedBy: opsManager.id, status: OperationalTaskStatus.COMPLETED, completedAt: new Date() },
      { activeEventId: activeEvent1.id, title: 'Send photographer contracts', description: 'Prepare and send contracts to selected photographer', category: 'Vendor', priority: TaskPriority.NORMAL, dueDate: new Date('2025-02-15'), assignedToUserId: opsAssistant.id, assignedBy: opsManager.id, status: OperationalTaskStatus.IN_PROGRESS },
      { activeEventId: activeEvent2.id, title: 'Coordinate AV equipment', description: 'Arrange audio visual equipment for presentations', category: 'Setup', priority: TaskPriority.HIGH, dueDate: new Date('2025-05-01'), assignedToUserId: opsAssistant.id, assignedBy: opsManager.id, status: OperationalTaskStatus.PENDING },
    ],
  })

  console.log('✅ Operations data created')

  // ============================================================================
  // STEP 21: BLOG CONTENT (100 comprehensive blog posts)
  // ============================================================================
  console.log('📝 Creating comprehensive blog content...')

  // Blog Categories
  const blogCategories = await Promise.all([
    prisma.blogCategory.create({ data: { name: 'Wedding Planning', slug: 'wedding-planning', description: 'Tips and guides for planning your perfect wedding', color: '#FF69B4', sortOrder: 1, isActive: true } }),
    prisma.blogCategory.create({ data: { name: 'Vendor Spotlights', slug: 'vendor-spotlights', description: 'Featured vendors and their stories', color: '#4169E1', sortOrder: 2, isActive: true } }),
    prisma.blogCategory.create({ data: { name: 'Real Weddings', slug: 'real-weddings', description: 'Inspiring real wedding stories', color: '#FF1493', sortOrder: 3, isActive: true } }),
    prisma.blogCategory.create({ data: { name: 'Trends & Inspiration', slug: 'trends-inspiration', description: 'Latest wedding trends and ideas', color: '#9370DB', sortOrder: 4, isActive: true } }),
    prisma.blogCategory.create({ data: { name: 'DIY & Crafts', slug: 'diy-crafts', description: 'DIY projects and crafts for your wedding', color: '#32CD32', sortOrder: 5, isActive: true } }),
    prisma.blogCategory.create({ data: { name: 'Budget Tips', slug: 'budget-tips', description: 'Money-saving tips for weddings', color: '#FFD700', sortOrder: 6, isActive: true } }),
    prisma.blogCategory.create({ data: { name: 'Destinations', slug: 'destinations', description: 'Destination wedding guides', color: '#00CED1', sortOrder: 7, isActive: true } }),
    prisma.blogCategory.create({ data: { name: 'Seasonal', slug: 'seasonal', description: 'Seasonal wedding ideas', color: '#FF8C00', sortOrder: 8, isActive: true } }),
  ])

  // Blog Tags
  const blogTags = await Promise.all([
    prisma.blogTag.create({ data: { name: 'Tips', slug: 'tips' } }),
    prisma.blogTag.create({ data: { name: 'Trends', slug: 'trends' } }),
    prisma.blogTag.create({ data: { name: 'Budget', slug: 'budget' } }),
    prisma.blogTag.create({ data: { name: 'DIY', slug: 'diy' } }),
    prisma.blogTag.create({ data: { name: 'Real Weddings', slug: 'real-weddings' } }),
    prisma.blogTag.create({ data: { name: 'Inspiration', slug: 'inspiration' } }),
    prisma.blogTag.create({ data: { name: 'Photography', slug: 'photography' } }),
    prisma.blogTag.create({ data: { name: 'Decor', slug: 'decor' } }),
    prisma.blogTag.create({ data: { name: 'Flowers', slug: 'flowers' } }),
    prisma.blogTag.create({ data: { name: 'Venues', slug: 'venues' } }),
    prisma.blogTag.create({ data: { name: 'Catering', slug: 'catering' } }),
    prisma.blogTag.create({ data: { name: 'Fashion', slug: 'fashion' } }),
    prisma.blogTag.create({ data: { name: 'Destination', slug: 'destination' } }),
    prisma.blogTag.create({ data: { name: 'Seasonal', slug: 'seasonal' } }),
    prisma.blogTag.create({ data: { name: 'Checklist', slug: 'checklist' } }),
  ])

  // Comprehensive blog post data
  const blogTopics = [
    { title: 'The Ultimate Guide to Planning a Destination Wedding', category: 6, tags: [0, 12], readTime: 15 },
    { title: 'How to Choose the Perfect Wedding Venue: A Complete Guide', category: 0, tags: [0, 9], readTime: 12 },
    { title: '50 Stunning Wedding Decoration Ideas for Every Season', category: 3, tags: [1, 7, 13], readTime: 18 },
    { title: 'Budget Wedding Planning: How to Save Without Sacrificing Style', category: 5, tags: [2, 0], readTime: 14 },
    { title: 'Wedding Photography Styles Explained: Finding Your Perfect Match', category: 1, tags: [6, 5], readTime: 10 },
    { title: 'The Complete Wedding Flower Guide: Seasonal Blooms and Arrangements', category: 3, tags: [8, 13], readTime: 16 },
    { title: 'DIY Wedding Invitations: Creative Ideas and Step-by-Step Tutorials', category: 4, tags: [3, 5], readTime: 13 },
    { title: 'Choosing Your Wedding Menu: Trends, Tips, and Tastings', category: 0, tags: [10, 1], readTime: 11 },
    { title: 'Beach Wedding Planning: Everything You Need to Know', category: 6, tags: [0, 12], readTime: 15 },
    { title: 'Elegant Fall Wedding Ideas: Colors, Themes, and Inspiration', category: 7, tags: [13, 5], readTime: 12 },
    { title: 'The Modern Bride\'s Guide to Wedding Fashion Trends', category: 3, tags: [11, 1], readTime: 10 },
    { title: 'Creating the Perfect Wedding Timeline: A Month-by-Month Guide', category: 0, tags: [14, 0], readTime: 17 },
    { title: 'Intimate Wedding Ideas: Celebrating Love with Close Family and Friends', category: 0, tags: [5, 0], readTime: 11 },
    { title: 'Wedding Lighting Ideas to Create the Perfect Ambiance', category: 3, tags: [7, 5], readTime: 9 },
    { title: 'The Ultimate Wedding Vendor Checklist: Who You Need to Hire', category: 0, tags: [14, 0], readTime: 13 },
    { title: 'Rustic Wedding Decor: Bringing Country Charm to Your Big Day', category: 3, tags: [7, 5], readTime: 12 },
    { title: 'How to Plan a Multicultural Wedding: Honoring Two Traditions', category: 0, tags: [0, 5], readTime: 14 },
    { title: 'Garden Wedding Ideas: Creating a Romantic Outdoor Celebration', category: 3, tags: [9, 8], readTime: 11 },
    { title: 'Wedding Cake Trends: From Classic to Contemporary', category: 3, tags: [1, 10], readTime: 8 },
    { title: 'The Complete Guide to Wedding Hair and Makeup', category: 0, tags: [0, 11], readTime: 12 },
    { title: 'Eco-Friendly Wedding Ideas: Celebrating Sustainably', category: 0, tags: [5, 3], readTime: 13 },
    { title: 'Winter Wonderland Wedding: Creating Magic in the Snow', category: 7, tags: [13, 5], readTime: 10 },
    { title: 'Cocktail Hour Ideas: Keeping Your Guests Entertained', category: 0, tags: [0, 10], readTime: 9 },
    { title: 'Wedding Stationery Guide: From Save-the-Dates to Thank You Cards', category: 4, tags: [3, 5], readTime: 11 },
    { title: 'Outdoor Wedding Planning: Weather Contingencies and Preparations', category: 0, tags: [0, 9], readTime: 12 },
    { title: 'The Art of Wedding Videography: Capturing Your Love Story', category: 1, tags: [6, 1], readTime: 10 },
    { title: 'Spring Wedding Color Palettes: Fresh and Vibrant Ideas', category: 7, tags: [13, 5], readTime: 8 },
    { title: 'Wedding Entertainment Ideas: Beyond the DJ and Band', category: 0, tags: [0, 5], readTime: 11 },
    { title: 'Bridal Party Gifts: Thoughtful Ideas for Your Squad', category: 0, tags: [5, 2], readTime: 9 },
    { title: 'The Complete Guide to Wedding Rehearsals and Rehearsal Dinners', category: 0, tags: [0, 14], readTime: 12 },
    { title: 'Boho Wedding Ideas: Free-Spirited Style for Your Big Day', category: 3, tags: [1, 5], readTime: 13 },
    { title: 'Wedding Bar Ideas: Signature Drinks and Setup Tips', category: 0, tags: [10, 3], readTime: 10 },
    { title: 'The Modern Wedding Registry: Beyond Traditional Gifts', category: 0, tags: [0, 1], readTime: 11 },
    { title: 'Micro Wedding Planning: Small Guest List, Big Celebration', category: 0, tags: [0, 2], readTime: 12 },
    { title: 'Wedding Dance Floor Ideas: Getting Your Guests Moving', category: 0, tags: [5, 0], readTime: 9 },
    { title: 'Elegant Ballroom Wedding: Classic Sophistication and Style', category: 2, tags: [4, 9], readTime: 11 },
    { title: 'DIY Wedding Centerpieces: Beautiful Ideas on a Budget', category: 4, tags: [3, 2, 7], readTime: 14 },
    { title: 'The Complete Guide to Wedding Insurance: Protecting Your Investment', category: 0, tags: [0, 2], readTime: 10 },
    { title: 'Summer Wedding Ideas: Beating the Heat in Style', category: 7, tags: [13, 5], readTime: 11 },
    { title: 'Wedding Guest Book Alternatives: Creative Memory Keepers', category: 4, tags: [3, 5], readTime: 8 },
    { title: 'The Art of Wedding Calligraphy: Adding Personal Touches', category: 4, tags: [3, 5], readTime: 9 },
    { title: 'Barn Wedding Ideas: Rustic Charm Meets Modern Elegance', category: 3, tags: [9, 5], readTime: 12 },
    { title: 'Wedding Favors Your Guests Will Actually Love', category: 0, tags: [5, 3], readTime: 10 },
    { title: 'The Ultimate Honeymoon Planning Guide', category: 0, tags: [0, 12], readTime: 15 },
    { title: 'Industrial Wedding Venues: Urban Chic for Modern Couples', category: 3, tags: [9, 1], readTime: 10 },
    { title: 'Wedding Music Guide: Ceremony to Reception Playlists', category: 0, tags: [0, 5], readTime: 13 },
    { title: 'Vintage Wedding Ideas: Old-World Charm and Romance', category: 3, tags: [5, 7], readTime: 11 },
    { title: 'The Complete Guide to Wedding Seating Arrangements', category: 0, tags: [14, 0], readTime: 12 },
    { title: 'Glamorous Gold Wedding Theme: Luxury and Sophistication', category: 3, tags: [5, 7], readTime: 10 },
    { title: 'Wedding Food Station Ideas: Interactive Dining Experiences', category: 0, tags: [10, 5], readTime: 11 },
    { title: 'The Modern Groom\'s Guide: Fashion, Grooming, and More', category: 0, tags: [11, 0], readTime: 10 },
    { title: 'Tropical Wedding Ideas: Paradise-Inspired Celebrations', category: 6, tags: [12, 5], readTime: 12 },
    { title: 'Wedding Hashtag Ideas: Making Your Day Social Media Ready', category: 0, tags: [1, 0], readTime: 8 },
    { title: 'Classic Church Wedding: Timeless Traditions and Ceremonies', category: 2, tags: [4, 9], readTime: 11 },
    { title: 'The Complete Guide to Wedding Flowers: Bouquets to Boutonnieres', category: 0, tags: [8, 0], readTime: 16 },
    { title: 'Black Tie Wedding: Formal Elegance and Etiquette', category: 0, tags: [11, 0], readTime: 10 },
    { title: 'Rooftop Wedding Ideas: Urban Views and City Lights', category: 3, tags: [9, 5], readTime: 11 },
    { title: 'The Ultimate Bridal Shower Planning Guide', category: 0, tags: [0, 5], readTime: 13 },
    { title: 'Minimalist Wedding Ideas: Less is More', category: 3, tags: [1, 5], readTime: 10 },
    { title: 'Wedding Morning Preparation: Timeline and Tips', category: 0, tags: [14, 0], readTime: 9 },
    { title: 'Elegant White Wedding: Timeless and Sophisticated', category: 3, tags: [5, 7], readTime: 10 },
    { title: 'The Complete Guide to Wedding Toasts and Speeches', category: 0, tags: [0, 14], readTime: 11 },
    { title: 'Forest Wedding Ideas: Nature-Inspired Celebrations', category: 3, tags: [9, 5], readTime: 12 },
    { title: 'Wedding Lingerie Guide: Bridal Undergarments and Shapewear', category: 0, tags: [11, 0], readTime: 8 },
    { title: 'The Art of Wedding Table Settings: From Casual to Formal', category: 3, tags: [7, 0], readTime: 11 },
    { title: 'Nautical Wedding Theme: Seaside Romance and Style', category: 3, tags: [5, 12], readTime: 10 },
    { title: 'Wedding Emergency Kit: What Every Bride Needs', category: 0, tags: [0, 14], readTime: 9 },
    { title: 'The Complete Guide to Engagement Parties', category: 0, tags: [0, 5], readTime: 12 },
    { title: 'Art Gallery Wedding: Contemporary Elegance', category: 3, tags: [9, 1], readTime: 10 },
    { title: 'Wedding Sparkler Send-Off: Creating Magical Moments', category: 0, tags: [5, 6], readTime: 8 },
    { title: 'Blush and Gold Wedding: Romantic Color Combination', category: 3, tags: [5, 7], readTime: 10 },
    { title: 'The Complete Guide to Bachelor and Bachelorette Parties', category: 0, tags: [0, 5], readTime: 13 },
    { title: 'Vineyard Wedding Ideas: Wine Country Elegance', category: 6, tags: [9, 12], readTime: 12 },
    { title: 'Wedding Vow Writing: Creating Personal and Meaningful Words', category: 0, tags: [0, 5], readTime: 11 },
    { title: 'The Ultimate Post-Wedding Checklist', category: 0, tags: [14, 0], readTime: 10 },
    { title: 'Greenery Wedding Theme: Natural and Fresh', category: 3, tags: [8, 5], readTime: 10 },
    { title: 'Wedding Processional Order: Who Walks When', category: 0, tags: [14, 0], readTime: 9 },
    { title: 'The Complete Guide to Plus-Size Bridal Fashion', category: 0, tags: [11, 5], readTime: 12 },
    { title: 'Mountain Wedding Ideas: Alpine Romance and Adventure', category: 6, tags: [9, 12], readTime: 13 },
    { title: 'Wedding Ceremony Ideas: Personalizing Your Vows', category: 0, tags: [0, 5], readTime: 11 },
    { title: 'The Art of Wedding Gift Giving: Etiquette and Ideas', category: 0, tags: [0, 2], readTime: 10 },
    { title: 'Luxury Wedding Planning: Sparing No Expense', category: 0, tags: [5, 1], readTime: 14 },
    { title: 'Wedding Escort Card Ideas: Guiding Your Guests in Style', category: 4, tags: [3, 7], readTime: 9 },
    { title: 'The Complete Guide to Elopements: Intimate Celebrations', category: 0, tags: [0, 12], readTime: 13 },
    { title: 'Crystal and Chandelier Wedding Decor: Glamorous Lighting', category: 3, tags: [7, 5], readTime: 10 },
    { title: 'Wedding Thank You Card Etiquette: When and How to Send', category: 0, tags: [14, 0], readTime: 8 },
    { title: 'The Ultimate Outdoor Wedding Guide: Tents, Lighting, and More', category: 0, tags: [9, 0], readTime: 15 },
    { title: 'Navy and Burgundy Wedding: Rich and Romantic Colors', category: 3, tags: [5, 7], readTime: 9 },
    { title: 'Wedding Wellness: Self-Care Tips for Busy Brides', category: 0, tags: [0, 5], readTime: 11 },
    { title: 'The Complete Guide to Second Weddings: Doing It Right', category: 0, tags: [0, 5], readTime: 12 },
    { title: 'Farmhouse Wedding Ideas: Country Elegance', category: 3, tags: [9, 5], readTime: 11 },
    { title: 'Wedding Exit Ideas: Making a Grand Departure', category: 0, tags: [5, 6], readTime: 9 },
    { title: 'The Ultimate Wedding Day Emergency Timeline', category: 0, tags: [14, 0], readTime: 10 },
    { title: 'Jewel Tone Wedding: Rich Colors and Luxury', category: 3, tags: [5, 7], readTime: 10 },
    { title: 'Wedding Cake Alternatives: Trendy Dessert Ideas', category: 0, tags: [1, 10], readTime: 9 },
    { title: 'The Complete Guide to Interfaith Weddings', category: 0, tags: [0, 5], readTime: 13 },
    { title: 'Castle Wedding Ideas: Fairytale Romance', category: 6, tags: [9, 12, 5], readTime: 12 },
    { title: 'Wedding Stress Management: Staying Calm and Happy', category: 0, tags: [0, 5], readTime: 10 },
    { title: 'The Art of Wedding Photography Posing: Looking Your Best', category: 1, tags: [6, 0], readTime: 11 },
  ]

  const blogImages = [
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200',
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200',
    'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=1200',
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200',
    'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=1200',
    'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200',
    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200',
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200',
    'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200',
    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200',
    'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1200',
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200',
    'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1200',
  ]

  // TipTap HTML formatted content for blog posts
  const comprehensiveContent = `<p>Planning a wedding is one of the most exciting journeys couples embark on together. This comprehensive guide covers everything you need to know to create your dream celebration.</p>

<h2>Getting Started</h2>

<p>Before diving into the details, establish your foundation. Set a realistic budget by having honest conversations with all contributing parties. Consider venue costs, catering, photography, flowers, attire, and a <strong>10-15% buffer</strong> for unexpected expenses.</p>

<p>Your guest list size directly impacts your budget and venue options. Create a master list, then tier it by priority:</p>

<ul>
  <li>Must-invite guests (immediate family, closest friends)</li>
  <li>Would-like-to-invite guests (extended family, good friends)</li>
  <li>Nice-to-have guests (acquaintances, colleagues)</li>
</ul>

<h2>The Planning Timeline</h2>

<p>A well-structured timeline keeps your planning on track and stress-free. Here's a month-by-month breakdown:</p>

<h3>12 Months Before</h3>
<p>Set your date, finalize your budget, book your venue, and hire your photographer and videographer. These high-demand vendors book up quickly!</p>

<h3>9 Months Before</h3>
<p>Choose your wedding party, start dress shopping, book your florist, and secure entertainment. Begin thinking about your overall theme and color palette.</p>

<h3>6 Months Before</h3>
<p>Send save-the-dates, plan your ceremony, book remaining vendors, and schedule tastings. This is also the perfect time to register for gifts.</p>

<h3>3 Months Before</h3>
<p>Send formal invitations, finalize vendor details, plan your rehearsal dinner, and arrange transportation. Confirm all contracts and payments.</p>

<h3>1 Month Before</h3>
<p>Final dress fitting, confirm guest count, create seating chart, and prepare your day-of timeline. Don't forget to break in your wedding shoes!</p>

<h2>Vendor Selection Tips</h2>

<p>Research thoroughly and meet with multiple vendors. Review portfolios, read reviews, and ensure their style aligns with your vision. <em>Don't hesitate to ask for references and detailed contracts.</em></p>

<blockquote>
  <p>"Your vendors aren't just service providers—they're partners in creating your perfect day. Choose people who understand your vision and make you feel confident."</p>
</blockquote>

<p>Key vendors to prioritize:</p>

<ol>
  <li><strong>Photographer & Videographer</strong> - They capture memories that last forever</li>
  <li><strong>Caterer</strong> - Sets the tone for your reception experience</li>
  <li><strong>Florist</strong> - Brings your aesthetic vision to life</li>
  <li><strong>DJ/Band</strong> - Creates the atmosphere and keeps guests entertained</li>
  <li><strong>Planner/Coordinator</strong> - Ensures everything runs smoothly</li>
</ol>

<h2>Design and Decor</h2>

<p>Select a cohesive color palette of <mark>2-3 main colors</mark> and 1-2 accent colors. Consider lighting, season, and venue architecture when making design choices.</p>

<p>Work with your florist on seasonal blooms that fit your budget and style. In-season flowers are not only more affordable but also look fresher and more vibrant.</p>

<p>Popular wedding styles include:</p>

<ul>
  <li><strong>Classic Elegance</strong> - Timeless, sophisticated, and refined</li>
  <li><strong>Rustic Charm</strong> - Natural elements, warm textures, and cozy vibes</li>
  <li><strong>Modern Minimalism</strong> - Clean lines, simple palettes, and statement pieces</li>
  <li><strong>Bohemian Romance</strong> - Free-spirited, eclectic, and nature-inspired</li>
</ul>

<h2>Final Advice</h2>

<p>Your wedding celebrates your unique love story. While planning requires organization and patience, remember what truly matters: <strong>the commitment you're making to each other</strong>.</p>

<p>Enjoy the journey, delegate when needed, and stay flexible. With thoughtful planning and clear communication, your wedding day will be everything you've dreamed of and more.</p>

<hr>

<p><em>Ready to start planning? Browse our vendor directory and find the perfect professionals to bring your vision to life!</em></p>`

  console.log('  Creating 100 comprehensive blog posts in batches...')
  const allBlogPosts: any[] = []

  for (let batch = 0; batch < 4; batch++) {
    const batchPosts: any[] = []
    const startIndex = batch * 25
    const endIndex = Math.min(startIndex + 25, blogTopics.length)
    
    for (let postIndex = startIndex; postIndex < endIndex; postIndex++) {
      const topic = blogTopics[postIndex]
      if (!topic) {
        console.log(`  ⚠️ Skipping post ${postIndex + 1} - no topic defined`)
        continue
      }
      
      const slug = topic.title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 60) // Limit slug length
      
      batchPosts.push(
        prisma.blogPost.create({
          data: {
            title: topic.title,
            slug: `${slug}-${postIndex + 1}`,
            excerpt: `Expert guide to ${topic.title.toLowerCase().substring(0, 80)}. Practical tips and inspiration for your wedding.`,
            content: comprehensiveContent,
            metaTitle: topic.title.substring(0, 60),
            metaDescription: `${topic.title.substring(0, 100)} - Expert wedding planning guide with tips and inspiration.`,
            focusKeyword: topic.title.toLowerCase().split(':')[0].trim().substring(0, 50),
            keywords: [topic.title.split(':')[0].trim().substring(0, 40), 'wedding planning', 'wedding ideas'],
            featuredImage: blogImages[postIndex % blogImages.length],
            featuredImageAlt: topic.title.substring(0, 100),
            status: postIndex % 20 === 0 ? BlogStatus.DRAFT : BlogStatus.PUBLISHED,
            publishedAt: postIndex % 20 === 0 ? undefined : new Date(Date.now() - (postIndex * 86400000)),
            authorId: marketingAdmin.id,
            categoryId: blogCategories[topic.category].id,
            viewCount: Math.floor(Math.random() * 5000) + 500,
            readingTime: topic.readTime,
          },
        })
      )
    }
    
    const createdPosts = await Promise.all(batchPosts)
    allBlogPosts.push(...createdPosts)
    console.log(`  ✓ Created blog post batch ${batch + 1}/4 (${allBlogPosts.length} posts)`)
  }

  // Add tags to posts in batches
  console.log('  Assigning tags to blog posts...')
  const allBlogPostTags: any[] = []
  
  for (let i = 0; i < allBlogPosts.length; i++) {
    const post = allBlogPosts[i]
    const topic = blogTopics[i]
    
    for (const tagIndex of topic.tags) {
      allBlogPostTags.push({
        postId: post.id,
        tagId: blogTags[tagIndex].id,
      })
    }
  }
  
  for (let i = 0; i < allBlogPostTags.length; i += 200) {
    await prisma.blogPostTag.createMany({
      data: allBlogPostTags.slice(i, i + 200)
    })
  }

  console.log('✅ Blog content created (100 comprehensive posts)')

  // ============================================================================
  // STEP 22: SUBSCRIPTION PLANS
  // ============================================================================
  console.log('💳 Creating subscription plans...')

  const freePlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Free',
      slug: 'free',
      description: 'Get started with basic features',
      tier: PlanTier.FREE,
      displayOrder: 1,
      trialDays: 0,
      isActive: true,
      isPublic: true,
    },
  })

  const starterPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Starter',
      slug: 'starter',
      description: 'Perfect for growing businesses',
      tier: PlanTier.STARTER,
      displayOrder: 2,
      trialDays: 14,
      isActive: true,
      isPublic: true,
    },
  })

  const proPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Professional',
      slug: 'professional',
      description: 'For established vendors',
      tier: PlanTier.PROFESSIONAL,
      displayOrder: 3,
      isPopular: true,
      trialDays: 14,
      isActive: true,
      isPublic: true,
    },
  })

  const enterprisePlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Custom solutions for large businesses',
      tier: PlanTier.ENTERPRISE,
      displayOrder: 4,
      trialDays: 30,
      isActive: true,
      isPublic: true,
    },
  })

  // Plan Features
  const featureData = [
    // Free plan
    { planId: freePlan.id, featureKey: 'leads_per_month', featureName: 'Leads per month', limitType: FeatureLimitType.COUNT_PER_MONTH, limitValue: 5, sortOrder: 1 },
    { planId: freePlan.id, featureKey: 'portfolio_photos', featureName: 'Portfolio photos', limitType: FeatureLimitType.COUNT, limitValue: 10, sortOrder: 2 },
    { planId: freePlan.id, featureKey: 'analytics', featureName: 'Basic analytics', limitType: FeatureLimitType.BOOLEAN, limitValue: 1, sortOrder: 3 },
    // Starter plan
    { planId: starterPlan.id, featureKey: 'leads_per_month', featureName: 'Leads per month', limitType: FeatureLimitType.COUNT_PER_MONTH, limitValue: 25, sortOrder: 1 },
    { planId: starterPlan.id, featureKey: 'portfolio_photos', featureName: 'Portfolio photos', limitType: FeatureLimitType.COUNT, limitValue: 50, sortOrder: 2 },
    { planId: starterPlan.id, featureKey: 'analytics', featureName: 'Advanced analytics', limitType: FeatureLimitType.BOOLEAN, limitValue: 1, isHighlighted: true, sortOrder: 3 },
    // Pro plan
    { planId: proPlan.id, featureKey: 'leads_per_month', featureName: 'Leads per month', limitType: FeatureLimitType.COUNT_PER_MONTH, limitValue: 100, sortOrder: 1 },
    { planId: proPlan.id, featureKey: 'portfolio_photos', featureName: 'Portfolio photos', limitType: FeatureLimitType.UNLIMITED, limitValue: null, sortOrder: 2 },
    { planId: proPlan.id, featureKey: 'featured_listing', featureName: 'Featured listing', limitType: FeatureLimitType.BOOLEAN, limitValue: 1, isHighlighted: true, sortOrder: 3 },
    { planId: proPlan.id, featureKey: 'priority_support', featureName: 'Priority support', limitType: FeatureLimitType.BOOLEAN, limitValue: 1, sortOrder: 4 },
    // Enterprise plan
    { planId: enterprisePlan.id, featureKey: 'leads_per_month', featureName: 'Leads per month', limitType: FeatureLimitType.UNLIMITED, limitValue: null, sortOrder: 1 },
    { planId: enterprisePlan.id, featureKey: 'portfolio_photos', featureName: 'Portfolio photos', limitType: FeatureLimitType.UNLIMITED, limitValue: null, sortOrder: 2 },
    { planId: enterprisePlan.id, featureKey: 'dedicated_account_manager', featureName: 'Dedicated account manager', limitType: FeatureLimitType.BOOLEAN, limitValue: 1, isHighlighted: true, sortOrder: 3 },
    { planId: enterprisePlan.id, featureKey: 'api_access', featureName: 'API access', limitType: FeatureLimitType.BOOLEAN, limitValue: 1, sortOrder: 4 },
  ]

  await prisma.planFeature.createMany({ data: featureData })

  // Plan Prices
  await prisma.planPrice.createMany({
    data: [
      { planId: freePlan.id, currency: 'USD', amount: 0, billingCycle: BillingCycle.MONTHLY, isActive: true },
      { planId: starterPlan.id, currency: 'USD', amount: 29, billingCycle: BillingCycle.MONTHLY, isActive: true },
      { planId: starterPlan.id, currency: 'USD', amount: 290, billingCycle: BillingCycle.YEARLY, savingsPercent: 17, isActive: true },
      { planId: proPlan.id, currency: 'USD', amount: 79, billingCycle: BillingCycle.MONTHLY, isActive: true },
      { planId: proPlan.id, currency: 'USD', amount: 790, billingCycle: BillingCycle.YEARLY, savingsPercent: 17, isActive: true },
      { planId: enterprisePlan.id, currency: 'USD', amount: 199, billingCycle: BillingCycle.MONTHLY, isActive: true },
      { planId: enterprisePlan.id, currency: 'USD', amount: 1990, billingCycle: BillingCycle.YEARLY, savingsPercent: 17, isActive: true },
    ],
  })

  // Coupons
  await prisma.coupon.createMany({
    data: [
      { code: 'WELCOME20', name: 'Welcome Discount', description: '20% off your first subscription', discountType: DiscountType.PERCENTAGE, discountValue: 20, appliesTo: CouponAppliesTo.PAID_PLANS_ONLY, duration: CouponDuration.ONCE, maxRedemptions: 1000, validFrom: new Date(), validUntil: new Date('2025-12-31'), isActive: true },
      { code: 'YEARLYBONUS', name: 'Yearly Bonus', description: '$50 off yearly subscriptions', discountType: DiscountType.FIXED_AMOUNT, discountValue: 50, appliesTo: CouponAppliesTo.ALL_PLANS, duration: CouponDuration.ONCE, maxRedemptions: 500, minAmount: 100, validFrom: new Date(), validUntil: new Date('2025-06-30'), isActive: true },
    ],
  })

  console.log('✅ Subscription plans created')

  // ============================================================================
  // STEP 23: NOTIFICATIONS
  // ============================================================================
  console.log('🔔 Creating notifications...')

  await prisma.notification.createMany({
    data: [
      { userId: plannerUsers[0].id, type: NotificationType.NEW_LEAD, title: 'New lead response', message: 'John Smith Photography has responded to your inquiry!', channel: NotificationChannel.IN_APP, isRead: false },
      { userId: plannerUsers[0].id, type: NotificationType.EVENT_REMINDER, title: 'Event in 30 days', message: 'Your wedding is coming up in 30 days. Review your checklist!', channel: NotificationChannel.IN_APP, isRead: true, readAt: new Date() },
      { userId: vendorUsers[0].id, type: NotificationType.NEW_LEAD, title: 'New inquiry', message: 'You have a new inquiry from Emma Johnson for a June 2025 wedding.', channel: NotificationChannel.IN_APP, isRead: false },
      { userId: vendorUsers[0].id, type: NotificationType.PROFILE_APPROVED, title: 'Profile approved', message: 'Congratulations! Your vendor profile has been approved and is now live.', channel: NotificationChannel.IN_APP, isRead: true, readAt: new Date() },
    ],
  })

  console.log('✅ Notifications created')

  // ============================================================================
  // COMPLETE
  // ============================================================================
  console.log('')
  console.log('🎉 Seed completed successfully!')
  console.log('')
  console.log('📊 Summary:')
  console.log(`   - Countries: 3`)
  console.log(`   - States: 8`)
  console.log(`   - Cities: 16`)
  console.log(`   - Users: ${6 + vendorUsers.length + plannerUsers.length}`)
  console.log(`   - Vendor Profiles: ${vendorProfiles.length}`)
  console.log(`   - Portfolios: ${allPortfolios.length}`)
  console.log(`   - Media Items: ~${allMediaItems.length}`)
  console.log(`   - Categories: 8`)
  console.log(`   - Events: ${events.length}`)
  console.log(`   - Leads: ${leads.length}`)
  console.log(`   - Blog Posts: 100`)
  console.log(`   - Blog Categories: 8`)
  console.log(`   - Subscription Plans: 4`)
  console.log('')
  console.log('🔑 Test Credentials (Password: Password123!):')
  console.log('   - Admin: admin@omnicassion.com')
  console.log('   - Ops Admin: ops.admin@omnicassion.com')
  console.log('   - Ops Manager: ops.manager@omnicassion.com')
  console.log('   - Vendor: vendor1@example.com (or vendor2, vendor3... up to vendor1000)')
  console.log('   - Planner: emma.planner@example.com')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
